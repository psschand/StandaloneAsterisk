package handler

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/chat"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// PublicChatHandler handles public chat API endpoints (no authentication required)
type PublicChatHandler struct {
	chatService service.ChatService
	aiService   *chat.AIAgentService
}

// NewPublicChatHandler creates a new public chat handler
func NewPublicChatHandler(chatService service.ChatService, aiService *chat.AIAgentService) *PublicChatHandler {
	return &PublicChatHandler{
		chatService: chatService,
		aiService:   aiService,
	}
}

// PublicStartSessionRequest represents a public chat session start request
type PublicStartSessionRequest struct {
	TenantID      string            `json:"tenant_id" binding:"required"`
	Channel       string            `json:"channel" binding:"required"`
	CustomerName  string            `json:"customer_name"`
	CustomerEmail string            `json:"customer_email"`
	Metadata      map[string]string `json:"metadata"`
}

// PublicSendMessageRequest represents a public chat message request
type PublicSendMessageRequest struct {
	SessionKey string            `json:"session_id" binding:"required"` // Using session_key
	Message    string            `json:"message" binding:"required"`
	Metadata   map[string]string `json:"metadata"`
}

// StartSession creates a new public chat session
func (h *PublicChatHandler) StartSession(c *gin.Context) {
	var req PublicStartSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Use existing CreateSession from chat service
	widgetKey := "default-widget" // Default widget for public chat
	sessionReq := &dto.StartChatSessionRequest{
		WidgetKey:    widgetKey,
		VisitorName:  &req.CustomerName,
		VisitorEmail: &req.CustomerEmail,
	}

	session, err := h.chatService.CreateSession(c.Request.Context(), sessionReq)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, gin.H{
		"session_id":      session.SessionKey,
		"conversation_id": session.ID,
		"message":         "Connected to AI assistant. How can I help you today?",
	})
}

// SendMessage handles sending a message in a public chat session
func (h *PublicChatHandler) SendMessage(c *gin.Context) {
	var req PublicSendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Get session by key
	session, err := h.chatService.GetSessionByKey(c.Request.Context(), req.SessionKey)
	if err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	// Check if session is active or queued (both allow messaging)
	if session.Status != "active" && session.Status != "queued" {
		response.BadRequest(c, "Session is not active")
		return
	}

	// Save customer message
	messageReq := &dto.SendChatMessageRequest{
		Body: &req.Message,
	}

	visitorName := "Guest"
	if session.VisitorName != nil {
		visitorName = *session.VisitorName
	}

	customerMsg, err := h.chatService.SendMessage(
		c.Request.Context(),
		session.ID,
		nil, // No sender ID for public messages
		"visitor",
		visitorName,
		messageReq,
	)

	if err != nil {
		response.Error(c, err)
		return
	}

	// Check if agent is assigned - route to agent
	if session.AssignedToID != nil {
		// Agent handles this message - just notify them via WebSocket
		// The message is already saved, agent will see it in their interface
		response.Success(c, gin.H{
			"message_id":  customerMsg.ID,
			"content":     "Your message has been sent to our agent. They will respond shortly.",
			"is_agent":    true,
			"sender_name": "System",
			"timestamp":   customerMsg.CreatedAt,
			"status":      "agent_assigned",
		})
		return
	}

	// ============================================
	// AI HANDLES MESSAGE (no agent assigned)
	// ============================================

	// Get AI response with intelligent analysis
	aiResponse, err := h.aiService.ProcessMessage(c.Request.Context(), session.TenantID, session.ID, req.Message)

	if err != nil {
		// Log the error for debugging
		c.Error(err) // This will be logged by Gin

		// If AI fails, return a fallback message
		response.Success(c, gin.H{
			"message_id":  customerMsg.ID,
			"content":     "I'm sorry, I'm having trouble understanding. Could you rephrase that?",
			"is_agent":    false,
			"sender_name": "AI Assistant",
			"timestamp":   customerMsg.CreatedAt,
			"error_debug": err.Error(), // Include error in response for testing
		})
		return
	}

	// ============================================
	// CHECK IF AUTO-HANDOVER TRIGGERED
	// ============================================
	if aiResponse.Action == "handoff" {
		// AI determined handover is needed (sentiment/urgency/complexity)
		// Send handover notification message
		handoverMsg := "I'd like to connect you with one of our specialists who can better assist you."
		if aiResponse.HandoffReason != "" {
			// Don't expose internal reason to customer, but log it
			c.Set("handover_reason", aiResponse.HandoffReason)
		}

		msgReq := &dto.SendChatMessageRequest{
			Body: &handoverMsg,
		}

		handoverMessage, _ := h.chatService.SendMessage(
			c.Request.Context(),
			session.ID,
			nil,
			"system",
			"AI Assistant",
			msgReq,
		)

		// TODO: Update session status to "pending_handover" and notify agents
		// For now, return response indicating handover is needed

		response.Success(c, gin.H{
			"message_id":     handoverMessage.ID,
			"content":        handoverMsg,
			"is_agent":       false,
			"sender_name":    "AI Assistant",
			"timestamp":      handoverMessage.CreatedAt,
			"action":         "handoff",
			"handoff_reason": aiResponse.HandoffReason,
			"sentiment":      aiResponse.Sentiment,
			"confidence":     aiResponse.Confidence,
		})
		return
	}

	// ============================================
	// AI CONTINUES - Save and send AI response
	// ============================================
	aiContent := aiResponse.Content
	aiMessageReq := &dto.SendChatMessageRequest{
		Body: &aiContent,
	}

	aiMsg, err := h.chatService.SendMessage(
		c.Request.Context(),
		session.ID,
		nil,
		"bot",
		"AI Assistant",
		aiMessageReq,
	)

	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, gin.H{
		"message_id":  aiMsg.ID,
		"content":     aiResponse.Content,
		"is_agent":    false,
		"sender_name": "AI Assistant",
		"timestamp":   aiMsg.CreatedAt,
		"action":      "continue",
		"sentiment":   aiResponse.Sentiment,
		"confidence":  aiResponse.Confidence,
		"intent":      aiResponse.Intent,
	})
}

// GetSessionHistory retrieves public chat session history
func (h *PublicChatHandler) GetSessionHistory(c *gin.Context) {
	sessionKey := c.Param("session_id")

	// Get session
	session, err := h.chatService.GetSessionByKey(c.Request.Context(), sessionKey)
	if err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	// Get messages
	messages, _, err := h.chatService.GetMessages(c.Request.Context(), session.ID, 1, 100)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, gin.H{
		"session_id":      sessionKey,
		"conversation_id": session.ID,
		"status":          session.Status,
		"messages":        messages,
		"started_at":      session.CreatedAt,
	})
}

// PublicEndSessionRequest represents a request to end a chat session
type PublicEndSessionRequest struct {
	SessionID uint `json:"session_id" binding:"required"`
}

// PublicHandoverRequest represents a request to handover from AI to human
type PublicHandoverRequest struct {
	SessionKey string `json:"session_id" binding:"required"`
	Reason     string `json:"reason"`
}

// RequestHandover handles AI-to-human handover requests
func (h *PublicChatHandler) RequestHandover(c *gin.Context) {
	var req PublicHandoverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Get session
	session, err := h.chatService.GetSessionByKey(c.Request.Context(), req.SessionKey)
	if err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	// Check if already assigned to an agent
	if session.AssignedToID != nil {
		response.Success(c, gin.H{
			"message": "You are already connected to a human agent",
			"status":  "already_assigned",
		})
		return
	}

	// Send system message about handover request
	handoverMsg := "🤚 Customer has requested to speak with a human agent"
	if req.Reason != "" {
		handoverMsg += ". Reason: " + req.Reason
	}

	msgReq := &dto.SendChatMessageRequest{
		Body: &handoverMsg,
	}

	_, err = h.chatService.SendMessage(
		c.Request.Context(),
		session.ID,
		nil,
		"system",
		"System",
		msgReq,
	)

	if err != nil {
		// Log error but don't fail the request
		c.Error(err)
	}

	response.Success(c, gin.H{
		"message": "Your request has been received. An agent will be with you shortly.",
		"status":  "handover_requested",
	})
}

// GetSessionStatus retrieves the current status of a chat session
func (h *PublicChatHandler) GetSessionStatus(c *gin.Context) {
	sessionIDStr := c.Param("session_id")

	// Try to parse as int64
	var sessionID int64
	if _, err := fmt.Sscanf(sessionIDStr, "%d", &sessionID); err != nil {
		response.BadRequest(c, "Invalid session ID format")
		return
	}

	// Get session by ID
	session, err := h.chatService.GetSession(c.Request.Context(), sessionID)
	if err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	response.Success(c, gin.H{
		"session_id":      session.SessionKey,
		"conversation_id": session.ID,
		"status":          session.Status,
		"assigned_to_id":  session.AssignedToID,
		"created_at":      session.CreatedAt,
		"updated_at":      session.UpdatedAt,
	})
}

// EndSession ends a chat session
func (h *PublicChatHandler) EndSession(c *gin.Context) {
	var req PublicEndSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Get session to verify it exists
	session, err := h.chatService.GetSession(c.Request.Context(), int64(req.SessionID))
	if err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	// End the session (this will set status to 'ended')
	err = h.chatService.EndSession(c.Request.Context(), int64(req.SessionID), nil)
	if err != nil {
		response.Error(c, err)
		return
	}

	// Send system message about session end
	endMsg := "Chat session ended by customer"
	msgReq := &dto.SendChatMessageRequest{
		Body: &endMsg,
	}

	_, _ = h.chatService.SendMessage(
		c.Request.Context(),
		session.ID,
		nil,
		"system",
		"System",
		msgReq,
	)

	response.Success(c, gin.H{
		"message": "Chat session ended successfully",
		"status":  "ended",
	})
}
