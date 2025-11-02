package handler

import (
	"fmt"
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

	// Flatten settings into root level for frontend compatibility
	flattenedResult := h.flattenWidgetResponse(result)
	response.Success(c, flattenedResult)
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

	// Flatten settings into root level for frontend compatibility
	flattenedResult := h.flattenWidgetResponse(result)
	response.Success(c, flattenedResult)
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

// TransferSession transfers a chat session to another agent
func (h *ChatHandler) TransferSession(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid session ID"})
		return
	}

	var req struct {
		ToAgentID *int64  `json:"to_agent_id"`
		ToTeam    *string `json:"to_team"`
		Notes     string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Get current user (from agent)
	fromAgentID := c.GetInt64("user_id")

	// Validate: either to_agent_id or to_team must be provided
	if req.ToAgentID == nil && req.ToTeam == nil {
		response.BadRequest(c, "Either to_agent_id or to_team must be provided")
		return
	}

	// Transfer to specific agent
	if req.ToAgentID != nil {
		if err := h.chatService.TransferSession(c.Request.Context(), sessionID, fromAgentID, *req.ToAgentID, req.Notes); err != nil {
			response.Error(c, err)
			return
		}
		response.Success(c, gin.H{
			"message":     "Session transferred successfully",
			"to_agent_id": *req.ToAgentID,
		})
		return
	}

	// Transfer to team/queue (unassign the session)
	if req.ToTeam != nil {
		// Unassign the session (sets assigned_to_id to NULL)
		if err := h.chatService.UnassignSession(c.Request.Context(), sessionID); err != nil {
			response.Error(c, err)
			return
		}

		// Send system message
		transferMsg := fmt.Sprintf("Chat transferred to %s team", *req.ToTeam)
		msgReq := &dto.SendChatMessageRequest{
			Body: &transferMsg,
		}
		h.chatService.SendMessage(c.Request.Context(), sessionID, nil, "system", "System", msgReq)

		response.Success(c, gin.H{
			"message": "Session transferred to team",
			"team":    *req.ToTeam,
		})
		return
	}
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

// flattenWidgetResponse flattens settings/metadata into root level for frontend compatibility
func (h *ChatHandler) flattenWidgetResponse(widget *dto.ChatWidgetResponse) map[string]interface{} {
	result := map[string]interface{}{
		"id":                     widget.ID,
		"tenant_id":              widget.TenantID,
		"widget_key":             widget.WidgetKey,
		"name":                   widget.Name,
		"is_enabled":             widget.IsEnabled,
		"primary_color":          widget.PrimaryColor,
		"secondary_color":        widget.SecondaryColor,
		"widget_position":        widget.WidgetPosition,
		"position":               widget.Position,
		"welcome_message":        widget.WelcomeMessage,
		"greeting_message":       widget.GreetingMessage,
		"placeholder_text":       widget.PlaceholderText,
		"show_agent_typing":      widget.ShowAgentTyping,
		"show_read_receipts":     widget.ShowReadReceipts,
		"allow_file_upload":      widget.AllowFileUpload,
		"enable_file_upload":     widget.EnableFileUpload,
		"require_email":          widget.RequireEmail,
		"require_name":           widget.RequireName,
		"business_hours_enabled": widget.BusinessHoursEnabled,
		"embed_code":             widget.EmbedCode,
		"created_at":             widget.CreatedAt,
		"updated_at":             widget.UpdatedAt,
	}

	// Flatten settings into root level
	if widget.Settings != nil {
		for key, value := range widget.Settings {
			result[key] = value
		}
	}

	return result
}
