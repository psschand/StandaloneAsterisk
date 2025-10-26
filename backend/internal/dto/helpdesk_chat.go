package dto

import (
	"time"

	"github.com/psschand/callcenter/internal/common"
)

// ===================================
// HELPDESK TICKET MANAGEMENT
// ===================================

// TicketResponse represents ticket data
// @Description Helpdesk ticket information
type TicketResponse struct {
	ID              int64                 `json:"id" example:"1"`
	TenantID        string                `json:"tenant_id" example:"acme-corp"`
	TicketNumber    string                `json:"ticket_number" example:"ACME-00001"`
	Subject         string                `json:"subject" example:"Cannot make outbound calls"`
	Description     *string               `json:"description,omitempty"`
	Status          common.TicketStatus   `json:"status" example:"open"`
	Priority        common.TicketPriority `json:"priority" example:"high"`
	Category        *string               `json:"category,omitempty" example:"Technical"`
	RequesterName   *string               `json:"requester_name,omitempty" example:"Jane Customer"`
	RequesterEmail  *string               `json:"requester_email,omitempty" example:"jane@customer.com"`
	AssignedToID    *int64                `json:"assigned_to_id,omitempty" example:"1"`
	AssignedToName  *string               `json:"assigned_to_name,omitempty" example:"Agent John"`
	AssignedTeam    *string               `json:"assigned_team,omitempty" example:"Support Team"`
	Source          string                `json:"source" example:"email"`
	Tags            []string              `json:"tags,omitempty"`
	MessageCount    int                   `json:"message_count" example:"5"`
	AttachmentCount int                   `json:"attachment_count" example:"2"`
	DueDate         *time.Time            `json:"due_date,omitempty"`
	ResolvedAt      *time.Time            `json:"resolved_at,omitempty"`
	ClosedAt        *time.Time            `json:"closed_at,omitempty"`
	CreatedAt       time.Time             `json:"created_at"`
	UpdatedAt       time.Time             `json:"updated_at"`
}

// CreateTicketRequest represents ticket creation data
// @Description Create new ticket
type CreateTicketRequest struct {
	Subject        string                `json:"subject" binding:"required" example:"Cannot make outbound calls"`
	Description    *string               `json:"description,omitempty"`
	Priority       common.TicketPriority `json:"priority" example:"high"`
	Category       *string               `json:"category,omitempty" example:"Technical"`
	RequesterName  *string               `json:"requester_name,omitempty" example:"Jane Customer"`
	RequesterEmail *string               `json:"requester_email,omitempty" binding:"omitempty,email" example:"jane@customer.com"`
	AssignedToID   *int64                `json:"assigned_to_id,omitempty" example:"1"`
	AssignedTeam   *string               `json:"assigned_team,omitempty" example:"Support Team"`
	Source         string                `json:"source" example:"web"`
	Tags           []string              `json:"tags,omitempty"`
	DueDate        *time.Time            `json:"due_date,omitempty"`
}

// UpdateTicketRequest represents ticket update data
// @Description Update ticket information
type UpdateTicketRequest struct {
	Subject      *string                `json:"subject,omitempty" example:"Cannot make outbound calls"`
	Description  *string                `json:"description,omitempty"`
	Status       *common.TicketStatus   `json:"status,omitempty" example:"in_progress"`
	Priority     *common.TicketPriority `json:"priority,omitempty" example:"high"`
	Category     *string                `json:"category,omitempty" example:"Technical"`
	AssignedToID *int64                 `json:"assigned_to_id,omitempty" example:"1"`
	AssignedTeam *string                `json:"assigned_team,omitempty" example:"Support Team"`
	Tags         []string               `json:"tags,omitempty"`
	DueDate      *time.Time             `json:"due_date,omitempty"`
}

// TicketFilterRequest represents ticket filter parameters
// @Description Filter parameters for ticket list
type TicketFilterRequest struct {
	Status       *common.TicketStatus   `form:"status" json:"status,omitempty" example:"open"`
	Priority     *common.TicketPriority `form:"priority" json:"priority,omitempty" example:"high"`
	Category     *string                `form:"category" json:"category,omitempty" example:"Technical"`
	AssignedToID *int64                 `form:"assigned_to_id" json:"assigned_to_id,omitempty" example:"1"`
	RequesterID  *int64                 `form:"requester_id" json:"requester_id,omitempty" example:"5"`
	StartDate    *time.Time             `form:"start_date" json:"start_date,omitempty"`
	EndDate      *time.Time             `form:"end_date" json:"end_date,omitempty"`
	Search       *string                `form:"search" json:"search,omitempty" example:"outbound calls"`
	Page         int                    `form:"page" json:"page" binding:"min=1" example:"1"`
	PageSize     int                    `form:"page_size" json:"page_size" binding:"min=1,max=100" example:"20"`
}

// TicketMessageResponse represents ticket message data
// @Description Ticket message/reply
type TicketMessageResponse struct {
	ID              int64     `json:"id" example:"1"`
	TicketID        int64     `json:"ticket_id" example:"1"`
	SenderName      *string   `json:"sender_name,omitempty" example:"Agent John"`
	SenderEmail     *string   `json:"sender_email,omitempty" example:"john@acme.com"`
	Body            string    `json:"body" example:"Thank you for contacting us."`
	IsInternal      bool      `json:"is_internal" example:"false"`
	IsHTML          bool      `json:"is_html" example:"false"`
	AttachmentCount int       `json:"attachment_count" example:"1"`
	CreatedAt       time.Time `json:"created_at"`
}

// AddTicketMessageRequest represents adding message to ticket
// @Description Add message/reply to ticket
type AddTicketMessageRequest struct {
	Body       string `json:"body" binding:"required" example:"Thank you for contacting us."`
	IsInternal bool   `json:"is_internal" example:"false"`
	IsHTML     bool   `json:"is_html" example:"false"`
}

// TicketAttachmentResponse represents ticket attachment data
// @Description Ticket file attachment
type TicketAttachmentResponse struct {
	ID          int64     `json:"id" example:"1"`
	TicketID    int64     `json:"ticket_id" example:"1"`
	MessageID   *int64    `json:"message_id,omitempty" example:"5"`
	Filename    string    `json:"filename" example:"screenshot.png"`
	FileSize    int64     `json:"file_size" example:"245760"`
	MimeType    string    `json:"mime_type" example:"image/png"`
	DownloadURL string    `json:"download_url" example:"/api/v1/tickets/1/attachments/1/download"`
	CreatedAt   time.Time `json:"created_at"`
}

// TicketStatsResponse represents ticket statistics
// @Description Ticket statistics
type TicketStatsResponse struct {
	TotalTickets          int     `json:"total_tickets" example:"150"`
	OpenTickets           int     `json:"open_tickets" example:"45"`
	InProgressTickets     int     `json:"in_progress_tickets" example:"30"`
	ResolvedTickets       int     `json:"resolved_tickets" example:"60"`
	ClosedTickets         int     `json:"closed_tickets" example:"15"`
	AverageResponseTime   float64 `json:"average_response_time" example:"45.5"`    // minutes
	AverageResolutionTime float64 `json:"average_resolution_time" example:"240.0"` // minutes
	SLACompliance         float64 `json:"sla_compliance" example:"92.5"`           // percentage
}

// ===================================
// CHAT WIDGET & SESSION MANAGEMENT
// ===================================

// ChatWidgetResponse represents chat widget data
// @Description Chat widget configuration
type ChatWidgetResponse struct {
	ID                   int64     `json:"id" example:"1"`
	TenantID             string    `json:"tenant_id" example:"acme-corp"`
	WidgetKey            string    `json:"widget_key" example:"wgt_abc123xyz"`
	Name                 string    `json:"name" example:"Main Website Chat"`
	IsEnabled            bool      `json:"is_enabled" example:"true"`
	PrimaryColor         string    `json:"primary_color" example:"#0084FF"`
	SecondaryColor       string    `json:"secondary_color" example:"#FFFFFF"`
	WidgetPosition       string    `json:"widget_position" example:"bottom-right"`
	WelcomeMessage       string    `json:"welcome_message" example:"Hi! How can we help you today?"`
	ShowAgentTyping      bool      `json:"show_agent_typing" example:"true"`
	ShowReadReceipts     bool      `json:"show_read_receipts" example:"true"`
	AllowFileUpload      bool      `json:"allow_file_upload" example:"true"`
	RequireEmail         bool      `json:"require_email" example:"false"`
	RequireName          bool      `json:"require_name" example:"true"`
	BusinessHoursEnabled bool      `json:"business_hours_enabled" example:"true"`
	EmbedCode            string    `json:"embed_code" example:"<script>...</script>"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// CreateChatWidgetRequest represents chat widget creation data
// @Description Create chat widget
type CreateChatWidgetRequest struct {
	Name                 string  `json:"name" binding:"required" example:"Main Website Chat"`
	PrimaryColor         string  `json:"primary_color" example:"#0084FF"`
	SecondaryColor       string  `json:"secondary_color" example:"#FFFFFF"`
	WidgetPosition       string  `json:"widget_position" example:"bottom-right"`
	WelcomeMessage       string  `json:"welcome_message" example:"Hi! How can we help you today?"`
	ShowAgentTyping      bool    `json:"show_agent_typing" example:"true"`
	ShowReadReceipts     bool    `json:"show_read_receipts" example:"true"`
	AllowFileUpload      bool    `json:"allow_file_upload" example:"true"`
	RequireEmail         bool    `json:"require_email" example:"false"`
	RequireName          bool    `json:"require_name" example:"true"`
	DefaultTeam          *string `json:"default_team,omitempty" example:"Support Team"`
	BusinessHoursEnabled bool    `json:"business_hours_enabled" example:"true"`
	BusinessHours        *string `json:"business_hours,omitempty"`
}

// UpdateChatWidgetRequest represents chat widget update data
// @Description Update chat widget configuration
type UpdateChatWidgetRequest struct {
	Name                 *string `json:"name,omitempty" example:"Main Website Chat"`
	IsEnabled            *bool   `json:"is_enabled,omitempty" example:"true"`
	PrimaryColor         *string `json:"primary_color,omitempty" example:"#0084FF"`
	SecondaryColor       *string `json:"secondary_color,omitempty" example:"#FFFFFF"`
	WidgetPosition       *string `json:"widget_position,omitempty" example:"bottom-right"`
	WelcomeMessage       *string `json:"welcome_message,omitempty" example:"Hi! How can we help you today?"`
	ShowAgentTyping      *bool   `json:"show_agent_typing,omitempty" example:"true"`
	ShowReadReceipts     *bool   `json:"show_read_receipts,omitempty" example:"true"`
	AllowFileUpload      *bool   `json:"allow_file_upload,omitempty" example:"true"`
	RequireEmail         *bool   `json:"require_email,omitempty" example:"false"`
	RequireName          *bool   `json:"require_name,omitempty" example:"true"`
	DefaultTeam          *string `json:"default_team,omitempty" example:"Support Team"`
	BusinessHoursEnabled *bool   `json:"business_hours_enabled,omitempty" example:"true"`
	BusinessHours        *string `json:"business_hours,omitempty"`
}

// ChatSessionResponse represents chat session data
// @Description Chat conversation session
type ChatSessionResponse struct {
	ID                int64                    `json:"id" example:"1"`
	TenantID          string                   `json:"tenant_id" example:"acme-corp"`
	WidgetID          int64                    `json:"widget_id" example:"1"`
	SessionKey        string                   `json:"session_key" example:"sess_xyz789"`
	Status            common.ChatSessionStatus `json:"status" example:"active"`
	VisitorName       *string                  `json:"visitor_name,omitempty" example:"Jane Visitor"`
	VisitorEmail      *string                  `json:"visitor_email,omitempty" example:"jane@example.com"`
	AssignedToID      *int64                   `json:"assigned_to_id,omitempty" example:"1"`
	AssignedToName    *string                  `json:"assigned_to_name,omitempty" example:"Agent John"`
	AssignedTeam      *string                  `json:"assigned_team,omitempty" example:"Support Team"`
	MessageCount      int                      `json:"message_count" example:"15"`
	FirstResponseTime *int                     `json:"first_response_time,omitempty" example:"45"` // seconds
	Duration          *int                     `json:"duration,omitempty" example:"180"`           // seconds
	Rating            *int                     `json:"rating,omitempty" example:"5"`
	RatingComment     *string                  `json:"rating_comment,omitempty"`
	StartedAt         *time.Time               `json:"started_at,omitempty"`
	EndedAt           *time.Time               `json:"ended_at,omitempty"`
	CreatedAt         time.Time                `json:"created_at"`
	UpdatedAt         time.Time                `json:"updated_at"`
}

// StartChatSessionRequest represents chat session initiation
// @Description Start new chat session
type StartChatSessionRequest struct {
	WidgetKey    string  `json:"widget_key" binding:"required" example:"wgt_abc123xyz"`
	VisitorName  *string `json:"visitor_name,omitempty" example:"Jane Visitor"`
	VisitorEmail *string `json:"visitor_email,omitempty" binding:"omitempty,email" example:"jane@example.com"`
	VisitorPhone *string `json:"visitor_phone,omitempty" example:"+1234567890"`
	ReferrerURL  *string `json:"referrer_url,omitempty"`
	CurrentURL   *string `json:"current_url,omitempty"`
}

// CreateChatSessionRequest represents chat session creation (alias for StartChatSessionRequest)
// @Description Create new chat session
type CreateChatSessionRequest = StartChatSessionRequest

// EndChatSessionRequest represents chat session termination
// @Description End chat session
type EndChatSessionRequest struct {
	Rating        *int    `json:"rating,omitempty" binding:"omitempty,min=1,max=5" example:"5"`
	RatingComment *string `json:"rating_comment,omitempty" example:"Great service!"`
}

// ChatMessageResponse represents chat message data
// @Description Chat message
type ChatMessageResponse struct {
	ID             int64                  `json:"id" example:"1"`
	SessionID      int64                  `json:"session_id" example:"1"`
	SenderType     string                 `json:"sender_type" example:"agent"` // visitor, agent, system
	SenderName     string                 `json:"sender_name" example:"Agent John"`
	MessageType    common.ChatMessageType `json:"message_type" example:"text"`
	Body           *string                `json:"body,omitempty" example:"Hello! How can I help you?"`
	AttachmentURL  *string                `json:"attachment_url,omitempty"`
	AttachmentName *string                `json:"attachment_name,omitempty"`
	IsRead         bool                   `json:"is_read" example:"true"`
	CreatedAt      time.Time              `json:"created_at"`
}

// SendChatMessageRequest represents sending chat message
// @Description Send chat message
type SendChatMessageRequest struct {
	Body        *string                `json:"body,omitempty" binding:"required_without=AttachmentURL" example:"Hello! How can I help you?"`
	MessageType common.ChatMessageType `json:"message_type" example:"text"`
}

// TransferChatRequest represents chat transfer data
// @Description Transfer chat to another agent/team
type TransferChatRequest struct {
	ToUserID *int64  `json:"to_user_id,omitempty" example:"2"`
	ToTeam   *string `json:"to_team,omitempty" example:"Support Team"`
	Reason   *string `json:"reason,omitempty" example:"Requires technical expertise"`
}

// ChatAgentResponse represents chat agent data
// @Description Agent chat availability
type ChatAgentResponse struct {
	ID                 int64     `json:"id" example:"1"`
	TenantID           string    `json:"tenant_id" example:"acme-corp"`
	UserID             int64     `json:"user_id" example:"1"`
	UserName           *string   `json:"user_name,omitempty" example:"John Doe"`
	IsAvailable        bool      `json:"is_available" example:"true"`
	MaxConcurrentChats int       `json:"max_concurrent_chats" example:"5"`
	CurrentChats       int       `json:"current_chats" example:"2"`
	Team               *string   `json:"team,omitempty" example:"Support Team"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// UpdateChatAgentRequest represents chat agent update
// @Description Update agent chat settings
type UpdateChatAgentRequest struct {
	IsAvailable        *bool   `json:"is_available,omitempty" example:"true"`
	MaxConcurrentChats *int    `json:"max_concurrent_chats,omitempty" example:"5"`
	Team               *string `json:"team,omitempty" example:"Support Team"`
	AutoAcceptChats    *bool   `json:"auto_accept_chats,omitempty" example:"true"`
}

// RegisterChatAgentRequest represents chat agent registration
// @Description Register agent for chat
type RegisterChatAgentRequest struct {
	MaxConcurrentChats int     `json:"max_concurrent_chats" example:"5"`
	Team               *string `json:"team,omitempty" example:"Support Team"`
	AutoAcceptChats    bool    `json:"auto_accept_chats" example:"true"`
}

// ChatStatsResponse represents chat statistics
// @Description Chat statistics
type ChatStatsResponse struct {
	TotalChats           int     `json:"total_chats" example:"250"`
	ActiveChats          int     `json:"active_chats" example:"15"`
	QueuedChats          int     `json:"queued_chats" example:"3"`
	EndedChats           int     `json:"ended_chats" example:"220"`
	AbandonedChats       int     `json:"abandoned_chats" example:"12"`
	AverageResponseTime  float64 `json:"average_response_time" example:"25.5"`  // seconds
	AverageChatDuration  float64 `json:"average_chat_duration" example:"180.0"` // seconds
	AverageRating        float64 `json:"average_rating" example:"4.5"`
	CustomerSatisfaction float64 `json:"customer_satisfaction" example:"90.0"` // percentage
}
