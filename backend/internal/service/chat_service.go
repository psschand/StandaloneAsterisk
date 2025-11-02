package service

import (
	"context"
	"fmt"
	"time"

	"github.com/psschand/callcenter/internal/chat"
	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/pkg/errors"
)

// ChatService handles chat operations
type ChatService interface {
	// Widget management
	CreateWidget(ctx context.Context, tenantID string, req *dto.CreateChatWidgetRequest) (*dto.ChatWidgetResponse, error)
	GetWidget(ctx context.Context, id int64) (*dto.ChatWidgetResponse, error)
	GetWidgetByKey(ctx context.Context, widgetKey string) (*dto.ChatWidgetResponse, error)
	UpdateWidget(ctx context.Context, id int64, req *dto.UpdateChatWidgetRequest) (*dto.ChatWidgetResponse, error)
	DeleteWidget(ctx context.Context, id int64) error

	// Session management
	CreateSession(ctx context.Context, req *dto.CreateChatSessionRequest) (*dto.ChatSessionResponse, error)
	GetSession(ctx context.Context, id int64) (*dto.ChatSessionResponse, error)
	GetSessionByKey(ctx context.Context, sessionKey string) (*dto.ChatSessionResponse, error)
	GetSessionsByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.ChatSessionResponse, int64, error)
	GetActiveSessions(ctx context.Context, tenantID string) ([]dto.ChatSessionResponse, error)
	AssignSession(ctx context.Context, sessionID, agentID int64) error
	UnassignSession(ctx context.Context, sessionID int64) error
	EndSession(ctx context.Context, sessionID int64, rating *int) error

	// Message management
	SendMessage(ctx context.Context, sessionID int64, senderID *int64, senderType, senderName string, req *dto.SendChatMessageRequest) (*dto.ChatMessageResponse, error)
	GetMessages(ctx context.Context, sessionID int64, page, pageSize int) ([]dto.ChatMessageResponse, int64, error)
	MarkMessageAsRead(ctx context.Context, messageID int64) error

	// Agent management
	RegisterAgent(ctx context.Context, tenantID string, userID int64, req *dto.RegisterChatAgentRequest) (*dto.ChatAgentResponse, error)
	UpdateAgentAvailability(ctx context.Context, agentID int64, isAvailable bool) error
	GetAvailableAgents(ctx context.Context, tenantID string) ([]dto.ChatAgentResponse, error)

	// Transfer management
	TransferSession(ctx context.Context, sessionID, fromAgentID, toAgentID int64, reason string) error
	AcceptTransfer(ctx context.Context, transferID int64) error

	// Statistics
	GetChatStats(ctx context.Context, tenantID string, start, end time.Time) (*dto.ChatStatsResponse, error)

	// WebSocket
	SetWebSocketHub(hub WebSocketHub)
}

type chatService struct {
	widgetRepo   repository.ChatWidgetRepository
	sessionRepo  repository.ChatSessionRepository
	messageRepo  repository.ChatMessageRepository
	agentRepo    repository.ChatAgentRepository
	transferRepo repository.ChatTransferRepository
	userRepo     repository.UserRepository
	wsHub        WebSocketHub
}

// WebSocketHub interface for broadcasting messages
type WebSocketHub interface {
	BroadcastToTenant(tenantID string, messageType string, payload interface{})
	BroadcastToUser(tenantID string, userID int64, messageType string, payload interface{})
}

// NewChatService creates a new chat service
func NewChatService(
	widgetRepo repository.ChatWidgetRepository,
	sessionRepo repository.ChatSessionRepository,
	messageRepo repository.ChatMessageRepository,
	agentRepo repository.ChatAgentRepository,
	transferRepo repository.ChatTransferRepository,
	userRepo repository.UserRepository,
) ChatService {
	return &chatService{
		widgetRepo:   widgetRepo,
		sessionRepo:  sessionRepo,
		messageRepo:  messageRepo,
		agentRepo:    agentRepo,
		transferRepo: transferRepo,
		userRepo:     userRepo,
		wsHub:        nil, // Will be set via SetWebSocketHub
	}
}

// SetWebSocketHub sets the WebSocket hub for real-time updates
func (s *chatService) SetWebSocketHub(hub WebSocketHub) {
	s.wsHub = hub
}

// CreateWidget creates a new chat widget
func (s *chatService) CreateWidget(ctx context.Context, tenantID string, req *dto.CreateChatWidgetRequest) (*dto.ChatWidgetResponse, error) {
	now := time.Now()
	widget := &chat.ChatWidget{
		TenantID:         tenantID,
		Name:             req.Name,
		WidgetKey:        s.generateWidgetKey(tenantID),
		WelcomeMessage:   req.WelcomeMessage,
		PrimaryColor:     req.PrimaryColor,
		SecondaryColor:   req.SecondaryColor,
		WidgetPosition:   req.WidgetPosition,
		ShowAgentTyping:  req.ShowAgentTyping,
		ShowReadReceipts: req.ShowReadReceipts,
		AllowFileUpload:  req.AllowFileUpload,
		RequireEmail:     req.RequireEmail,
		IsEnabled:        true,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.widgetRepo.Create(ctx, widget); err != nil {
		return nil, errors.Wrap(err, "failed to create widget")
	}

	return s.toWidgetResponse(widget), nil
}

// GetWidget gets a widget by ID
func (s *chatService) GetWidget(ctx context.Context, id int64) (*dto.ChatWidgetResponse, error) {
	widget, err := s.widgetRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("widget not found")
	}

	return s.toWidgetResponse(widget), nil
}

// GetWidgetByKey gets a widget by key
func (s *chatService) GetWidgetByKey(ctx context.Context, widgetKey string) (*dto.ChatWidgetResponse, error) {
	widget, err := s.widgetRepo.FindByKey(ctx, widgetKey)
	if err != nil {
		return nil, errors.NewNotFound("widget not found")
	}

	return s.toWidgetResponse(widget), nil
}

// UpdateWidget updates a widget
func (s *chatService) UpdateWidget(ctx context.Context, id int64, req *dto.UpdateChatWidgetRequest) (*dto.ChatWidgetResponse, error) {
	widget, err := s.widgetRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("widget not found")
	}

	// Update basic fields
	if req.Name != nil && *req.Name != "" {
		widget.Name = *req.Name
	}
	if req.WelcomeMessage != nil {
		widget.WelcomeMessage = *req.WelcomeMessage
	}
	if req.GreetingMessage != nil {
		widget.WelcomeMessage = *req.GreetingMessage // Frontend uses greeting_message
	}
	if req.PrimaryColor != nil {
		widget.PrimaryColor = *req.PrimaryColor
	}
	if req.SecondaryColor != nil {
		widget.SecondaryColor = *req.SecondaryColor
	}
	if req.WidgetPosition != nil {
		widget.WidgetPosition = *req.WidgetPosition
	}
	if req.Position != nil {
		widget.WidgetPosition = *req.Position // Alias
	}
	if req.PlaceholderText != nil {
		widget.PlaceholderText = *req.PlaceholderText
	}
	if req.IsEnabled != nil {
		widget.IsEnabled = *req.IsEnabled
	}
	if req.ShowAgentTyping != nil {
		widget.ShowAgentTyping = *req.ShowAgentTyping
	}
	if req.ShowReadReceipts != nil {
		widget.ShowReadReceipts = *req.ShowReadReceipts
	}
	if req.AllowFileUpload != nil {
		widget.AllowFileUpload = *req.AllowFileUpload
	}
	if req.EnableFileUpload != nil {
		widget.AllowFileUpload = *req.EnableFileUpload // Alias
	}
	if req.RequireEmail != nil {
		widget.RequireEmail = *req.RequireEmail
	}
	if req.RequireName != nil {
		widget.RequireName = *req.RequireName
	}
	if req.DefaultTeam != nil {
		widget.DefaultTeam = req.DefaultTeam
	}
	if req.OfflineMessage != nil {
		widget.OfflineMessage = req.OfflineMessage
	}

	// Store extended configuration in settings JSON
	if widget.Metadata == nil {
		widget.Metadata = make(common.JSONMap)
	}

	// Store all extended fields in metadata/settings
	if req.TeamName != nil {
		widget.Metadata["team_name"] = *req.TeamName
	}
	if req.CompanyName != nil {
		widget.Metadata["company_name"] = *req.CompanyName
	}
	if req.ShowAgentAvatar != nil {
		widget.Metadata["show_agent_avatar"] = *req.ShowAgentAvatar
	}
	if req.ShowAgentName != nil {
		widget.Metadata["show_agent_name"] = *req.ShowAgentName
	}
	if req.EnablePreChatForm != nil {
		widget.Metadata["enable_pre_chat_form"] = *req.EnablePreChatForm
	}
	if req.PreChatFields != nil {
		widget.Metadata["pre_chat_fields"] = *req.PreChatFields
	}
	if req.EnableProactiveChat != nil {
		widget.Metadata["enable_proactive_chat"] = *req.EnableProactiveChat
	}
	if req.ProactiveDelay != nil {
		widget.Metadata["proactive_delay"] = *req.ProactiveDelay
	}
	if req.ProactiveMessage != nil {
		widget.Metadata["proactive_message"] = *req.ProactiveMessage
	}
	if req.ShowUnreadCount != nil {
		widget.Metadata["show_unread_count"] = *req.ShowUnreadCount
	}
	if req.EnableSound != nil {
		widget.Metadata["enable_sound"] = *req.EnableSound
	}
	if req.EnableTypingIndicator != nil {
		widget.Metadata["enable_typing_indicator"] = *req.EnableTypingIndicator
	}
	if req.EnableEmoji != nil {
		widget.Metadata["enable_emoji"] = *req.EnableEmoji
	}
	if req.EnableQuickReplies != nil {
		widget.Metadata["enable_quick_replies"] = *req.EnableQuickReplies
	}
	if req.QuickReplies != nil {
		widget.Metadata["quick_replies"] = *req.QuickReplies
	}
	if req.EnableRating != nil {
		widget.Metadata["enable_rating"] = *req.EnableRating
	}
	if req.ShowChatHistory != nil {
		widget.Metadata["show_chat_history"] = *req.ShowChatHistory
	}
	// Sales & Marketing
	if req.EnableProductShowcase != nil {
		widget.Metadata["enable_product_showcase"] = *req.EnableProductShowcase
	}
	if req.ShowcaseProducts != nil {
		widget.Metadata["showcase_products"] = *req.ShowcaseProducts
	}
	if req.EnableLeadCapture != nil {
		widget.Metadata["enable_lead_capture"] = *req.EnableLeadCapture
	}
	if req.LeadCaptureTrigger != nil {
		widget.Metadata["lead_capture_trigger"] = *req.LeadCaptureTrigger
	}
	if req.LeadCaptureDelay != nil {
		widget.Metadata["lead_capture_delay"] = *req.LeadCaptureDelay
	}
	// AI Features
	if req.EnableAISuggestions != nil {
		widget.Metadata["enable_ai_suggestions"] = *req.EnableAISuggestions
	}
	if req.EnableSmartReplies != nil {
		widget.Metadata["enable_smart_replies"] = *req.EnableSmartReplies
	}
	if req.EnableSentimentAnalysis != nil {
		widget.Metadata["enable_sentiment_analysis"] = *req.EnableSentimentAnalysis
	}
	if req.EnableSatisfactionSurvey != nil {
		widget.Metadata["enable_satisfaction_survey"] = *req.EnableSatisfactionSurvey
	}
	if req.EnableChatTranscript != nil {
		widget.Metadata["enable_chat_transcript"] = *req.EnableChatTranscript
	}
	// Branding
	if req.CompanyLogo != nil {
		widget.Metadata["company_logo"] = *req.CompanyLogo
	}
	if req.WelcomeImage != nil {
		widget.Metadata["welcome_image"] = *req.WelcomeImage
	}
	if req.Favicon != nil {
		widget.Metadata["favicon"] = *req.Favicon
	}
	// Analytics
	if req.TrackVisitorInfo != nil {
		widget.Metadata["track_visitor_info"] = *req.TrackVisitorInfo
	}
	if req.TrackPageViews != nil {
		widget.Metadata["track_page_views"] = *req.TrackPageViews
	}
	if req.TrackReferrer != nil {
		widget.Metadata["track_referrer"] = *req.TrackReferrer
	}

	widget.UpdatedAt = time.Now()

	if err := s.widgetRepo.Update(ctx, widget); err != nil {
		return nil, errors.Wrap(err, "failed to update widget")
	}

	return s.toWidgetResponse(widget), nil
}

// DeleteWidget deletes a widget
func (s *chatService) DeleteWidget(ctx context.Context, id int64) error {
	return s.widgetRepo.Delete(ctx, id)
}

// CreateSession creates a new chat session
func (s *chatService) CreateSession(ctx context.Context, req *dto.CreateChatSessionRequest) (*dto.ChatSessionResponse, error) {
	// Validate widget
	widget, err := s.widgetRepo.FindByKey(ctx, req.WidgetKey)
	if err != nil {
		return nil, errors.NewNotFound("widget not found")
	}

	if !widget.IsEnabled {
		return nil, errors.NewValidation("widget is disabled")
	}

	// Create session
	now := time.Now()
	session := &chat.ChatSession{
		TenantID:     widget.TenantID,
		WidgetID:     widget.ID,
		SessionKey:   s.generateSessionKey(),
		VisitorName:  req.VisitorName,
		VisitorEmail: req.VisitorEmail,
		Status:       common.ChatSessionStatusQueued,
		QueuedAt:     &now,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, errors.Wrap(err, "failed to create session")
	}

	// Try to assign to available agent
	agents, _ := s.agentRepo.FindAvailable(ctx, widget.TenantID)
	if len(agents) > 0 {
		// Assign to agent with least current chats
		s.AssignSession(ctx, session.ID, agents[0].ID)
	}

	return s.toSessionResponse(session), nil
}

// GetSession gets a session by ID
func (s *chatService) GetSession(ctx context.Context, id int64) (*dto.ChatSessionResponse, error) {
	session, err := s.sessionRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.NewNotFound("session not found")
	}

	return s.toSessionResponse(session), nil
}

// GetSessionByKey gets a session by key
func (s *chatService) GetSessionByKey(ctx context.Context, sessionKey string) (*dto.ChatSessionResponse, error) {
	session, err := s.sessionRepo.FindByKey(ctx, sessionKey)
	if err != nil {
		return nil, errors.NewNotFound("session not found")
	}

	return s.toSessionResponse(session), nil
}

// GetSessionsByTenant gets all sessions for a tenant
func (s *chatService) GetSessionsByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]dto.ChatSessionResponse, int64, error) {
	sessions, total, err := s.sessionRepo.FindByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get sessions")
	}

	responses := make([]dto.ChatSessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = *s.toSessionResponse(&session)
	}

	return responses, total, nil
}

// GetActiveSessions gets all active sessions
func (s *chatService) GetActiveSessions(ctx context.Context, tenantID string) ([]dto.ChatSessionResponse, error) {
	sessions, err := s.sessionRepo.FindActiveByTenant(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get active sessions")
	}

	responses := make([]dto.ChatSessionResponse, len(sessions))
	for i, session := range sessions {
		responses[i] = *s.toSessionResponse(&session)
	}

	return responses, nil
}

// AssignSession assigns a session to an agent
func (s *chatService) AssignSession(ctx context.Context, sessionID, agentID int64) error {
	// Get session
	session, err := s.sessionRepo.FindByID(ctx, sessionID)
	if err != nil {
		return errors.NewNotFound("session not found")
	}

	// Get agent
	agent, err := s.agentRepo.FindByID(ctx, agentID)
	if err != nil {
		return errors.NewNotFound("agent not found")
	}

	// Check if agent is available
	if !agent.IsAvailable || agent.CurrentChats >= agent.MaxConcurrentChats {
		return errors.NewValidation("agent is not available")
	}

	// Update session
	session.AssignedToID = &agent.UserID
	session.Status = common.ChatSessionStatusActive
	session.UpdatedAt = time.Now()

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return errors.Wrap(err, "failed to assign session")
	}

	// Update agent current chats
	agent.CurrentChats++
	agent.UpdatedAt = time.Now()
	if err := s.agentRepo.Update(ctx, agent); err != nil {
		return errors.Wrap(err, "failed to update agent")
	}

	// Broadcast session assigned via WebSocket
	if s.wsHub != nil {
		// Get agent user details
		agentName := ""
		user, _ := s.userRepo.FindByID(ctx, agent.UserID)
		if user != nil && user.FirstName != nil && user.LastName != nil {
			agentName = *user.FirstName + " " + *user.LastName
		}

		payload := map[string]interface{}{
			"session_id": sessionID,
			"agent_id":   agent.UserID,
			"agent_name": agentName,
			"status":     session.Status,
		}

		// Broadcast to tenant (all monitoring agents)
		s.wsHub.BroadcastToTenant(session.TenantID, "chat.session.assigned", payload)

		// Notify assigned agent specifically
		s.wsHub.BroadcastToUser(session.TenantID, agent.UserID, "chat.agent.joined", payload)
	}

	return nil
}

// UnassignSession unassigns a session from an agent (transfers to queue)
func (s *chatService) UnassignSession(ctx context.Context, sessionID int64) error {
	// Get session
	session, err := s.sessionRepo.FindByID(ctx, sessionID)
	if err != nil {
		return errors.NewNotFound("session not found")
	}

	// Get current agent ID before unassigning
	var currentAgentID *int64
	if session.AssignedToID != nil {
		currentAgentID = session.AssignedToID
	}

	// Update session to unassigned/queued status
	session.AssignedToID = nil
	session.Status = common.ChatSessionStatusQueued
	session.UpdatedAt = time.Now()

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return errors.Wrap(err, "failed to unassign session")
	}

	// If was assigned, update agent current chats count
	if currentAgentID != nil {
		agent, err := s.agentRepo.FindByUser(ctx, session.TenantID, *currentAgentID)
		if err == nil && agent != nil {
			if agent.CurrentChats > 0 {
				agent.CurrentChats--
			}
			agent.UpdatedAt = time.Now()
			s.agentRepo.Update(ctx, agent)
		}
	}

	// Broadcast session unassigned via WebSocket
	if s.wsHub != nil {
		payload := map[string]interface{}{
			"session_id": sessionID,
			"status":     session.Status,
		}
		s.wsHub.BroadcastToTenant(session.TenantID, "chat.session.unassigned", payload)
	}

	return nil
}

// EndSession ends a chat session
func (s *chatService) EndSession(ctx context.Context, sessionID int64, rating *int) error {
	// Get session
	session, err := s.sessionRepo.FindByID(ctx, sessionID)
	if err != nil {
		return errors.NewNotFound("session not found")
	}

	// Update session
	now := time.Now()
	session.Status = common.ChatSessionStatusEnded
	session.EndedAt = &now
	if rating != nil {
		session.Rating = rating
	}

	// Calculate duration if session was started
	if session.StartedAt != nil {
		duration := int(now.Sub(*session.StartedAt).Seconds())
		session.Duration = &duration
	}

	session.UpdatedAt = now

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return errors.Wrap(err, "failed to end session")
	}

	// Update agent current chats if assigned
	if session.AssignedToID != nil {
		agent, err := s.agentRepo.FindByUser(ctx, session.TenantID, *session.AssignedToID)
		if err == nil && agent.CurrentChats > 0 {
			agent.CurrentChats--
			agent.UpdatedAt = time.Now()
			s.agentRepo.Update(ctx, agent)
		}
	}

	return nil
}

// SendMessage sends a chat message
func (s *chatService) SendMessage(ctx context.Context, sessionID int64, senderID *int64, senderType, senderName string, req *dto.SendChatMessageRequest) (*dto.ChatMessageResponse, error) {
	// Validate session
	session, err := s.sessionRepo.FindByID(ctx, sessionID)
	if err != nil {
		return nil, errors.NewNotFound("session not found")
	}

	// Create message
	now := time.Now()
	message := &chat.ChatMessage{
		SessionID:   sessionID,
		SenderID:    senderID,
		SenderType:  senderType,
		SenderName:  senderName,
		MessageType: req.MessageType,
		Body:        req.Body,
		IsRead:      false,
		CreatedAt:   now,
	}

	if err := s.messageRepo.Create(ctx, message); err != nil {
		return nil, errors.Wrap(err, "failed to send message")
	}

	// Update session first response time if this is first agent message
	if senderType == "agent" && session.FirstResponseTime == nil && session.StartedAt != nil {
		responseTime := int(now.Sub(*session.StartedAt).Seconds())
		session.FirstResponseTime = &responseTime
		session.UpdatedAt = now
		s.sessionRepo.Update(ctx, session)
	}

	// Broadcast new message via WebSocket
	if s.wsHub != nil {
		payload := map[string]interface{}{
			"session_id":   sessionID,
			"message_id":   message.ID,
			"sender_type":  senderType,
			"sender_name":  senderName,
			"message_type": message.MessageType,
			"body":         message.Body,
			"timestamp":    message.CreatedAt,
		}
		s.wsHub.BroadcastToTenant(session.TenantID, "chat.message.new", payload)
	}

	return s.toMessageResponse(message), nil
}

// GetMessages gets messages for a session
func (s *chatService) GetMessages(ctx context.Context, sessionID int64, page, pageSize int) ([]dto.ChatMessageResponse, int64, error) {
	messages, total, err := s.messageRepo.FindBySession(ctx, sessionID, page, pageSize)
	if err != nil {
		return nil, 0, errors.Wrap(err, "failed to get messages")
	}

	responses := make([]dto.ChatMessageResponse, len(messages))
	for i, msg := range messages {
		responses[i] = *s.toMessageResponse(&msg)
	}

	return responses, total, nil
}

// MarkMessageAsRead marks a message as read
func (s *chatService) MarkMessageAsRead(ctx context.Context, messageID int64) error {
	return s.messageRepo.MarkAsRead(ctx, messageID)
}

// RegisterAgent registers a chat agent
func (s *chatService) RegisterAgent(ctx context.Context, tenantID string, userID int64, req *dto.RegisterChatAgentRequest) (*dto.ChatAgentResponse, error) {
	// Validate user
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.NewNotFound("user not found")
	}

	// Check user has role in this tenant
	_, err = s.userRepo.FindByEmail(ctx, user.Email) // Simple existence check
	if err != nil {
		return nil, errors.NewValidation("user does not belong to tenant")
	}

	// Check if agent already exists
	existingAgent, _ := s.agentRepo.FindByUser(ctx, tenantID, userID)
	if existingAgent != nil {
		return nil, errors.NewValidation("agent already registered")
	}

	// Create agent
	now := time.Now()
	agent := &chat.ChatAgent{
		TenantID:           tenantID,
		UserID:             userID,
		MaxConcurrentChats: req.MaxConcurrentChats,
		IsAvailable:        false,
		CurrentChats:       0,
		Team:               req.Team,
		AutoAcceptChats:    req.AutoAcceptChats,
		UpdatedAt:          now,
	}

	if agent.MaxConcurrentChats == 0 {
		agent.MaxConcurrentChats = 5 // Default
	}

	if err := s.agentRepo.Create(ctx, agent); err != nil {
		return nil, errors.Wrap(err, "failed to register agent")
	}

	return s.toAgentResponse(agent), nil
}

// UpdateAgentAvailability updates agent availability
func (s *chatService) UpdateAgentAvailability(ctx context.Context, agentID int64, isAvailable bool) error {
	return s.agentRepo.UpdateAvailability(ctx, agentID, isAvailable)
}

// GetAvailableAgents gets available agents
func (s *chatService) GetAvailableAgents(ctx context.Context, tenantID string) ([]dto.ChatAgentResponse, error) {
	agents, err := s.agentRepo.FindAvailable(ctx, tenantID)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get available agents")
	}

	responses := make([]dto.ChatAgentResponse, len(agents))
	for i, agent := range agents {
		responses[i] = *s.toAgentResponse(&agent)
	}

	return responses, nil
}

// TransferSession transfers a session to another agent
func (s *chatService) TransferSession(ctx context.Context, sessionID, fromAgentID, toAgentID int64, reason string) error {
	// Validate session
	session, err := s.sessionRepo.FindByID(ctx, sessionID)
	if err != nil {
		return errors.NewNotFound("session not found")
	}

	// Validate agents
	toAgent, err := s.agentRepo.FindByID(ctx, toAgentID)
	if err != nil {
		return errors.NewNotFound("target agent not found")
	}

	if !toAgent.IsAvailable || toAgent.CurrentChats >= toAgent.MaxConcurrentChats {
		return errors.NewValidation("target agent is not available")
	}

	// Create transfer record
	now := time.Now()
	reasonPtr := &reason
	transfer := &chat.ChatTransfer{
		SessionID:  sessionID,
		FromUserID: &fromAgentID,
		ToUserID:   &toAgentID,
		Reason:     reasonPtr,
		Status:     "accepted", // Auto-accept for now
		AcceptedAt: &now,
		CreatedAt:  now,
	}

	if err := s.transferRepo.Create(ctx, transfer); err != nil {
		return errors.Wrap(err, "failed to create transfer")
	}

	// Update session assignment
	session.AssignedToID = &toAgentID
	session.UpdatedAt = now
	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return errors.Wrap(err, "failed to update session")
	}

	// Update agent chat counts
	fromAgent, _ := s.agentRepo.FindByID(ctx, fromAgentID)
	if fromAgent != nil && fromAgent.CurrentChats > 0 {
		fromAgent.CurrentChats--
		s.agentRepo.Update(ctx, fromAgent)
	}

	toAgent.CurrentChats++
	s.agentRepo.Update(ctx, toAgent)

	return nil
}

// AcceptTransfer accepts a transfer request
func (s *chatService) AcceptTransfer(ctx context.Context, transferID int64) error {
	transfer, err := s.transferRepo.FindByID(ctx, transferID)
	if err != nil {
		return errors.NewNotFound("transfer not found")
	}

	now := time.Time{}
	transfer.Status = "accepted"
	transfer.AcceptedAt = &now

	return s.transferRepo.Update(ctx, transfer)
}

// GetChatStats gets chat statistics
func (s *chatService) GetChatStats(ctx context.Context, tenantID string, start, end time.Time) (*dto.ChatStatsResponse, error) {
	stats, err := s.sessionRepo.GetStats(ctx, tenantID, start, end)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get chat stats")
	}

	// Extract stats with safe type assertions
	totalChats := 0
	activeChats := 0
	queuedChats := 0
	endedChats := 0
	abandonedChats := 0
	avgResponseTime := 0.0
	avgDuration := 0.0
	avgRating := 0.0

	if v, ok := stats["total_chats"].(int64); ok {
		totalChats = int(v)
	}
	if v, ok := stats["active_chats"].(int64); ok {
		activeChats = int(v)
	}
	if v, ok := stats["queued_chats"].(int64); ok {
		queuedChats = int(v)
	}
	if v, ok := stats["ended_chats"].(int64); ok {
		endedChats = int(v)
	}
	if v, ok := stats["abandoned_chats"].(int64); ok {
		abandonedChats = int(v)
	}
	if v, ok := stats["avg_response_time"].(float64); ok {
		avgResponseTime = v
	}
	if v, ok := stats["avg_duration"].(float64); ok {
		avgDuration = v
	}
	if v, ok := stats["avg_rating"].(float64); ok {
		avgRating = v
	}

	return &dto.ChatStatsResponse{
		TotalChats:           totalChats,
		ActiveChats:          activeChats,
		QueuedChats:          queuedChats,
		EndedChats:           endedChats,
		AbandonedChats:       abandonedChats,
		AverageResponseTime:  avgResponseTime,
		AverageChatDuration:  avgDuration,
		AverageRating:        avgRating,
		CustomerSatisfaction: 0, // TODO: Calculate from ratings
	}, nil
}

// Helper functions

func (s *chatService) generateWidgetKey(tenantID string) string {
	return fmt.Sprintf("widget-%s-%d", tenantID[:8], time.Now().Unix())
}

func (s *chatService) generateSessionKey() string {
	return fmt.Sprintf("session-%d", time.Now().UnixNano())
}

func (s *chatService) toWidgetResponse(widget *chat.ChatWidget) *dto.ChatWidgetResponse {
	response := &dto.ChatWidgetResponse{
		ID:               widget.ID,
		TenantID:         widget.TenantID,
		Name:             widget.Name,
		WidgetKey:        widget.WidgetKey,
		WelcomeMessage:   widget.WelcomeMessage,
		GreetingMessage:  widget.WelcomeMessage, // Alias for frontend
		PrimaryColor:     widget.PrimaryColor,
		SecondaryColor:   widget.SecondaryColor,
		WidgetPosition:   widget.WidgetPosition,
		Position:         widget.WidgetPosition, // Alias
		PlaceholderText:  widget.PlaceholderText,
		ShowAgentTyping:  widget.ShowAgentTyping,
		ShowReadReceipts: widget.ShowReadReceipts,
		AllowFileUpload:  widget.AllowFileUpload,
		EnableFileUpload: widget.AllowFileUpload, // Alias
		RequireEmail:     widget.RequireEmail,
		RequireName:      widget.RequireName,
		IsEnabled:        widget.IsEnabled,
		CreatedAt:        widget.CreatedAt,
		UpdatedAt:        widget.UpdatedAt,
	}

	// Flatten metadata into main response for frontend compatibility
	if widget.Metadata != nil {
		response.Settings = widget.Metadata
	}

	return response
}

func (s *chatService) toSessionResponse(session *chat.ChatSession) *dto.ChatSessionResponse {
	// Get assigned agent name if available
	var assignedToName *string
	if session.AssignedToID != nil {
		user, err := s.userRepo.FindByID(context.Background(), *session.AssignedToID)
		if err == nil {
			name := ""
			if user.FirstName != nil {
				name = *user.FirstName
			}
			if user.LastName != nil {
				if name != "" {
					name += " "
				}
				name += *user.LastName
			}
			if name != "" {
				assignedToName = &name
			}
		}
	}

	// Use message count from session
	messageCount := session.MessageCount

	return &dto.ChatSessionResponse{
		ID:                session.ID,
		TenantID:          session.TenantID,
		WidgetID:          session.WidgetID,
		SessionKey:        session.SessionKey,
		VisitorName:       session.VisitorName,
		VisitorEmail:      session.VisitorEmail,
		Status:            session.Status,
		AssignedToID:      session.AssignedToID,
		AssignedToName:    assignedToName,
		AssignedTeam:      session.AssignedTeam,
		MessageCount:      messageCount,
		FirstResponseTime: session.FirstResponseTime,
		Duration:          session.Duration,
		Rating:            session.Rating,
		CreatedAt:         session.CreatedAt,
		UpdatedAt:         session.UpdatedAt,
	}
}

func (s *chatService) toMessageResponse(message *chat.ChatMessage) *dto.ChatMessageResponse {
	return &dto.ChatMessageResponse{
		ID:             message.ID,
		SessionID:      message.SessionID,
		SenderType:     message.SenderType,
		SenderName:     message.SenderName,
		MessageType:    message.MessageType,
		Body:           message.Body,
		AttachmentURL:  message.AttachmentURL,
		AttachmentName: message.AttachmentName,
		IsRead:         message.IsRead,
		CreatedAt:      message.CreatedAt,
	}
}

func (s *chatService) toAgentResponse(agent *chat.ChatAgent) *dto.ChatAgentResponse {
	return &dto.ChatAgentResponse{
		ID:                 agent.ID,
		TenantID:           agent.TenantID,
		UserID:             agent.UserID,
		MaxConcurrentChats: agent.MaxConcurrentChats,
		CurrentChats:       agent.CurrentChats,
		IsAvailable:        agent.IsAvailable,
		Team:               agent.Team,
		UpdatedAt:          agent.UpdatedAt,
	}
}
