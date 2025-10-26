package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// ChatHandler handles chat requests
type ChatHandler struct {
	chatService service.ChatService
}

// NewChatHandler creates a new chat handler
func NewChatHandler(chatService service.ChatService) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
	}
}

// CreateWidget creates a new chat widget
func (h *ChatHandler) CreateWidget(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateChatWidgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.chatService.CreateWidget(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// GetWidget gets a chat widget
func (h *ChatHandler) GetWidget(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid widget ID"})
		return
	}

	result, err := h.chatService.GetWidget(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// UpdateWidget updates a chat widget
func (h *ChatHandler) UpdateWidget(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid widget ID"})
		return
	}

	var req dto.UpdateChatWidgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.chatService.UpdateWidget(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// DeleteWidget deletes a chat widget
func (h *ChatHandler) DeleteWidget(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid widget ID"})
		return
	}

	if err := h.chatService.DeleteWidget(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// CreateSession creates a new chat session
func (h *ChatHandler) CreateSession(c *gin.Context) {
	var req dto.CreateChatSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.chatService.CreateSession(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// GetSession gets a chat session
func (h *ChatHandler) GetSession(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	result, err := h.chatService.GetSession(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// ListSessions lists chat sessions
func (h *ChatHandler) ListSessions(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	sessions, total, err := h.chatService.GetSessionsByTenant(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, sessions, meta)
}

// GetActiveSessions gets active chat sessions
func (h *ChatHandler) GetActiveSessions(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	sessions, err := h.chatService.GetActiveSessions(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, sessions)
}

// AssignSession assigns a session to an agent
func (h *ChatHandler) AssignSession(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	var req struct {
		AgentID int64 `json:"agent_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.chatService.AssignSession(c.Request.Context(), sessionID, req.AgentID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// EndSession ends a chat session
func (h *ChatHandler) EndSession(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	var req struct {
		Rating *int `json:"rating"`
	}
	c.ShouldBindJSON(&req)

	if err := h.chatService.EndSession(c.Request.Context(), sessionID, req.Rating); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// SendMessage sends a chat message
func (h *ChatHandler) SendMessage(c *gin.Context) {
	// Get session ID from URL
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	var req dto.SendChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Get sender info from context (for authenticated users)
	var senderID *int64
	userID := c.GetInt64("user_id")
	if userID > 0 {
		senderID = &userID
	}

	senderType := "visitor" // Default to visitor
	senderName := "Anonymous"
	if senderID != nil {
		senderType = "agent"                  // If authenticated, it's an agent
		senderName = c.GetString("user_name") // Get from context if available
		if senderName == "" {
			senderName = "Agent"
		}
	}

	result, err := h.chatService.SendMessage(c.Request.Context(), sessionID, senderID, senderType, senderName, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// GetMessages gets messages for a session
func (h *ChatHandler) GetMessages(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	messages, total, err := h.chatService.GetMessages(c.Request.Context(), sessionID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, messages, meta)
}

// MarkMessageAsRead marks a message as read
func (h *ChatHandler) MarkMessageAsRead(c *gin.Context) {
	messageID, err := strconv.ParseInt(c.Param("messageId"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"messageId": "invalid message ID"})
		return
	}

	if err := h.chatService.MarkMessageAsRead(c.Request.Context(), messageID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// RegisterAgent registers a chat agent
func (h *ChatHandler) RegisterAgent(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID := c.GetInt64("user_id")

	var req dto.RegisterChatAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.chatService.RegisterAgent(c.Request.Context(), tenantID, userID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// UpdateAgentAvailability updates agent availability
func (h *ChatHandler) UpdateAgentAvailability(c *gin.Context) {
	agentID, err := strconv.ParseInt(c.Param("agentId"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"agentId": "invalid agent ID"})
		return
	}

	var req struct {
		IsAvailable bool `json:"is_available"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.chatService.UpdateAgentAvailability(c.Request.Context(), agentID, req.IsAvailable); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// GetAvailableAgents gets available chat agents
func (h *ChatHandler) GetAvailableAgents(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	agents, err := h.chatService.GetAvailableAgents(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, agents)
}

// TransferSession transfers a session to another agent
func (h *ChatHandler) TransferSession(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	var req struct {
		FromAgentID int64  `json:"from_agent_id" binding:"required"`
		ToAgentID   int64  `json:"to_agent_id" binding:"required"`
		Reason      string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.chatService.TransferSession(c.Request.Context(), sessionID, req.FromAgentID, req.ToAgentID, req.Reason); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// GetStats gets chat statistics
func (h *ChatHandler) GetStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr == "" || endStr == "" {
		response.ValidationError(c, map[string]string{"date_range": "start and end dates are required"})
		return
	}

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		response.ValidationError(c, map[string]string{"start": "invalid date format, use YYYY-MM-DD"})
		return
	}

	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		response.ValidationError(c, map[string]string{"end": "invalid date format, use YYYY-MM-DD"})
		return
	}

	// Set end date to end of day
	end = end.Add(24*time.Hour - time.Second)

	stats, err := h.chatService.GetChatStats(c.Request.Context(), tenantID, start, end)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, stats)
}
