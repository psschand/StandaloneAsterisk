package repository

import (
	"context"
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"github.com/psschand/callcenter/internal/websocket"
)

// WebhookRepository handles webhook configuration persistence
type WebhookRepository struct {
	db *gorm.DB
}

// NewWebhookRepository creates a new webhook repository
func NewWebhookRepository(db *gorm.DB) *WebhookRepository {
	return &WebhookRepository{db: db}
}

// GetActiveWebhooksByTenant retrieves all active webhooks for a tenant
func (r *WebhookRepository) GetActiveWebhooksByTenant(ctx context.Context, tenantID string) ([]*websocket.WebhookConfig, error) {
	var webhooks []*websocket.WebhookConfig

	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND is_active = ?", tenantID, true).
		Find(&webhooks).Error

	return webhooks, err
}

// GetWebhooksByEvent retrieves webhooks for a specific event type
func (r *WebhookRepository) GetWebhooksByEvent(ctx context.Context, tenantID string, event websocket.MessageType) ([]*websocket.WebhookConfig, error) {
	var webhooks []*websocket.WebhookConfig

	// Query webhooks where the events JSON array contains the event type
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND is_active = ?", tenantID, true).
		Find(&webhooks).Error

	if err != nil {
		return nil, err
	}

	// Filter by event in application code (since JSON_CONTAINS may not work on all DBs)
	var filtered []*websocket.WebhookConfig
	for _, webhook := range webhooks {
		for _, e := range webhook.Events {
			if e == event {
				filtered = append(filtered, webhook)
				break
			}
		}
	}

	return filtered, nil
}

// LogWebhookDelivery saves a webhook delivery log entry
func (r *WebhookRepository) LogWebhookDelivery(ctx context.Context, log *websocket.WebhookLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

// CreateWebhook creates a new webhook configuration
func (r *WebhookRepository) CreateWebhook(ctx context.Context, webhook *websocket.WebhookConfig) error {
	return r.db.WithContext(ctx).Create(webhook).Error
}

// UpdateWebhook updates a webhook configuration
func (r *WebhookRepository) UpdateWebhook(ctx context.Context, webhook *websocket.WebhookConfig) error {
	return r.db.WithContext(ctx).Save(webhook).Error
}

// DeleteWebhook deletes a webhook (soft delete by setting is_active = false)
func (r *WebhookRepository) DeleteWebhook(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).
		Model(&websocket.WebhookConfig{}).
		Where("id = ?", id).
		Update("is_active", false).Error
}

// GetWebhook retrieves a single webhook by ID
func (r *WebhookRepository) GetWebhook(ctx context.Context, id int64) (*websocket.WebhookConfig, error) {
	var webhook websocket.WebhookConfig
	err := r.db.WithContext(ctx).First(&webhook, id).Error
	return &webhook, err
}

// GetWebhookLogs retrieves delivery logs for a webhook
func (r *WebhookRepository) GetWebhookLogs(ctx context.Context, webhookID int64, limit int) ([]*websocket.WebhookLog, error) {
	var logs []*websocket.WebhookLog

	err := r.db.WithContext(ctx).
		Where("webhook_id = ?", webhookID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error

	return logs, err
}

// GetFailedWebhookLogs retrieves failed delivery logs
func (r *WebhookRepository) GetFailedWebhookLogs(ctx context.Context, tenantID string, since time.Time) ([]*websocket.WebhookLog, error) {
	var logs []*websocket.WebhookLog

	err := r.db.WithContext(ctx).
		Joins("JOIN webhooks ON webhooks.id = webhook_logs.webhook_id").
		Where("webhooks.tenant_id = ? AND webhook_logs.response_code >= ? AND webhook_logs.created_at > ?",
			tenantID, 400, since).
		Order("webhook_logs.created_at DESC").
		Find(&logs).Error

	return logs, err
}

// GetWebhookStats retrieves statistics for webhook deliveries
func (r *WebhookRepository) GetWebhookStats(ctx context.Context, webhookID int64, since time.Time) (map[string]interface{}, error) {
	var stats struct {
		TotalDeliveries  int64
		SuccessfulCount  int64
		FailedCount      int64
		AverageLatencyMS float64
	}

	// Total deliveries
	r.db.WithContext(ctx).
		Model(&websocket.WebhookLog{}).
		Where("webhook_id = ? AND created_at > ?", webhookID, since).
		Count(&stats.TotalDeliveries)

	// Successful deliveries
	r.db.WithContext(ctx).
		Model(&websocket.WebhookLog{}).
		Where("webhook_id = ? AND response_code >= ? AND response_code < ? AND created_at > ?",
			webhookID, 200, 300, since).
		Count(&stats.SuccessfulCount)

	// Failed deliveries
	stats.FailedCount = stats.TotalDeliveries - stats.SuccessfulCount

	// Average latency
	r.db.WithContext(ctx).
		Model(&websocket.WebhookLog{}).
		Where("webhook_id = ? AND created_at > ?", webhookID, since).
		Select("AVG(duration_ms)").
		Scan(&stats.AverageLatencyMS)

	successRate := 0.0
	if stats.TotalDeliveries > 0 {
		successRate = float64(stats.SuccessfulCount) / float64(stats.TotalDeliveries) * 100
	}

	return map[string]interface{}{
		"total_deliveries": stats.TotalDeliveries,
		"successful_count": stats.SuccessfulCount,
		"failed_count":     stats.FailedCount,
		"success_rate":     successRate,
		"avg_latency_ms":   stats.AverageLatencyMS,
	}, nil
}

// TestWebhook tests a webhook endpoint
func (r *WebhookRepository) TestWebhook(ctx context.Context, webhookID int64) error {
	webhook, err := r.GetWebhook(ctx, webhookID)
	if err != nil {
		return err
	}

	// Create test payload
	testPayload := map[string]interface{}{
		"event":     "webhook.test",
		"timestamp": time.Now().Unix(),
		"data": map[string]string{
			"message": "This is a test webhook from CallCenter",
		},
	}

	payloadBytes, _ := json.Marshal(testPayload)

	// TODO: Call webhook manager to test
	// This would need access to WebhookManager
	_ = webhook
	_ = payloadBytes

	return nil
}
