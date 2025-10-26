package helpdesk

import (
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
)

// Ticket represents a helpdesk support ticket
// @Description Helpdesk ticket with status and priority
type Ticket struct {
	ID             int64                 `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID       string                `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	TicketNumber   string                `gorm:"column:ticket_number;type:varchar(32);not null;uniqueIndex" json:"ticket_number" example:"ACME-00001"`
	Subject        string                `gorm:"column:subject;type:varchar(255);not null" json:"subject" example:"Cannot make outbound calls"`
	Description    *string               `gorm:"column:description;type:text" json:"description,omitempty"`
	Status         common.TicketStatus   `gorm:"column:status;type:enum('open','in_progress','pending','resolved','closed');default:open;index:idx_status" json:"status" example:"open"`
	Priority       common.TicketPriority `gorm:"column:priority;type:enum('low','medium','high','critical');default:medium;index:idx_priority" json:"priority" example:"high"`
	Category       *string               `gorm:"column:category;type:varchar(100);index:idx_category" json:"category,omitempty" example:"Technical"`
	RequesterID    int64                 `gorm:"column:requester_id;not null;index:idx_requester" json:"requester_id" example:"5"`
	RequesterName  *string               `gorm:"column:requester_name;type:varchar(255)" json:"requester_name,omitempty" example:"Jane Customer"`
	RequesterEmail *string               `gorm:"column:requester_email;type:varchar(255)" json:"requester_email,omitempty" example:"jane@customer.com"`
	AssignedToID   *int64                `gorm:"column:assigned_to_id;index:idx_assigned" json:"assigned_to_id,omitempty" example:"1"`
	AssignedTeam   *string               `gorm:"column:assigned_team;type:varchar(100)" json:"assigned_team,omitempty" example:"Support Team"`
	Source         string                `gorm:"column:source;type:varchar(50);default:web" json:"source" example:"email"`
	Tags           []string              `gorm:"-" json:"tags,omitempty"` // Handled via TicketTag table
	Metadata       common.JSONMap        `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	DueDate        *time.Time            `gorm:"column:due_date;index:idx_due_date" json:"due_date,omitempty"`
	ResolvedAt     *time.Time            `gorm:"column:resolved_at" json:"resolved_at,omitempty"`
	ClosedAt       *time.Time            `gorm:"column:closed_at" json:"closed_at,omitempty"`
	CreatedAt      time.Time             `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`
	UpdatedAt      time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	DeletedAt      *time.Time            `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`

	// Relations
	Tenant      *core.Tenant       `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Requester   *core.User         `gorm:"foreignKey:RequesterID" json:"requester,omitempty"`
	AssignedTo  *core.User         `gorm:"foreignKey:AssignedToID" json:"assigned_to,omitempty"`
	Messages    []TicketMessage    `gorm:"foreignKey:TicketID" json:"messages,omitempty"`
	Attachments []TicketAttachment `gorm:"foreignKey:TicketID" json:"attachments,omitempty"`
	TicketTags  []TicketTag        `gorm:"foreignKey:TicketID" json:"ticket_tags,omitempty"`
}

// TableName specifies the table name
func (Ticket) TableName() string {
	return "tickets"
}

// IsOpen checks if ticket is open or in progress
func (t *Ticket) IsOpen() bool {
	return t.Status == common.TicketStatusOpen || t.Status == common.TicketStatusInProgress
}

// IsClosed checks if ticket is closed
func (t *Ticket) IsClosed() bool {
	return t.Status == common.TicketStatusClosed
}

// IsOverdue checks if ticket is past due date
func (t *Ticket) IsOverdue() bool {
	if t.DueDate == nil || t.IsClosed() {
		return false
	}
	return time.Now().After(*t.DueDate)
}

// GetAge returns the age of the ticket in hours
func (t *Ticket) GetAge() float64 {
	return time.Since(t.CreatedAt).Hours()
}

// Close marks the ticket as closed
func (t *Ticket) Close() {
	t.Status = common.TicketStatusClosed
	now := time.Now()
	t.ClosedAt = &now
}

// Resolve marks the ticket as resolved
func (t *Ticket) Resolve() {
	t.Status = common.TicketStatusResolved
	now := time.Now()
	t.ResolvedAt = &now
}

// TicketMessage represents a message/reply in a ticket thread
// @Description Message in a ticket conversation
type TicketMessage struct {
	ID          int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TicketID    int64          `gorm:"column:ticket_id;not null;index:idx_ticket" json:"ticket_id" example:"1"`
	UserID      *int64         `gorm:"column:user_id;index:idx_user" json:"user_id,omitempty" example:"1"`
	SenderName  *string        `gorm:"column:sender_name;type:varchar(255)" json:"sender_name,omitempty" example:"Agent John"`
	SenderEmail *string        `gorm:"column:sender_email;type:varchar(255)" json:"sender_email,omitempty" example:"john@acme.com"`
	Body        string         `gorm:"column:body;type:text;not null" json:"body" example:"Thank you for contacting us. We're looking into this issue."`
	IsInternal  bool           `gorm:"column:is_internal;default:false" json:"is_internal" example:"false"`
	IsHTML      bool           `gorm:"column:is_html;default:false" json:"is_html" example:"false"`
	Metadata    common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`

	// Relations
	Ticket      *Ticket            `gorm:"foreignKey:TicketID" json:"ticket,omitempty"`
	User        *core.User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Attachments []TicketAttachment `gorm:"foreignKey:MessageID" json:"attachments,omitempty"`
}

// TableName specifies the table name
func (TicketMessage) TableName() string {
	return "ticket_messages"
}

// IsFromAgent checks if message is from an agent
func (tm *TicketMessage) IsFromAgent() bool {
	return tm.UserID != nil
}

// TicketAttachment represents a file attached to a ticket or message
// @Description File attachment for tickets
type TicketAttachment struct {
	ID           int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TicketID     int64          `gorm:"column:ticket_id;not null;index:idx_ticket" json:"ticket_id" example:"1"`
	MessageID    *int64         `gorm:"column:message_id;index:idx_message" json:"message_id,omitempty" example:"5"`
	Filename     string         `gorm:"column:filename;type:varchar(512);not null" json:"filename" example:"screenshot.png"`
	FilePath     string         `gorm:"column:file_path;type:varchar(1024);not null" json:"file_path" example:"/storage/tickets/1/screenshot.png"`
	FileSize     int64          `gorm:"column:file_size;default:0" json:"file_size" example:"245760"`
	MimeType     string         `gorm:"column:mime_type;type:varchar(100)" json:"mime_type" example:"image/png"`
	UploadedByID *int64         `gorm:"column:uploaded_by_id;index:idx_uploaded_by" json:"uploaded_by_id,omitempty" example:"1"`
	Metadata     common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt    time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relations
	Ticket     *Ticket        `gorm:"foreignKey:TicketID" json:"ticket,omitempty"`
	Message    *TicketMessage `gorm:"foreignKey:MessageID" json:"message,omitempty"`
	UploadedBy *core.User     `gorm:"foreignKey:UploadedByID" json:"uploaded_by,omitempty"`
}

// TableName specifies the table name
func (TicketAttachment) TableName() string {
	return "ticket_attachments"
}

// GetFileSizeMB returns file size in megabytes
func (ta *TicketAttachment) GetFileSizeMB() float64 {
	return float64(ta.FileSize) / (1024 * 1024)
}

// IsImage checks if attachment is an image
func (ta *TicketAttachment) IsImage() bool {
	switch ta.MimeType {
	case "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp":
		return true
	}
	return false
}

// TicketTag represents a tag assigned to a ticket
type TicketTag struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	TicketID  int64     `gorm:"column:ticket_id;not null;index:idx_ticket" json:"ticket_id"`
	TagID     int64     `gorm:"column:tag_id;not null;index:idx_tag" json:"tag_id"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relations
	Ticket *Ticket   `gorm:"foreignKey:TicketID" json:"ticket,omitempty"`
	Tag    *core.Tag `gorm:"foreignKey:TagID" json:"tag,omitempty"`
}

// TableName specifies the table name
func (TicketTag) TableName() string {
	return "ticket_tags"
}

// TicketTemplate represents a predefined ticket template
// @Description Template for quick ticket creation
type TicketTemplate struct {
	ID           int64                 `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID     string                `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	Name         string                `gorm:"column:name;type:varchar(255);not null" json:"name" example:"Technical Issue Template"`
	Subject      string                `gorm:"column:subject;type:varchar(255);not null" json:"subject" example:"Technical Issue: {{issue_type}}"`
	Description  string                `gorm:"column:description;type:text;not null" json:"description"`
	Category     *string               `gorm:"column:category;type:varchar(100)" json:"category,omitempty" example:"Technical"`
	Priority     common.TicketPriority `gorm:"column:priority;type:enum('low','medium','high','critical');default:medium" json:"priority" example:"medium"`
	AssignedTeam *string               `gorm:"column:assigned_team;type:varchar(100)" json:"assigned_team,omitempty" example:"Support Team"`
	IsActive     bool                  `gorm:"column:is_active;default:true" json:"is_active" example:"true"`
	Metadata     common.JSONMap        `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt    time.Time             `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (TicketTemplate) TableName() string {
	return "ticket_templates"
}

// TicketSLA represents Service Level Agreement settings
// @Description SLA configuration for tickets
type TicketSLA struct {
	ID                int64                 `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID          string                `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	Name              string                `gorm:"column:name;type:varchar(255);not null" json:"name" example:"Critical Priority SLA"`
	Priority          common.TicketPriority `gorm:"column:priority;type:enum('low','medium','high','critical');not null;index" json:"priority" example:"critical"`
	FirstResponseTime int                   `gorm:"column:first_response_time;not null" json:"first_response_time" example:"60"` // minutes
	ResolutionTime    int                   `gorm:"column:resolution_time;not null" json:"resolution_time" example:"240"`        // minutes
	BusinessHoursOnly bool                  `gorm:"column:business_hours_only;default:false" json:"business_hours_only" example:"false"`
	IsActive          bool                  `gorm:"column:is_active;default:true" json:"is_active" example:"true"`
	CreatedAt         time.Time             `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (TicketSLA) TableName() string {
	return "ticket_slas"
}

// GetFirstResponseTimeHours returns first response time in hours
func (ts *TicketSLA) GetFirstResponseTimeHours() float64 {
	return float64(ts.FirstResponseTime) / 60.0
}

// GetResolutionTimeHours returns resolution time in hours
func (ts *TicketSLA) GetResolutionTimeHours() float64 {
	return float64(ts.ResolutionTime) / 60.0
}

// Contact represents a contact in the helpdesk system
// @Description Customer contact information
type Contact struct {
	ID        int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID  string         `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	Name      string         `gorm:"column:name;type:varchar(255);not null" json:"name" example:"Jane Customer"`
	Email     string         `gorm:"column:email;type:varchar(255);not null;uniqueIndex:idx_tenant_email" json:"email" example:"jane@customer.com"`
	Phone     *string        `gorm:"column:phone;type:varchar(20)" json:"phone,omitempty" example:"+15551234567"`
	Company   *string        `gorm:"column:company;type:varchar(255)" json:"company,omitempty" example:"Customer Corp"`
	Timezone  *string        `gorm:"column:timezone;type:varchar(50)" json:"timezone,omitempty" example:"America/New_York"`
	Language  *string        `gorm:"column:language;type:varchar(10)" json:"language,omitempty" example:"en"`
	Notes     *string        `gorm:"column:notes;type:text" json:"notes,omitempty"`
	Metadata  common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	IsActive  bool           `gorm:"column:is_active;default:true" json:"is_active" example:"true"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time     `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`

	// Relations
	Tenant  *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Tickets []Ticket     `gorm:"foreignKey:RequesterID" json:"tickets,omitempty"`
}

// TableName specifies the table name
func (Contact) TableName() string {
	return "contacts"
}
