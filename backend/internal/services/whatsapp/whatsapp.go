package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/psschand/callcenter/internal/models"
)

const (
	WhatsAppAPIBaseURL = "https://graph.facebook.com"
	DefaultAPIVersion  = "v18.0"
)

// Service handles WhatsApp Business API operations
type Service struct {
	httpClient *http.Client
}

// NewService creates a new WhatsApp service
func NewService() *Service {
	return &Service{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SendTextMessage sends a text message via WhatsApp
func (s *Service) SendTextMessage(phoneNumberID, accessToken, to, message string) error {
	url := fmt.Sprintf("%s/%s/%s/messages", WhatsAppAPIBaseURL, DefaultAPIVersion, phoneNumberID)

	payload := models.WhatsAppSendRequest{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "text",
		Text: &struct {
			PreviewURL bool   `json:"preview_url"`
			Body       string `json:"body"`
		}{
			PreviewURL: false,
			Body:       message,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("WhatsApp API error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// TestConnection verifies WhatsApp credentials by attempting to get phone number info
func (s *Service) TestConnection(phoneNumberID, accessToken string) (bool, string) {
	url := fmt.Sprintf("%s/%s/%s?fields=verified_name,display_phone_number",
		WhatsAppAPIBaseURL, DefaultAPIVersion, phoneNumberID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, fmt.Sprintf("Failed to create request: %v", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return false, fmt.Sprintf("Failed to connect to WhatsApp API: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Sprintf("WhatsApp API error (status %d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		VerifiedName       string `json:"verified_name"`
		DisplayPhoneNumber string `json:"display_phone_number"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return false, fmt.Sprintf("Failed to parse response: %v", err)
	}

	return true, fmt.Sprintf("Connected successfully! Business: %s, Phone: %s",
		result.VerifiedName, result.DisplayPhoneNumber)
}

// VerifyWebhook verifies the webhook callback from WhatsApp
func (s *Service) VerifyWebhook(mode, token, challenge, verifyToken string) (string, bool) {
	if mode == "subscribe" && token == verifyToken {
		return challenge, true
	}
	return "", false
}

// ParseWebhookPayload parses the incoming WhatsApp webhook payload
func (s *Service) ParseWebhookPayload(body []byte) (*models.WhatsAppWebhookPayload, error) {
	var payload models.WhatsAppWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("failed to parse webhook payload: %w", err)
	}
	return &payload, nil
}

// ExtractMessage extracts message details from webhook payload
func (s *Service) ExtractMessage(payload *models.WhatsAppWebhookPayload) (phoneNumber, senderName, messageBody, messageID, messageType string, hasMessage bool) {
	if len(payload.Entry) == 0 || len(payload.Entry[0].Changes) == 0 {
		return
	}

	change := payload.Entry[0].Changes[0]
	if len(change.Value.Messages) == 0 {
		return
	}

	message := change.Value.Messages[0]
	phoneNumber = message.From
	messageID = message.ID
	messageType = message.Type

	// Get sender name
	if len(change.Value.Contacts) > 0 {
		senderName = change.Value.Contacts[0].Profile.Name
	}

	// Extract message body based on type
	switch message.Type {
	case "text":
		if message.Text != nil {
			messageBody = message.Text.Body
		}
	case "image":
		if message.Image != nil {
			messageBody = fmt.Sprintf("[Image] %s", message.Image.Caption)
		}
	case "document":
		if message.Document != nil {
			messageBody = fmt.Sprintf("[Document: %s] %s", message.Document.Filename, message.Document.Caption)
		}
	case "audio":
		messageBody = "[Audio Message]"
	case "video":
		if message.Video != nil {
			messageBody = fmt.Sprintf("[Video] %s", message.Video.Caption)
		}
	}

	hasMessage = true
	return
}
