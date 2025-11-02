package chat

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ChatService handles chat operations
type ChatService struct {
	db      *gorm.DB
	aiAgent *AIAgentService
}

// NewChatService creates a new chat service
func NewChatService(db *gorm.DB, aiAgent *AIAgentService) *ChatService {
	return &ChatService{
		db:      db,
		aiAgent: aiAgent,
	}
}

// CreateConversation creates a new conversation
func (s *ChatService) CreateConversation(ctx context.Context, req *CreateConversationRequest) (*Conversation, error) {
	conv := &Conversation{
		TenantID:      req.TenantID,
		CustomerName:  req.CustomerName,
		CustomerPhone: req.CustomerPhone,
		CustomerEmail: req.CustomerEmail,
		Channel:       req.Channel,
		ExternalID:    req.ExternalID,
		Status:        "bot",
		Language:      req.Language,
		StartedAt:     time.Now(),
		LastMessageAt: time.Now(),
	}

	if req.Language == "" {
		conv.Language = "en"
	}

	if err := s.db.Create(conv).Error; err != nil {
		return nil, fmt.Errorf("failed to create conversation: %w", err)
	}

	// Send greeting message
	greeting := s.aiAgent.CreateGreeting(req.TenantID)
	_, err := s.SendMessage(ctx, &SendMessageRequest{
		ConversationID: conv.ID,
		SenderType:     "bot",
		Content:        greeting,
	})

	if err != nil {
		// Log error but don't fail conversation creation
		fmt.Printf("Failed to send greeting: %v\n", err)
	}

	return conv, nil
}

// SendMessage sends a message in a conversation
func (s *ChatService) SendMessage(ctx context.Context, req *SendMessageRequest) (*Message, error) {
	msg := &Message{
		ConversationID: req.ConversationID,
		SenderType:     req.SenderType,
		SenderID:       req.SenderID,
		SenderName:     req.SenderName,
		Content:        req.Content,
		MessageType:    req.MessageType,
		MediaURL:       req.MediaURL,
		IsInternalNote: req.IsInternalNote,
		SentAt:         time.Now(),
	}

	if msg.MessageType == "" {
		msg.MessageType = "text"
	}

	// Save message
	if err := s.db.Create(msg).Error; err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Update conversation last message time
	s.db.Model(&Conversation{}).
		Where("id = ?", req.ConversationID).
		Update("last_message_at", time.Now())

	// If customer message and status is 'bot', process with AI
	if req.SenderType == "customer" {
		go s.processCustomerMessage(context.Background(), msg)
	}

	return msg, nil
}

// processCustomerMessage processes customer message with AI agent
func (s *ChatService) processCustomerMessage(ctx context.Context, msg *Message) {
	// Get conversation
	var conv Conversation
	if err := s.db.First(&conv, msg.ConversationID).Error; err != nil {
		fmt.Printf("Failed to get conversation: %v\n", err)
		return
	}

	// Only process if status is 'bot'
	if conv.Status != "bot" {
		return
	}

	// Process with AI
	response, err := s.aiAgent.ProcessMessage(ctx, conv.TenantID, conv.ID, msg.Content)
	if err != nil {
		fmt.Printf("AI processing error: %v\n", err)
		return
	}

	// Update message with AI analysis
	s.db.Model(msg).Updates(map[string]interface{}{
		"intent":    response.Intent,
		"sentiment": response.Sentiment,
		"entities":  toJSON(response.Entities),
	})

	// Handle response action
	switch response.Action {
	case "continue":
		// Send bot response
		botMsg := &Message{
			ConversationID: conv.ID,
			SenderType:     "bot",
			SenderName:     "AI Assistant",
			Content:        response.Content,
			MessageType:    "text",
			Confidence:     &response.Confidence,
			Intent:         response.Intent,
			SentAt:         time.Now(),
		}
		s.db.Create(botMsg)

	case "handoff":
		// Transfer to human agent
		s.db.Model(&conv).Updates(map[string]interface{}{
			"status":               "queued",
			"handoff_reason":       response.HandoffReason,
			"handoff_triggered_by": "bot",
			"assigned_queue_id":    response.QueueID,
		})

		// Send handoff message
		botMsg := &Message{
			ConversationID: conv.ID,
			SenderType:     "system",
			SenderName:     "System",
			Content:        response.Content,
			MessageType:    "text",
			SentAt:         time.Now(),
		}
		s.db.Create(botMsg)

	case "close":
		s.db.Model(&conv).Updates(map[string]interface{}{
			"status":    "closed",
			"closed_at": time.Now(),
		})
	}
}

// GetConversations gets conversations for a tenant
func (s *ChatService) GetConversations(ctx context.Context, req *GetConversationsRequest) ([]Conversation, int64, error) {
	query := s.db.Model(&Conversation{}).Where("tenant_id = ?", req.TenantID)

	// Filters
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.Channel != "" {
		query = query.Where("channel = ?", req.Channel)
	}
	if req.AssignedAgentID != nil {
		query = query.Where("assigned_agent_id = ?", *req.AssignedAgentID)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get conversations
	var conversations []Conversation
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("last_message_at DESC").
		Offset(offset).
		Limit(req.PageSize).
		Find(&conversations).Error; err != nil {
		return nil, 0, err
	}

	return conversations, total, nil
}

// GetMessages gets messages for a conversation
func (s *ChatService) GetMessages(ctx context.Context, conversationID int64, limit int) ([]Message, error) {
	var messages []Message
	query := s.db.Where("conversation_id = ?", conversationID).
		Order("sent_at ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&messages).Error; err != nil {
		return nil, err
	}

	return messages, nil
}

// AssignToAgent assigns a conversation to an agent
func (s *ChatService) AssignToAgent(ctx context.Context, conversationID int64, agentID int64) error {
	return s.db.Model(&Conversation{}).
		Where("id = ?", conversationID).
		Updates(map[string]interface{}{
			"status":            "agent",
			"assigned_agent_id": agentID,
			"assigned_at":       time.Now(),
		}).Error
}

// TakeoverConversation allows agent to take over from bot
func (s *ChatService) TakeoverConversation(ctx context.Context, conversationID int64, agentID int64) error {
	var conv Conversation
	if err := s.db.First(&conv, conversationID).Error; err != nil {
		return err
	}

	if conv.Status != "bot" && conv.Status != "queued" {
		return errors.New("conversation cannot be taken over")
	}

	return s.db.Model(&conv).Updates(map[string]interface{}{
		"status":               "agent",
		"assigned_agent_id":    agentID,
		"assigned_at":          time.Now(),
		"handoff_triggered_by": "agent",
	}).Error
}

// CloseConversation closes a conversation
func (s *ChatService) CloseConversation(ctx context.Context, conversationID int64, rating *int8, feedback string) error {
	updates := map[string]interface{}{
		"status":    "closed",
		"closed_at": time.Now(),
	}

	if rating != nil {
		updates["customer_rating"] = *rating
	}
	if feedback != "" {
		updates["customer_feedback"] = feedback
	}

	// Calculate resolution time
	var conv Conversation
	if err := s.db.First(&conv, conversationID).Error; err == nil {
		resolutionTime := int(time.Since(conv.StartedAt).Seconds())
		updates["resolution_time"] = resolutionTime
	}

	return s.db.Model(&Conversation{}).
		Where("id = ?", conversationID).
		Updates(updates).Error
}

// MarkMessagesAsRead marks messages as read
func (s *ChatService) MarkMessagesAsRead(ctx context.Context, conversationID int64, agentID int64) error {
	return s.db.Model(&Message{}).
		Where("conversation_id = ? AND sender_type = 'customer' AND is_read = false", conversationID).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": time.Now(),
		}).Error
}

// GetUnreadCount gets unread message count for agent
func (s *ChatService) GetUnreadCount(ctx context.Context, tenantID string, agentID *int64) (int64, error) {
	query := s.db.Model(&Message{}).
		Joins("JOIN conversations ON conversations.id = messages.conversation_id").
		Where("conversations.tenant_id = ? AND messages.sender_type = 'customer' AND messages.is_read = false", tenantID)

	if agentID != nil {
		query = query.Where("conversations.assigned_agent_id = ?", *agentID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// Request/Response structs
type CreateConversationRequest struct {
	TenantID      string `json:"tenant_id" binding:"required"`
	CustomerName  string `json:"customer_name"`
	CustomerPhone string `json:"customer_phone"`
	CustomerEmail string `json:"customer_email"`
	Channel       string `json:"channel" binding:"required"`
	ExternalID    string `json:"external_id"`
	Language      string `json:"language"`
}

type SendMessageRequest struct {
	ConversationID int64  `json:"conversation_id" binding:"required"`
	SenderType     string `json:"sender_type" binding:"required"` // customer, agent, bot
	SenderID       *int64 `json:"sender_id"`
	SenderName     string `json:"sender_name"`
	Content        string `json:"content" binding:"required"`
	MessageType    string `json:"message_type"` // text, image, etc.
	MediaURL       string `json:"media_url"`
	IsInternalNote bool   `json:"is_internal_note"`
}

type GetConversationsRequest struct {
	TenantID        string `json:"tenant_id" binding:"required"`
	Status          string `json:"status"`
	Channel         string `json:"channel"`
	AssignedAgentID *int64 `json:"assigned_agent_id"`
	Page            int    `json:"page"`
	PageSize        int    `json:"page_size"`
}

// Helper function
func toJSON(v interface{}) string {
	// Simple JSON marshaling
	// In production, handle errors properly
	return fmt.Sprintf("%v", v)
}
