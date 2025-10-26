package common

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// UserRole represents the role of a user in a tenant
type UserRole string

const (
	RoleSuperAdmin  UserRole = "superadmin"
	RoleTenantAdmin UserRole = "tenant_admin"
	RoleSupervisor  UserRole = "supervisor"
	RoleAgent       UserRole = "agent"
	RoleViewer      UserRole = "viewer"
)

// UserStatus represents the status of a user account
type UserStatus string

const (
	UserStatusActive    UserStatus = "active"
	UserStatusInactive  UserStatus = "inactive"
	UserStatusSuspended UserStatus = "suspended"
)

// TenantStatus represents the status of a tenant
type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "active"
	TenantStatusSuspended TenantStatus = "suspended"
	TenantStatusTrial     TenantStatus = "trial"
	TenantStatusInactive  TenantStatus = "inactive"
)

// DIDStatus represents the status of a phone number
type DIDStatus string

const (
	DIDStatusActive   DIDStatus = "active"
	DIDStatusInactive DIDStatus = "inactive"
	DIDStatusPending  DIDStatus = "pending"
)

// RouteType represents how incoming calls should be routed
type RouteType string

const (
	RouteTypeQueue     RouteType = "queue"
	RouteTypeEndpoint  RouteType = "endpoint"
	RouteTypeIVR       RouteType = "ivr"
	RouteTypeWebhook   RouteType = "webhook"
	RouteTypeExternal  RouteType = "external"
	RouteTypeVoicemail RouteType = "voicemail"
)

// AgentStatus represents the status of an agent
type AgentStatus string

const (
	AgentStatusAvailable AgentStatus = "available"
	AgentStatusBusy      AgentStatus = "busy"
	AgentStatusAway      AgentStatus = "away"
	AgentStatusBreak     AgentStatus = "break"
	AgentStatusOffline   AgentStatus = "offline"
	AgentStatusDND       AgentStatus = "dnd"
)

// AgentState is an alias for AgentStatus for backward compatibility
type AgentState = AgentStatus

// Constant aliases for AgentState
const (
	AgentStateAvailable = AgentStatusAvailable
	AgentStateBusy      = AgentStatusBusy
	AgentStateAway      = AgentStatusAway
	AgentStateBreak     = AgentStatusBreak
	AgentStateOffline   = AgentStatusOffline
	AgentStateDND       = AgentStatusDND
)

// CallDirection represents the direction of a call
type CallDirection string

const (
	CallDirectionInbound  CallDirection = "inbound"
	CallDirectionOutbound CallDirection = "outbound"
)

// CallDisposition represents the outcome of a call
type CallDisposition string

const (
	CallDispositionAnswered  CallDisposition = "ANSWERED"
	CallDispositionNoAnswer  CallDisposition = "NO ANSWER"
	CallDispositionBusy      CallDisposition = "BUSY"
	CallDispositionFailed    CallDisposition = "FAILED"
	CallDispositionCongested CallDisposition = "CONGESTION"
)

// SMSDirection represents SMS message direction
type SMSDirection string

const (
	SMSDirectionInbound  SMSDirection = "inbound"
	SMSDirectionOutbound SMSDirection = "outbound"
)

// SMSStatus represents SMS delivery status
type SMSStatus string

const (
	SMSStatusPending   SMSStatus = "pending"
	SMSStatusQueued    SMSStatus = "queued"
	SMSStatusSent      SMSStatus = "sent"
	SMSStatusDelivered SMSStatus = "delivered"
	SMSStatusFailed    SMSStatus = "failed"
	SMSStatusReceived  SMSStatus = "received"
)

// RecordingStatus represents the status of a call recording
type RecordingStatus string

const (
	RecordingStatusRecording RecordingStatus = "recording"
	RecordingStatusCompleted RecordingStatus = "completed"
	RecordingStatusFailed    RecordingStatus = "failed"
	RecordingStatusDeleted   RecordingStatus = "deleted"
)

// TicketStatus represents the status of a helpdesk ticket
type TicketStatus string

const (
	TicketStatusOpen       TicketStatus = "open"
	TicketStatusInProgress TicketStatus = "in_progress"
	TicketStatusPending    TicketStatus = "pending"
	TicketStatusResolved   TicketStatus = "resolved"
	TicketStatusClosed     TicketStatus = "closed"
)

// TicketPriority represents the priority level of a ticket
type TicketPriority string

const (
	TicketPriorityLow      TicketPriority = "low"
	TicketPriorityMedium   TicketPriority = "medium"
	TicketPriorityHigh     TicketPriority = "high"
	TicketPriorityCritical TicketPriority = "critical"
)

// ChatMessageType represents the type of chat message
type ChatMessageType string

const (
	ChatMessageTypeText     ChatMessageType = "text"
	ChatMessageTypeImage    ChatMessageType = "image"
	ChatMessageTypeFile     ChatMessageType = "file"
	ChatMessageTypeSystem   ChatMessageType = "system"
	ChatMessageTypeTransfer ChatMessageType = "transfer"
)

// ChatSessionStatus represents the status of a chat session
type ChatSessionStatus string

const (
	ChatSessionStatusActive    ChatSessionStatus = "active"
	ChatSessionStatusQueued    ChatSessionStatus = "queued"
	ChatSessionStatusEnded     ChatSessionStatus = "ended"
	ChatSessionStatusAbandoned ChatSessionStatus = "abandoned"
)

// JSONMap is a helper type for JSON metadata fields
type JSONMap map[string]interface{}

// Value implements driver.Valuer interface for GORM
func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements sql.Scanner interface for GORM
func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, j)
}

// Permissions represents role-based permissions
type Permissions struct {
	CanManageAgents       bool `json:"can_manage_agents"`
	CanManageDIDs         bool `json:"can_manage_dids"`
	CanViewReports        bool `json:"can_view_reports"`
	CanMakeCalls          bool `json:"can_make_calls"`
	CanReceiveCalls       bool `json:"can_receive_calls"`
	CanSendSMS            bool `json:"can_send_sms"`
	CanViewAllCalls       bool `json:"can_view_all_calls"`
	CanListenCalls        bool `json:"can_listen_calls"`
	CanCoachAgents        bool `json:"can_coach_agents"`
	CanManageTickets      bool `json:"can_manage_tickets"`
	CanManageChat         bool `json:"can_manage_chat"`
	CanAccessDashboard    bool `json:"can_access_dashboard"`
	CanManageSettings     bool `json:"can_manage_settings"`
	CanManageIntegrations bool `json:"can_manage_integrations"`
}

// Value implements driver.Valuer interface
func (p Permissions) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan implements sql.Scanner interface
func (p *Permissions) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, p)
}

// TenantFeatures represents enabled features for a tenant
type TenantFeatures struct {
	WebRTC    bool `json:"webrtc"`
	SMS       bool `json:"sms"`
	Recording bool `json:"recording"`
	Queue     bool `json:"queue"`
	IVR       bool `json:"ivr"`
	Chat      bool `json:"chat"`
	Helpdesk  bool `json:"helpdesk"`
	Analytics bool `json:"analytics"`
	API       bool `json:"api"`
}

// Value implements driver.Valuer interface
func (f TenantFeatures) Value() (driver.Value, error) {
	return json.Marshal(f)
}

// Scan implements sql.Scanner interface
func (f *TenantFeatures) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, f)
}

// TenantSettings represents tenant-specific settings
type TenantSettings struct {
	Timezone        string `json:"timezone"`
	Language        string `json:"language"`
	Currency        string `json:"currency"`
	DateFormat      string `json:"date_format"`
	TimeFormat      string `json:"time_format"`
	CallRecording   bool   `json:"call_recording"`
	ChatEnabled     bool   `json:"chat_enabled"`
	HelpdeskEnabled bool   `json:"helpdesk_enabled"`
	BusinessHours   string `json:"business_hours"`
}

// Value implements driver.Valuer interface
func (s TenantSettings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan implements sql.Scanner interface
func (s *TenantSettings) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, s)
}

// BaseModel contains common fields for all models
type BaseModel struct {
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// SoftDeleteModel adds soft delete capability
type SoftDeleteModel struct {
	BaseModel
}
