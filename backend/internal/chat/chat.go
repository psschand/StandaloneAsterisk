package chat

import (
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
)

// ChatWidget represents the embeddable chat widget configuration for a tenant
// @Description Chat widget configuration and embed code
type ChatWidget struct {
	ID        int64  `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID  string `gorm:"column:tenant_id;type:varchar(64);not null;uniqueIndex:idx_tenant_widget" json:"tenant_id" example:"acme-corp"`
	WidgetKey string `gorm:"column:widget_key;type:varchar(64);not null;uniqueIndex" json:"widget_key" example:"wgt_abc123xyz"`
	Name      string `gorm:"column:name;type:varchar(255);not null" json:"name" example:"Main Website Chat"`
	IsEnabled bool   `gorm:"column:is_enabled;default:true;index" json:"is_enabled" example:"true"`

	// Appearance
	PrimaryColor    string  `gorm:"column:primary_color;type:varchar(7);default:#0084FF" json:"primary_color" example:"#0084FF"`
	SecondaryColor  string  `gorm:"column:secondary_color;type:varchar(7);default:#FFFFFF" json:"secondary_color" example:"#FFFFFF"`
	WidgetPosition  string  `gorm:"column:widget_position;type:varchar(20);default:bottom-right" json:"widget_position" example:"bottom-right"`
	WelcomeMessage  string  `gorm:"column:welcome_message;type:text" json:"welcome_message" example:"Hi! How can we help you today?"`
	PlaceholderText string  `gorm:"column:placeholder_text;type:varchar(255);default:Type your message..." json:"placeholder_text" example:"Type your message..."`
	Avatar          *string `gorm:"column:avatar;type:varchar(512)" json:"avatar,omitempty"`

	// Behavior
	ShowAgentTyping  bool `gorm:"column:show_agent_typing;default:true" json:"show_agent_typing" example:"true"`
	ShowReadReceipts bool `gorm:"column:show_read_receipts;default:true" json:"show_read_receipts" example:"true"`
	AllowFileUpload  bool `gorm:"column:allow_file_upload;default:true" json:"allow_file_upload" example:"true"`
	AllowEmojis      bool `gorm:"column:allow_emojis;default:true" json:"allow_emojis" example:"true"`
	RequireEmail     bool `gorm:"column:require_email;default:false" json:"require_email" example:"false"`
	RequireName      bool `gorm:"column:require_name;default:true" json:"require_name" example:"true"`

	// Routing
	DefaultTeam     *string `gorm:"column:default_team;type:varchar(100)" json:"default_team,omitempty" example:"Support Team"`
	DefaultAssignee *int64  `gorm:"column:default_assignee" json:"default_assignee,omitempty" example:"1"`
	AutoAssign      bool    `gorm:"column:auto_assign;default:true" json:"auto_assign" example:"true"`

	// Business hours
	BusinessHoursEnabled bool    `gorm:"column:business_hours_enabled;default:false" json:"business_hours_enabled" example:"true"`
	BusinessHours        *string `gorm:"column:business_hours;type:json" json:"business_hours,omitempty"`
	OfflineMessage       *string `gorm:"column:offline_message;type:text" json:"offline_message,omitempty" example:"We're currently offline. Leave a message and we'll get back to you!"`

	// Security
	AllowedDomains *string `gorm:"column:allowed_domains;type:text" json:"allowed_domains,omitempty" example:"example.com,*.example.com"`
	IPWhitelist    *string `gorm:"column:ip_whitelist;type:text" json:"ip_whitelist,omitempty"`

	Metadata  common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (ChatWidget) TableName() string {
	return "chat_widgets"
}

// GetEmbedCode generates the JavaScript embed code for the widget
func (cw *ChatWidget) GetEmbedCode() string {
	return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.async = true;
    script.setAttribute('data-widget-key', '` + cw.WidgetKey + `');
    document.head.appendChild(script);
  })();
</script>`
}

// ChatSession represents an active or historical chat conversation
// @Description Chat conversation session
type ChatSession struct {
	ID         int64                    `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID   string                   `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	WidgetID   int64                    `gorm:"column:widget_id;not null;index:idx_widget" json:"widget_id" example:"1"`
	SessionKey string                   `gorm:"column:session_key;type:varchar(64);not null;uniqueIndex" json:"session_key" example:"sess_xyz789"`
	Status     common.ChatSessionStatus `gorm:"column:status;type:enum('active','queued','ended','abandoned');default:active;index:idx_status" json:"status" example:"active"`

	// Visitor info
	VisitorName  *string `gorm:"column:visitor_name;type:varchar(255)" json:"visitor_name,omitempty" example:"Jane Visitor"`
	VisitorEmail *string `gorm:"column:visitor_email;type:varchar(255);index:idx_visitor_email" json:"visitor_email,omitempty" example:"jane@example.com"`
	VisitorPhone *string `gorm:"column:visitor_phone;type:varchar(32)" json:"visitor_phone,omitempty" example:"+1234567890"`
	IPAddress    *string `gorm:"column:ip_address;type:varchar(45)" json:"ip_address,omitempty" example:"192.168.1.100"`
	UserAgent    *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	ReferrerURL  *string `gorm:"column:referrer_url;type:varchar(1024)" json:"referrer_url,omitempty"`
	CurrentURL   *string `gorm:"column:current_url;type:varchar(1024)" json:"current_url,omitempty"`

	// Assignment
	AssignedToID      *int64  `gorm:"column:assigned_to_id;index:idx_assigned" json:"assigned_to_id,omitempty" example:"1"`
	AssignedTeam      *string `gorm:"column:assigned_team;type:varchar(100)" json:"assigned_team,omitempty" example:"Support Team"`
	FirstResponseTime *int    `gorm:"column:first_response_time" json:"first_response_time,omitempty" example:"45"` // seconds

	// Timing
	QueuedAt  *time.Time `gorm:"column:queued_at" json:"queued_at,omitempty"`
	StartedAt *time.Time `gorm:"column:started_at;index:idx_started" json:"started_at,omitempty"`
	EndedAt   *time.Time `gorm:"column:ended_at" json:"ended_at,omitempty"`
	Duration  *int       `gorm:"column:duration" json:"duration,omitempty" example:"180"` // seconds

	// Ratings
	Rating        *int    `gorm:"column:rating" json:"rating,omitempty" example:"5"`
	RatingComment *string `gorm:"column:rating_comment;type:text" json:"rating_comment,omitempty"`

	Metadata  common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant     *core.Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Widget     *ChatWidget    `gorm:"foreignKey:WidgetID" json:"widget,omitempty"`
	AssignedTo *core.User     `gorm:"foreignKey:AssignedToID" json:"assigned_to,omitempty"`
	Messages   []ChatMessage  `gorm:"foreignKey:SessionID" json:"messages,omitempty"`
	Transfers  []ChatTransfer `gorm:"foreignKey:SessionID" json:"transfers,omitempty"`
}

// TableName specifies the table name
func (ChatSession) TableName() string {
	return "chat_sessions"
}

// IsActive checks if session is active
func (cs *ChatSession) IsActive() bool {
	return cs.Status == common.ChatSessionStatusActive
}

// IsEnded checks if session has ended
func (cs *ChatSession) IsEnded() bool {
	return cs.Status == common.ChatSessionStatusEnded
}

// GetDurationMinutes returns duration in minutes
func (cs *ChatSession) GetDurationMinutes() float64 {
	if cs.Duration == nil {
		return 0
	}
	return float64(*cs.Duration) / 60.0
}

// End marks the session as ended
func (cs *ChatSession) End() {
	cs.Status = common.ChatSessionStatusEnded
	now := time.Now()
	cs.EndedAt = &now
	if cs.StartedAt != nil {
		duration := int(now.Sub(*cs.StartedAt).Seconds())
		cs.Duration = &duration
	}
}

// ChatMessage represents a single message in a chat session
// @Description Individual message in a chat conversation
type ChatMessage struct {
	ID             int64                  `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	SessionID      int64                  `gorm:"column:session_id;not null;index:idx_session" json:"session_id" example:"1"`
	SenderType     string                 `gorm:"column:sender_type;type:varchar(20);not null" json:"sender_type" example:"agent"` // visitor, agent, system
	SenderID       *int64                 `gorm:"column:sender_id;index:idx_sender" json:"sender_id,omitempty" example:"1"`
	SenderName     string                 `gorm:"column:sender_name;type:varchar(255);not null" json:"sender_name" example:"Agent John"`
	MessageType    common.ChatMessageType `gorm:"column:message_type;type:enum('text','image','file','system','transfer');default:text" json:"message_type" example:"text"`
	Body           *string                `gorm:"column:body;type:text" json:"body,omitempty" example:"Hello! How can I help you?"`
	AttachmentURL  *string                `gorm:"column:attachment_url;type:varchar(1024)" json:"attachment_url,omitempty"`
	AttachmentName *string                `gorm:"column:attachment_name;type:varchar(512)" json:"attachment_name,omitempty"`
	AttachmentSize *int64                 `gorm:"column:attachment_size" json:"attachment_size,omitempty" example:"245760"`
	AttachmentType *string                `gorm:"column:attachment_type;type:varchar(100)" json:"attachment_type,omitempty" example:"image/png"`
	IsRead         bool                   `gorm:"column:is_read;default:false;index:idx_read" json:"is_read" example:"true"`
	ReadAt         *time.Time             `gorm:"column:read_at" json:"read_at,omitempty"`
	Metadata       common.JSONMap         `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt      time.Time              `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`

	// Relations
	Session *ChatSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	Sender  *core.User   `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

// TableName specifies the table name
func (ChatMessage) TableName() string {
	return "chat_messages"
}

// IsFromVisitor checks if message is from visitor
func (cm *ChatMessage) IsFromVisitor() bool {
	return cm.SenderType == "visitor"
}

// IsFromAgent checks if message is from agent
func (cm *ChatMessage) IsFromAgent() bool {
	return cm.SenderType == "agent"
}

// IsSystemMessage checks if message is a system message
func (cm *ChatMessage) IsSystemMessage() bool {
	return cm.SenderType == "system"
}

// MarkAsRead marks the message as read
func (cm *ChatMessage) MarkAsRead() {
	cm.IsRead = true
	now := time.Now()
	cm.ReadAt = &now
}

// ChatTransfer represents a chat transfer between agents or teams
// @Description Chat transfer record
type ChatTransfer struct {
	ID         int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	SessionID  int64          `gorm:"column:session_id;not null;index:idx_session" json:"session_id" example:"1"`
	FromUserID *int64         `gorm:"column:from_user_id;index:idx_from_user" json:"from_user_id,omitempty" example:"1"`
	FromTeam   *string        `gorm:"column:from_team;type:varchar(100)" json:"from_team,omitempty" example:"Sales Team"`
	ToUserID   *int64         `gorm:"column:to_user_id;index:idx_to_user" json:"to_user_id,omitempty" example:"2"`
	ToTeam     *string        `gorm:"column:to_team;type:varchar(100)" json:"to_team,omitempty" example:"Support Team"`
	Reason     *string        `gorm:"column:reason;type:varchar(255)" json:"reason,omitempty" example:"Requires technical expertise"`
	Status     string         `gorm:"column:status;type:varchar(20);default:pending" json:"status" example:"accepted"` // pending, accepted, rejected
	AcceptedAt *time.Time     `gorm:"column:accepted_at" json:"accepted_at,omitempty"`
	RejectedAt *time.Time     `gorm:"column:rejected_at" json:"rejected_at,omitempty"`
	Metadata   common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relations
	Session  *ChatSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	FromUser *core.User   `gorm:"foreignKey:FromUserID" json:"from_user,omitempty"`
	ToUser   *core.User   `gorm:"foreignKey:ToUserID" json:"to_user,omitempty"`
}

// TableName specifies the table name
func (ChatTransfer) TableName() string {
	return "chat_transfers"
}

// IsAccepted checks if transfer was accepted
func (ct *ChatTransfer) IsAccepted() bool {
	return ct.Status == "accepted"
}

// IsRejected checks if transfer was rejected
func (ct *ChatTransfer) IsRejected() bool {
	return ct.Status == "rejected"
}

// IsPending checks if transfer is pending
func (ct *ChatTransfer) IsPending() bool {
	return ct.Status == "pending"
}

// Accept marks the transfer as accepted
func (ct *ChatTransfer) Accept() {
	ct.Status = "accepted"
	now := time.Now()
	ct.AcceptedAt = &now
}

// Reject marks the transfer as rejected
func (ct *ChatTransfer) Reject() {
	ct.Status = "rejected"
	now := time.Now()
	ct.RejectedAt = &now
}

// ChatAgent represents an agent's chat-specific settings
// @Description Agent chat availability and settings
type ChatAgent struct {
	ID                  int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID            string         `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_user" json:"tenant_id" example:"acme-corp"`
	UserID              int64          `gorm:"column:user_id;not null;index:idx_tenant_user" json:"user_id" example:"1"`
	IsAvailable         bool           `gorm:"column:is_available;default:false;index:idx_available" json:"is_available" example:"true"`
	MaxConcurrentChats  int            `gorm:"column:max_concurrent_chats;default:5" json:"max_concurrent_chats" example:"5"`
	CurrentChats        int            `gorm:"column:current_chats;default:0" json:"current_chats" example:"2"`
	Team                *string        `gorm:"column:team;type:varchar(100);index:idx_team" json:"team,omitempty" example:"Support Team"`
	Skills              *string        `gorm:"column:skills;type:json" json:"skills,omitempty"`
	AutoAcceptChats     bool           `gorm:"column:auto_accept_chats;default:true" json:"auto_accept_chats" example:"true"`
	NotificationEnabled bool           `gorm:"column:notification_enabled;default:true" json:"notification_enabled" example:"true"`
	Metadata            common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	UpdatedAt           time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User   *core.User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (ChatAgent) TableName() string {
	return "chat_agents"
}

// CanAcceptChat checks if agent can accept a new chat
func (ca *ChatAgent) CanAcceptChat() bool {
	return ca.IsAvailable && ca.CurrentChats < ca.MaxConcurrentChats
}

// IncrementCurrentChats increments the current chat count
func (ca *ChatAgent) IncrementCurrentChats() {
	ca.CurrentChats++
}

// DecrementCurrentChats decrements the current chat count
func (ca *ChatAgent) DecrementCurrentChats() {
	if ca.CurrentChats > 0 {
		ca.CurrentChats--
	}
}
