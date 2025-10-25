package dto
package dto

import (
	"time"
	"github.com/yourusername/callcenter/backend-models/common"
)

// ===================================
// DID (PHONE NUMBER) MANAGEMENT
// ===================================

// DIDResponse represents DID/phone number data
// @Description Phone number information
type DIDResponse struct {
	ID            int64            `json:"id" example:"1"`
	TenantID      string           `json:"tenant_id" example:"acme-corp"`
	Number        string           `json:"number" example:"+15551234567"`
	CountryCode   *string          `json:"country_code,omitempty" example:"+1"`
	FriendlyName  *string          `json:"friendly_name,omitempty" example:"Main Sales Line"`
	RouteType     common.RouteType `json:"route_type" example:"queue"`
	RouteTarget   string           `json:"route_target" example:"sales"`
	SMSEnabled    bool             `json:"sms_enabled" example:"true"`
	SMSWebhookURL *string          `json:"sms_webhook_url,omitempty"`
	Status        common.DIDStatus `json:"status" example:"active"`
	Metadata      common.JSONMap   `json:"metadata,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

// CreateDIDRequest represents DID creation data
// @Description Create new phone number
type CreateDIDRequest struct {
	Number        string           `json:"number" binding:"required" example:"+15551234567"`
	CountryCode   *string          `json:"country_code,omitempty" example:"+1"`
	FriendlyName  *string          `json:"friendly_name,omitempty" example:"Main Sales Line"`
	RouteType     common.RouteType `json:"route_type" binding:"required" example:"queue"`
	RouteTarget   string           `json:"route_target" binding:"required" example:"sales"`
	SMSEnabled    bool             `json:"sms_enabled" example:"true"`
	SMSWebhookURL *string          `json:"sms_webhook_url,omitempty"`
	Metadata      common.JSONMap   `json:"metadata,omitempty"`
}

// UpdateDIDRequest represents DID update data
// @Description Update phone number configuration
type UpdateDIDRequest struct {
	FriendlyName  *string          `json:"friendly_name,omitempty" example:"Main Sales Line"`
	RouteType     *common.RouteType`json:"route_type,omitempty" example:"queue"`
	RouteTarget   *string          `json:"route_target,omitempty" example:"sales"`
	SMSEnabled    *bool            `json:"sms_enabled,omitempty" example:"true"`
	SMSWebhookURL *string          `json:"sms_webhook_url,omitempty"`
	Status        *common.DIDStatus`json:"status,omitempty" example:"active"`
	Metadata      common.JSONMap   `json:"metadata,omitempty"`
}

// ===================================
// CALL QUEUE MANAGEMENT
// ===================================

// QueueResponse represents queue data
// @Description Call queue configuration
type QueueResponse struct {
	ID                int64          `json:"id" example:"1"`
	TenantID          string         `json:"tenant_id" example:"acme-corp"`
	Name              string         `json:"name" example:"sales"`
	DisplayName       string         `json:"display_name" example:"Sales Queue"`
	Strategy          string         `json:"strategy" example:"leastrecent"`
	Timeout           int            `json:"timeout" example:"30"`
	Retry             int            `json:"retry" example:"5"`
	MaxWaitTime       int            `json:"max_wait_time" example:"300"`
	MaxLen            int            `json:"max_len" example:"0"`
	AnnounceFrequency int            `json:"announce_frequency" example:"60"`
	AnnounceHoldTime  bool           `json:"announce_hold_time" example:"true"`
	MusicOnHold       string         `json:"music_on_hold" example:"default"`
	Status            string         `json:"status" example:"active"`
	MemberCount       int            `json:"member_count" example:"5"`
	Metadata          common.JSONMap `json:"metadata,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

// CreateQueueRequest represents queue creation data
// @Description Create new call queue
type CreateQueueRequest struct {
	Name              string         `json:"name" binding:"required" example:"sales"`
	DisplayName       string         `json:"display_name" binding:"required" example:"Sales Queue"`
	Strategy          string         `json:"strategy" example:"leastrecent"`
	Timeout           int            `json:"timeout" example:"30"`
	Retry             int            `json:"retry" example:"5"`
	MaxWaitTime       int            `json:"max_wait_time" example:"300"`
	MaxLen            int            `json:"max_len" example:"0"`
	AnnounceFrequency int            `json:"announce_frequency" example:"60"`
	AnnounceHoldTime  bool           `json:"announce_hold_time" example:"true"`
	MusicOnHold       string         `json:"music_on_hold" example:"default"`
	Metadata          common.JSONMap `json:"metadata,omitempty"`
}

// UpdateQueueRequest represents queue update data
// @Description Update call queue configuration
type UpdateQueueRequest struct {
	DisplayName       *string        `json:"display_name,omitempty" example:"Sales Queue"`
	Strategy          *string        `json:"strategy,omitempty" example:"leastrecent"`
	Timeout           *int           `json:"timeout,omitempty" example:"30"`
	Retry             *int           `json:"retry,omitempty" example:"5"`
	MaxWaitTime       *int           `json:"max_wait_time,omitempty" example:"300"`
	MaxLen            *int           `json:"max_len,omitempty" example:"0"`
	AnnounceFrequency *int           `json:"announce_frequency,omitempty" example:"60"`
	AnnounceHoldTime  *bool          `json:"announce_hold_time,omitempty" example:"true"`
	MusicOnHold       *string        `json:"music_on_hold,omitempty" example:"default"`
	Status            *string        `json:"status,omitempty" example:"active"`
	Metadata          common.JSONMap `json:"metadata,omitempty"`
}

// QueueMemberResponse represents queue member data
// @Description Queue member information
type QueueMemberResponse struct {
	UniqueID       int64   `json:"uniqueid" example:"1"`
	TenantID       string  `json:"tenant_id" example:"acme-corp"`
	QueueName      string  `json:"queue_name" example:"sales"`
	Interface      string  `json:"interface" example:"PJSIP/acme-agent1"`
	MemberName     *string `json:"membername,omitempty" example:"John Doe"`
	StateInterface *string `json:"state_interface,omitempty" example:"PJSIP/acme-agent1"`
	Penalty        int     `json:"penalty" example:"0"`
	Paused         int     `json:"paused" example:"0"`
	WrapupTime     int     `json:"wrapuptime" example:"0"`
}

// AddQueueMemberRequest represents adding member to queue
// @Description Add agent to queue
type AddQueueMemberRequest struct {
	Interface      string  `json:"interface" binding:"required" example:"PJSIP/acme-agent1"`
	MemberName     *string `json:"membername,omitempty" example:"John Doe"`
	StateInterface *string `json:"state_interface,omitempty" example:"PJSIP/acme-agent1"`
	Penalty        int     `json:"penalty" example:"0"`
	Paused         int     `json:"paused" example:"0"`
	WrapupTime     int     `json:"wrapuptime" example:"0"`
}

// ===================================
// CDR (CALL DETAIL RECORD)
// ===================================

// CDRResponse represents call detail record data
// @Description Call detail record
type CDRResponse struct {
	ID            int64                  `json:"id" example:"1"`
	TenantID      string                 `json:"tenant_id" example:"acme-corp"`
	CallDate      time.Time              `json:"calldate"`
	CLID          string                 `json:"clid" example:"\"John Doe\" <+15551234567>"`
	Src           string                 `json:"src" example:"+15551234567"`
	Dst           string                 `json:"dst" example:"+15559876543"`
	Duration      int                    `json:"duration" example:"125"`
	BillSec       int                    `json:"billsec" example:"120"`
	Disposition   common.CallDisposition `json:"disposition" example:"ANSWERED"`
	RecordingFile *string                `json:"recordingfile,omitempty"`
	QueueName     *string                `json:"queue_name,omitempty" example:"sales"`
	QueueWaitTime int                    `json:"queue_wait_time" example:"15"`
	AgentName     *string                `json:"agent_name,omitempty" example:"John Doe"`
	Metadata      common.JSONMap         `json:"metadata,omitempty"`
}

// CDRFilterRequest represents CDR filter parameters
// @Description Filter parameters for CDR list
type CDRFilterRequest struct {
	StartDate   *time.Time              `form:"start_date" json:"start_date,omitempty"`
	EndDate     *time.Time              `form:"end_date" json:"end_date,omitempty"`
	Disposition *common.CallDisposition `form:"disposition" json:"disposition,omitempty" example:"ANSWERED"`
	QueueName   *string                 `form:"queue_name" json:"queue_name,omitempty" example:"sales"`
	Src         *string                 `form:"src" json:"src,omitempty" example:"+15551234567"`
	Dst         *string                 `form:"dst" json:"dst,omitempty" example:"+15559876543"`
	UserID      *int64                  `form:"user_id" json:"user_id,omitempty" example:"1"`
	Page        int                     `form:"page" json:"page" binding:"min=1" example:"1"`
	PageSize    int                     `form:"page_size" json:"page_size" binding:"min=1,max=100" example:"20"`
}

// CDRStatsResponse represents CDR statistics
// @Description Call statistics
type CDRStatsResponse struct {
	TotalCalls        int     `json:"total_calls" example:"150"`
	AnsweredCalls     int     `json:"answered_calls" example:"135"`
	MissedCalls       int     `json:"missed_calls" example:"10"`
	BusyCalls         int     `json:"busy_calls" example:"5"`
	AverageDuration   float64 `json:"average_duration" example:"125.5"`
	AverageWaitTime   float64 `json:"average_wait_time" example:"15.3"`
	TotalDuration     int     `json:"total_duration" example:"16875"`
	AnswerRate        float64 `json:"answer_rate" example:"90.0"`
}

// ===================================
// AGENT STATE & STATUS
// ===================================

// AgentStateResponse represents agent state data
// @Description Agent presence and status
type AgentStateResponse struct {
	ID            int64              `json:"id" example:"1"`
	TenantID      string             `json:"tenant_id" example:"acme-corp"`
	UserID        int64              `json:"user_id" example:"1"`
	EndpointID    string             `json:"endpoint_id" example:"acme-agent1"`
	State         common.AgentStatus `json:"state" example:"available"`
	Reason        *string            `json:"reason,omitempty" example:"Lunch break"`
	CurrentCallID *string            `json:"current_call_id,omitempty" example:"1634567890.123"`
	UserName      *string            `json:"user_name,omitempty" example:"John Doe"`
	ChangedAt     time.Time          `json:"changed_at"`
}

// UpdateAgentStateRequest represents agent state update
// @Description Update agent status
type UpdateAgentStateRequest struct {
	State  common.AgentStatus `json:"state" binding:"required,oneof=available busy away break offline dnd" example:"available"`
	Reason *string            `json:"reason,omitempty" example:"Lunch break"`
}

// ===================================
// SMS MANAGEMENT
// ===================================

// SMSResponse represents SMS message data
// @Description SMS message information
type SMSResponse struct {
	ID                int64              `json:"id" example:"1"`
	TenantID          string             `json:"tenant_id" example:"acme-corp"`
	Direction         common.SMSDirection`json:"direction" example:"outbound"`
	Sender            string             `json:"sender" example:"+15551234567"`
	Recipient         string             `json:"recipient" example:"+15559876543"`
	Body              *string            `json:"body,omitempty" example:"Hello from Acme Corp!"`
	Status            common.SMSStatus   `json:"status" example:"delivered"`
	ErrorMessage      *string            `json:"error_message,omitempty"`
	Segments          int                `json:"segments" example:"1"`
	Cost              float64            `json:"cost" example:"0.0075"`
	Provider          string             `json:"provider" example:"twilio"`
	ProviderMessageID *string            `json:"provider_message_id,omitempty" example:"SM1234567890abcdef"`
	CreatedAt         time.Time          `json:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at"`
}

// SendSMSRequest represents SMS sending data
// @Description Send SMS message
type SendSMSRequest struct {
	Sender    string `json:"sender" binding:"required" example:"+15551234567"`
	Recipient string `json:"recipient" binding:"required" example:"+15559876543"`
	Body      string `json:"body" binding:"required,max=1600" example:"Hello from Acme Corp!"`
}

// ===================================
// VOICEMAIL MANAGEMENT
// ===================================

// VoicemailResponse represents voicemail data
// @Description Voicemail message information
type VoicemailResponse struct {
	ID            int64     `json:"id" example:"1"`
	TenantID      string    `json:"tenant_id" example:"acme-corp"`
	CallerID      string    `json:"callerid" example:"+15551234567"`
	CallerName    *string   `json:"callername,omitempty" example:"John Doe"`
	Duration      int       `json:"duration" example:"45"`
	FileSize      int64     `json:"file_size" example:"180224"`
	Format        string    `json:"format" example:"wav"`
	IsRead        bool      `json:"is_read" example:"false"`
	Transcription *string   `json:"transcription,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	ReadAt        *time.Time`json:"read_at,omitempty"`
}

// ===================================
// ENDPOINT (SIP) MANAGEMENT
// ===================================

// EndpointResponse represents SIP endpoint data
// @Description SIP endpoint configuration
type EndpointResponse struct {
	ID              string    `json:"id" example:"acme-agent1"`
	TenantID        string    `json:"tenant_id" example:"acme-corp"`
	DisplayName     *string   `json:"display_name,omitempty" example:"John Doe (Agent 1)"`
	Transport       *string   `json:"transport,omitempty" example:"transport-wss"`
	Context         *string   `json:"context,omitempty" example:"agents"`
	Allow           *string   `json:"allow,omitempty" example:"opus,ulaw,alaw"`
	Webrtc          *string   `json:"webrtc,omitempty" example:"yes"`
	IsRegistered    bool      `json:"is_registered" example:"true"`
	RegistrationURI *string   `json:"registration_uri,omitempty" example:"sip:acme-agent1@192.168.1.100:5060"`
	UserAgent       *string   `json:"user_agent,omitempty" example:"Zoiper 5.4.8"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// CreateEndpointRequest represents endpoint creation data
// @Description Create SIP endpoint
type CreateEndpointRequest struct {
	ID          string  `json:"id" binding:"required" example:"acme-agent1"`
	Username    string  `json:"username" binding:"required" example:"acme-agent1"`
	Password    string  `json:"password" binding:"required,min=8" example:"SecurePass123!"`
	DisplayName *string `json:"display_name,omitempty" example:"John Doe (Agent 1)"`
	Context     *string `json:"context,omitempty" example:"agents"`
	Transport   *string `json:"transport,omitempty" example:"transport-wss"`
	Codecs      *string `json:"codecs,omitempty" example:"opus,ulaw,alaw"`
	Webrtc      bool    `json:"webrtc" example:"true"`
}

// UpdateEndpointRequest represents endpoint update data
// @Description Update SIP endpoint
type UpdateEndpointRequest struct {
	Password    *string `json:"password,omitempty" binding:"omitempty,min=8" example:"NewSecurePass123!"`
	DisplayName *string `json:"display_name,omitempty" example:"John Doe (Agent 1)"`
	Context     *string `json:"context,omitempty" example:"agents"`
	Codecs      *string `json:"codecs,omitempty" example:"opus,ulaw,alaw"`
}

// ===================================
// CALL OPERATIONS
// ===================================

// OriginateCallRequest represents call initiation data
// @Description Originate outbound call
type OriginateCallRequest struct {
	Endpoint  string            `json:"endpoint" binding:"required" example:"PJSIP/acme-agent1"`
	ToNumber  string            `json:"to_number" binding:"required" example:"+15559876543"`
	CallerID  *string           `json:"caller_id,omitempty" example:"+15551234567"`
	Context   *string           `json:"context,omitempty" example:"from-internal"`
	Variables map[string]string `json:"variables,omitempty"`
	Timeout   int               `json:"timeout,omitempty" example:"30"`
}

// OriginateCallResponse represents call initiation result
// @Description Call origination result
type OriginateCallResponse struct {
	ChannelID string `json:"channel_id" example:"1634567890.123"`
	CallID    string `json:"call_id" example:"call-abc123"`
	Status    string `json:"status" example:"initiated"`
}

// HangupCallRequest represents call termination data
// @Description Hangup active call
type HangupCallRequest struct {
	ChannelID string  `json:"channel_id" binding:"required" example:"1634567890.123"`
	Reason    *string `json:"reason,omitempty" example:"normal"`
}

// TransferCallRequest represents call transfer data
// @Description Transfer call to another destination
type TransferCallRequest struct {
	ChannelID       string `json:"channel_id" binding:"required" example:"1634567890.123"`
	TargetExtension string `json:"target_extension" binding:"required" example:"102"`
	Type            string `json:"type" example:"blind"` // blind or attended
}
