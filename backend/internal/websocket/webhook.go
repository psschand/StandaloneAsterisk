package websocket

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// WebhookDelivery represents a webhook delivery attempt
type WebhookDelivery struct {
	WebhookID    int64
	URL          string
	Event        MessageType
	Payload      interface{}
	Secret       string
	Attempt      int
	MaxRetries   int
	Timeout      time.Duration
	DeliveredAt  time.Time
	ResponseCode int
	ResponseBody string
	Error        string
}

// WebhookManager manages webhook delivery
type WebhookManager struct {
	httpClient *http.Client
	deliveries chan *WebhookDelivery
	maxWorkers int
}

// NewWebhookManager creates a new webhook manager
func NewWebhookManager(maxWorkers int) *WebhookManager {
	return &WebhookManager{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		deliveries: make(chan *WebhookDelivery, 100),
		maxWorkers: maxWorkers,
	}
}

// Start starts the webhook workers
func (wm *WebhookManager) Start() {
	for i := 0; i < wm.maxWorkers; i++ {
		go wm.worker()
	}
	log.Printf("Started %d webhook workers", wm.maxWorkers)
}

// worker processes webhook deliveries
func (wm *WebhookManager) worker() {
	for delivery := range wm.deliveries {
		wm.deliver(delivery)
	}
}

// Deliver queues a webhook for delivery
func (wm *WebhookManager) Deliver(delivery *WebhookDelivery) {
	wm.deliveries <- delivery
}

// deliver sends the webhook HTTP request
func (wm *WebhookManager) deliver(delivery *WebhookDelivery) {
	// Prepare payload
	webhookPayload := map[string]interface{}{
		"event":     delivery.Event,
		"timestamp": time.Now().Unix(),
		"data":      delivery.Payload,
	}

	payloadBytes, err := json.Marshal(webhookPayload)
	if err != nil {
		log.Printf("Failed to marshal webhook payload: %v", err)
		return
	}

	// Create request
	ctx, cancel := context.WithTimeout(context.Background(), delivery.Timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", delivery.URL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		log.Printf("Failed to create webhook request: %v", err)
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "CallCenter-Webhook/1.0")
	req.Header.Set("X-Webhook-Event", string(delivery.Event))
	req.Header.Set("X-Webhook-ID", fmt.Sprintf("%d", delivery.WebhookID))
	req.Header.Set("X-Webhook-Attempt", fmt.Sprintf("%d", delivery.Attempt))

	// Add signature if secret is provided
	if delivery.Secret != "" {
		signature := wm.generateSignature(payloadBytes, delivery.Secret)
		req.Header.Set("X-Webhook-Signature", signature)
	}

	// Send request
	startTime := time.Now()
	resp, err := wm.httpClient.Do(req)
	duration := time.Since(startTime)

	if err != nil {
		delivery.Error = err.Error()
		log.Printf("Webhook delivery failed (attempt %d/%d): %v",
			delivery.Attempt, delivery.MaxRetries, err)

		// Retry if attempts remaining
		if delivery.Attempt < delivery.MaxRetries {
			delivery.Attempt++
			time.Sleep(time.Duration(delivery.Attempt) * time.Second) // Exponential backoff
			wm.deliveries <- delivery
		}
		return
	}
	defer resp.Body.Close()

	// Read response
	bodyBytes, _ := io.ReadAll(resp.Body)
	delivery.ResponseCode = resp.StatusCode
	delivery.ResponseBody = string(bodyBytes)
	delivery.DeliveredAt = time.Now()

	// Log delivery
	log.Printf("Webhook delivered: URL=%s Event=%s Status=%d Duration=%v",
		delivery.URL, delivery.Event, resp.StatusCode, duration)

	// Retry on error status codes
	if resp.StatusCode >= 500 && delivery.Attempt < delivery.MaxRetries {
		delivery.Attempt++
		time.Sleep(time.Duration(delivery.Attempt) * time.Second)
		wm.deliveries <- delivery
		return
	}

	// TODO: Save delivery log to database
	// This would call a repository to save the webhook_logs entry
}

// generateSignature creates HMAC SHA256 signature
func (wm *WebhookManager) generateSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifySignature verifies webhook signature (for incoming webhooks)
func VerifySignature(payload []byte, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// EventWebhookBroadcaster broadcasts events to both WebSocket and Webhooks
type EventWebhookBroadcaster struct {
	hub            *Hub
	webhookManager *WebhookManager
	webhookRepo    WebhookRepository // Interface to get webhook configs from DB
}

// WebhookRepository interface for fetching webhook configurations
type WebhookRepository interface {
	GetActiveWebhooksByTenant(ctx context.Context, tenantID string) ([]*WebhookConfig, error)
	GetWebhooksByEvent(ctx context.Context, tenantID string, event MessageType) ([]*WebhookConfig, error)
	LogWebhookDelivery(ctx context.Context, log *WebhookLog) error
}

// WebhookConfig represents a webhook configuration
type WebhookConfig struct {
	ID         int64
	TenantID   string
	Name       string
	URL        string
	Events     []MessageType
	Secret     string
	IsActive   bool
	RetryCount int
	Timeout    int
}

// WebhookLog represents a webhook delivery log entry
type WebhookLog struct {
	ID           int64
	WebhookID    int64
	Event        MessageType
	Payload      json.RawMessage
	ResponseCode int
	ResponseBody string
	Error        string
	DurationMS   int
	Attempt      int
	CreatedAt    time.Time
}

// NewEventWebhookBroadcaster creates broadcaster with webhook support
func NewEventWebhookBroadcaster(hub *Hub, webhookManager *WebhookManager, webhookRepo WebhookRepository) *EventWebhookBroadcaster {
	return &EventWebhookBroadcaster{
		hub:            hub,
		webhookManager: webhookManager,
		webhookRepo:    webhookRepo,
	}
}

// BroadcastEvent broadcasts to both WebSocket and Webhooks
func (ewb *EventWebhookBroadcaster) BroadcastEvent(tenantID string, msgType MessageType, payload interface{}) error {
	// Broadcast to WebSocket
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	ewb.hub.BroadcastToTenant(tenantID, msg)

	// Send to webhooks if configured
	if ewb.webhookRepo != nil {
		go ewb.sendToWebhooks(tenantID, msgType, payload)
	}

	return nil
}

// sendToWebhooks delivers event to configured webhooks
func (ewb *EventWebhookBroadcaster) sendToWebhooks(tenantID string, msgType MessageType, payload interface{}) {
	ctx := context.Background()

	// Get webhooks for this tenant and event
	webhooks, err := ewb.webhookRepo.GetWebhooksByEvent(ctx, tenantID, msgType)
	if err != nil {
		log.Printf("Failed to get webhooks: %v", err)
		return
	}

	// Queue delivery for each webhook
	for _, webhook := range webhooks {
		if !webhook.IsActive {
			continue
		}

		delivery := &WebhookDelivery{
			WebhookID:  webhook.ID,
			URL:        webhook.URL,
			Event:      msgType,
			Payload:    payload,
			Secret:     webhook.Secret,
			Attempt:    1,
			MaxRetries: webhook.RetryCount,
			Timeout:    time.Duration(webhook.Timeout) * time.Second,
		}

		ewb.webhookManager.Deliver(delivery)
	}
}

// Convenience methods for specific events

// BroadcastAgentState broadcasts agent state to WebSocket and webhooks
func (ewb *EventWebhookBroadcaster) BroadcastAgentState(tenantID string, payload *AgentStatePayload) error {
	return ewb.BroadcastEvent(tenantID, MessageTypeAgentStateChanged, payload)
}

// BroadcastCallEvent broadcasts call event to WebSocket and webhooks
func (ewb *EventWebhookBroadcaster) BroadcastCallEvent(tenantID string, msgType MessageType, payload *CallEventPayload) error {
	return ewb.BroadcastEvent(tenantID, msgType, payload)
}

// BroadcastChatMessage broadcasts chat message to WebSocket and webhooks
func (ewb *EventWebhookBroadcaster) BroadcastChatMessage(tenantID string, payload *ChatMessagePayload) error {
	return ewb.BroadcastEvent(tenantID, MessageTypeChatMessage, payload)
}

// BroadcastQueueStats broadcasts queue stats to WebSocket and webhooks
func (ewb *EventWebhookBroadcaster) BroadcastQueueStats(tenantID string, payload *QueueStatsPayload) error {
	return ewb.BroadcastEvent(tenantID, MessageTypeQueueStats, payload)
}

// TestWebhook sends a test event to a webhook
func (wm *WebhookManager) TestWebhook(url, secret string) error {
	testPayload := map[string]interface{}{
		"event":     "webhook.test",
		"timestamp": time.Now().Unix(),
		"data": map[string]string{
			"message": "This is a test webhook from CallCenter",
		},
	}

	payloadBytes, _ := json.Marshal(testPayload)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-Event", "webhook.test")

	if secret != "" {
		signature := wm.generateSignature(payloadBytes, secret)
		req.Header.Set("X-Webhook-Signature", signature)
	}

	resp, err := wm.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("webhook test failed with status %d", resp.StatusCode)
	}

	return nil
}
