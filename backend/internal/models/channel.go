package models

import "time"

// WhatsApp Business API Integration Models

// ChannelConnection represents a communication channel for a website
type ChannelConnection struct {
	ID                int64                  `json:"id" db:"id"`
	TenantID          string                 `json:"tenant_id" db:"tenant_id"`
	WebsiteID         int64                  `json:"website_id" db:"website_id"`
	ChannelType       string                 `json:"channel_type" db:"channel_type"` // web, whatsapp, facebook, etc.
	ChannelName       string                 `json:"channel_name" db:"channel_name"`
	Credentials       map[string]interface{} `json:"credentials" db:"credentials"`
	IsActive          bool                   `json:"is_active" db:"is_active"`
	AutoRespond       bool                   `json:"auto_respond" db:"auto_respond"`
	BusinessHoursOnly bool                   `json:"business_hours_only" db:"business_hours_only"`
	ConnectionStatus  string                 `json:"connection_status" db:"connection_status"` // active, disconnected, error, pending
	LastConnectedAt   *time.Time             `json:"last_connected_at,omitempty" db:"last_connected_at"`
	CreatedAt         time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at" db:"updated_at"`
}

// WhatsAppCredentials represents WhatsApp Business API credentials
type WhatsAppCredentials struct {
	PhoneNumberID      string `json:"phone_number_id"`
	AccessToken        string `json:"access_token"`
	BusinessAccountID  string `json:"business_account_id"`
	WebhookVerifyToken string `json:"webhook_verify_token"`
	APIVersion         string `json:"api_version"`
}

// WhatsAppWebhookPayload represents incoming WhatsApp webhook
type WhatsAppWebhookPayload struct {
	Object string `json:"object"`
	Entry  []struct {
		ID      string `json:"id"`
		Changes []struct {
			Value struct {
				MessagingProduct string `json:"messaging_product"`
				Metadata         struct {
					DisplayPhoneNumber string `json:"display_phone_number"`
					PhoneNumberID      string `json:"phone_number_id"`
				} `json:"metadata"`
				Contacts []struct {
					Profile struct {
						Name string `json:"name"`
					} `json:"profile"`
					WaID string `json:"wa_id"`
				} `json:"contacts"`
				Messages []WhatsAppMessage `json:"messages"`
				Statuses []struct {
					ID          string `json:"id"`
					Status      string `json:"status"`
					Timestamp   string `json:"timestamp"`
					RecipientID string `json:"recipient_id"`
				} `json:"statuses"`
			} `json:"value"`
			Field string `json:"field"`
		} `json:"changes"`
	} `json:"entry"`
}

// WhatsAppMessage represents a WhatsApp message
type WhatsAppMessage struct {
	From      string `json:"from"`
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Type      string `json:"type"` // text, image, document, audio, video
	Text      *struct {
		Body string `json:"body"`
	} `json:"text,omitempty"`
	Image *struct {
		Caption  string `json:"caption"`
		MimeType string `json:"mime_type"`
		SHA256   string `json:"sha256"`
		ID       string `json:"id"`
	} `json:"image,omitempty"`
	Document *struct {
		Caption  string `json:"caption"`
		Filename string `json:"filename"`
		MimeType string `json:"mime_type"`
		SHA256   string `json:"sha256"`
		ID       string `json:"id"`
	} `json:"document,omitempty"`
	Audio *struct {
		MimeType string `json:"mime_type"`
		SHA256   string `json:"sha256"`
		ID       string `json:"id"`
		Voice    bool   `json:"voice"`
	} `json:"audio,omitempty"`
	Video *struct {
		Caption  string `json:"caption"`
		MimeType string `json:"mime_type"`
		SHA256   string `json:"sha256"`
		ID       string `json:"id"`
	} `json:"video,omitempty"`
}

// WhatsAppSendRequest represents a message to send via WhatsApp
type WhatsAppSendRequest struct {
	MessagingProduct string `json:"messaging_product"`
	RecipientType    string `json:"recipient_type"`
	To               string `json:"to"`
	Type             string `json:"type"`
	Text             *struct {
		PreviewURL bool   `json:"preview_url"`
		Body       string `json:"body"`
	} `json:"text,omitempty"`
}

// CreateChannelRequest represents the request to create a new channel
type CreateChannelRequest struct {
	ChannelType       string                 `json:"channel_type" binding:"required"`
	ChannelName       string                 `json:"channel_name" binding:"required"`
	Credentials       map[string]interface{} `json:"credentials" binding:"required"`
	AutoRespond       bool                   `json:"auto_respond"`
	BusinessHoursOnly bool                   `json:"business_hours_only"`
}

// UpdateChannelRequest represents the request to update a channel
type UpdateChannelRequest struct {
	ChannelName       string                 `json:"channel_name"`
	Credentials       map[string]interface{} `json:"credentials"`
	IsActive          *bool                  `json:"is_active"`
	AutoRespond       *bool                  `json:"auto_respond"`
	BusinessHoursOnly *bool                  `json:"business_hours_only"`
}

// ChannelTestResponse represents the response from testing a channel connection
type ChannelTestResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}
