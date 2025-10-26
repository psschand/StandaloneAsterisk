package dto

import "github.com/psschand/callcenter/internal/websocket"

// CreateWebhookRequest represents a webhook creation request
type CreateWebhookRequest struct {
	Name       string                  `json:"name" binding:"required"`
	URL        string                  `json:"url" binding:"required,url"`
	Events     []websocket.MessageType `json:"events" binding:"required,min=1"`
	Secret     string                  `json:"secret"`
	RetryCount int                     `json:"retry_count"`
	Timeout    int                     `json:"timeout"`
}

// UpdateWebhookRequest represents a webhook update request
type UpdateWebhookRequest struct {
	Name       string                  `json:"name"`
	URL        string                  `json:"url" binding:"omitempty,url"`
	Events     []websocket.MessageType `json:"events"`
	Secret     string                  `json:"secret"`
	RetryCount int                     `json:"retry_count"`
	Timeout    int                     `json:"timeout"`
}

// WebhookResponse represents a webhook configuration response
type WebhookResponse struct {
	ID         int64                   `json:"id"`
	TenantID   string                  `json:"tenant_id"`
	Name       string                  `json:"name"`
	URL        string                  `json:"url"`
	Events     []websocket.MessageType `json:"events"`
	IsActive   bool                    `json:"is_active"`
	RetryCount int                     `json:"retry_count"`
	Timeout    int                     `json:"timeout"`
	CreatedAt  string                  `json:"created_at"`
	UpdatedAt  string                  `json:"updated_at"`
}
