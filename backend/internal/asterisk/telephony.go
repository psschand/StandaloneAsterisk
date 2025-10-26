package asterisk

import (
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
)

// DID represents a phone number (Direct Inward Dialing) assigned to a tenant
// @Description Phone number with routing configuration
type DID struct {
	ID            int64            `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID      string           `gorm:"column:tenant_id;type:varchar(64);not null;index" json:"tenant_id" example:"acme-corp"`
	Number        string           `gorm:"column:number;type:varchar(32);not null;uniqueIndex" json:"number" example:"+15551234567"`
	CountryCode   *string          `gorm:"column:country_code;type:varchar(8)" json:"country_code,omitempty" example:"+1"`
	FriendlyName  *string          `gorm:"column:friendly_name;type:varchar(255)" json:"friendly_name,omitempty" example:"Main Sales Line"`
	RouteType     common.RouteType `gorm:"column:route_type;type:enum('queue','endpoint','ivr','webhook','external','voicemail');not null;default:queue;index" json:"route_type" example:"queue"`
	RouteTarget   string           `gorm:"column:route_target;type:varchar(255);not null" json:"route_target" example:"sales"`
	SMSEnabled    bool             `gorm:"column:sms_enabled;default:false" json:"sms_enabled" example:"true"`
	SMSWebhookURL *string          `gorm:"column:sms_webhook_url;type:varchar(512)" json:"sms_webhook_url,omitempty"`
	Status        common.DIDStatus `gorm:"column:status;type:enum('active','inactive','pending');default:active;index" json:"status" example:"active"`
	Metadata      common.JSONMap   `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt     time.Time        `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time        `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (DID) TableName() string {
	return "dids"
}

// IsActive checks if DID is active
func (d *DID) IsActive() bool {
	return d.Status == common.DIDStatusActive
}

// Queue represents a call queue configuration
// @Description Call queue with strategy and timeout settings
type Queue struct {
	ID                int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID          string         `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_queue" json:"tenant_id" example:"acme-corp"`
	Name              string         `gorm:"column:name;type:varchar(128);not null;index:idx_tenant_queue" json:"name" example:"sales"`
	DisplayName       string         `gorm:"column:display_name;type:varchar(255);not null" json:"display_name" example:"Sales Queue"`
	Strategy          string         `gorm:"column:strategy;type:enum('ringall','leastrecent','fewestcalls','random','rrmemory','rrordered','linear','wrandom');default:ringall" json:"strategy" example:"leastrecent"`
	Timeout           int            `gorm:"column:timeout;default:30" json:"timeout" example:"30"`
	Retry             int            `gorm:"column:retry;default:5" json:"retry" example:"5"`
	MaxWaitTime       int            `gorm:"column:max_wait_time;default:300" json:"max_wait_time" example:"300"`
	MaxLen            int            `gorm:"column:max_len;default:0" json:"max_len" example:"0"`
	AnnounceFrequency int            `gorm:"column:announce_frequency;default:60" json:"announce_frequency" example:"60"`
	AnnounceHoldTime  bool           `gorm:"column:announce_hold_time;default:true" json:"announce_hold_time" example:"true"`
	MusicOnHold       string         `gorm:"column:music_on_hold;type:varchar(128);default:default" json:"music_on_hold" example:"default"`
	Status            string         `gorm:"column:status;type:enum('active','inactive');default:active;index" json:"status" example:"active"`
	Metadata          common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt         time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant  *core.Tenant  `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Members []QueueMember `gorm:"foreignKey:QueueName;references:Name" json:"members,omitempty"`
}

// TableName specifies the table name
func (Queue) TableName() string {
	return "queues"
}

// IsActive checks if queue is active
func (q *Queue) IsActive() bool {
	return q.Status == "active"
}

// QueueMember represents a member (agent) in a queue
// @Description Queue member assignment with penalty and state
type QueueMember struct {
	UniqueID       int64   `gorm:"column:uniqueid;primaryKey;autoIncrement" json:"uniqueid" example:"1"`
	TenantID       string  `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_queue" json:"tenant_id" example:"acme-corp"`
	QueueName      string  `gorm:"column:queue_name;type:varchar(128);not null;index:idx_tenant_queue" json:"queue_name" example:"sales"`
	Interface      string  `gorm:"column:interface;type:varchar(128);not null" json:"interface" example:"PJSIP/acme-agent1"`
	MemberName     *string `gorm:"column:membername;type:varchar(128)" json:"membername,omitempty" example:"John Doe"`
	StateInterface *string `gorm:"column:state_interface;type:varchar(128)" json:"state_interface,omitempty" example:"PJSIP/acme-agent1"`
	Penalty        int     `gorm:"column:penalty;default:0" json:"penalty" example:"0"`
	Paused         int     `gorm:"column:paused;default:0" json:"paused" example:"0"`
	WrapupTime     int     `gorm:"column:wrapuptime;default:0" json:"wrapuptime" example:"0"`

	// Relations
	Queue *Queue `gorm:"foreignKey:QueueName;references:Name" json:"queue,omitempty"`
}

// TableName specifies the table name
func (QueueMember) TableName() string {
	return "queue_members"
}

// IsPaused checks if member is paused
func (qm *QueueMember) IsPaused() bool {
	return qm.Paused == 1
}

// CDR represents Call Detail Record
// @Description Call detail record for billing and analytics
type CDR struct {
	ID            int64                  `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID      string                 `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_calldate" json:"tenant_id" example:"acme-corp"`
	CallDate      time.Time              `gorm:"column:calldate;not null;index:idx_calldate" json:"calldate"`
	CLID          string                 `gorm:"column:clid;type:varchar(80);not null" json:"clid" example:"\"John Doe\" <+15551234567>"`
	Src           string                 `gorm:"column:src;type:varchar(80);not null;index:idx_src" json:"src" example:"+15551234567"`
	Dst           string                 `gorm:"column:dst;type:varchar(80);not null;index:idx_dst" json:"dst" example:"+15559876543"`
	DContext      string                 `gorm:"column:dcontext;type:varchar(80);not null" json:"dcontext" example:"from-trunk"`
	Channel       string                 `gorm:"column:channel;type:varchar(80);not null" json:"channel" example:"PJSIP/twilio-trunk-00000001"`
	DstChannel    string                 `gorm:"column:dstchannel;type:varchar(80);not null" json:"dstchannel" example:"PJSIP/acme-agent1-00000002"`
	LastApp       string                 `gorm:"column:lastapp;type:varchar(80);not null" json:"lastapp" example:"Dial"`
	LastData      string                 `gorm:"column:lastdata;type:varchar(80);not null" json:"lastdata" example:"PJSIP/acme-agent1,30"`
	Duration      int                    `gorm:"column:duration;not null;default:0" json:"duration" example:"125"`
	BillSec       int                    `gorm:"column:billsec;not null;default:0" json:"billsec" example:"120"`
	Disposition   common.CallDisposition `gorm:"column:disposition;type:varchar(45);not null;index:idx_disposition" json:"disposition" example:"ANSWERED"`
	AMAFlags      int                    `gorm:"column:amaflags;not null;default:0" json:"amaflags" example:"3"`
	AccountCode   string                 `gorm:"column:accountcode;type:varchar(20);not null;index:idx_accountcode" json:"accountcode" example:"acme-corp"`
	UniqueID      string                 `gorm:"column:uniqueid;type:varchar(150);not null;index:idx_uniqueid" json:"uniqueid" example:"1634567890.123"`
	UserField     string                 `gorm:"column:userfield;type:varchar(255);not null" json:"userfield,omitempty"`
	RecordingFile *string                `gorm:"column:recordingfile;type:varchar(512)" json:"recordingfile,omitempty"`
	DIDID         *int64                 `gorm:"column:did_id" json:"did_id,omitempty" example:"1"`
	UserID        *int64                 `gorm:"column:user_id;index:idx_user" json:"user_id,omitempty" example:"1"`
	QueueName     *string                `gorm:"column:queue_name;type:varchar(128);index:idx_queue" json:"queue_name,omitempty" example:"sales"`
	QueueWaitTime int                    `gorm:"column:queue_wait_time;default:0" json:"queue_wait_time" example:"15"`
	Metadata      common.JSONMap         `gorm:"column:metadata;type:json" json:"metadata,omitempty"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	DID    *DID         `gorm:"foreignKey:DIDID" json:"did,omitempty"`
	User   *core.User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Queue  *Queue       `gorm:"foreignKey:QueueName;references:Name" json:"queue,omitempty"`
}

// TableName specifies the table name
func (CDR) TableName() string {
	return "cdr"
}

// IsAnswered checks if the call was answered
func (c *CDR) IsAnswered() bool {
	return c.Disposition == common.CallDispositionAnswered
}

// GetDurationMinutes returns duration in minutes
func (c *CDR) GetDurationMinutes() float64 {
	return float64(c.Duration) / 60.0
}

// CallRecording represents a stored call recording
// @Description Call recording file information
type CallRecording struct {
	ID        int64                  `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID  string                 `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	CDRID     *int64                 `gorm:"column:cdr_id;index:idx_cdr" json:"cdr_id,omitempty" example:"1"`
	UniqueID  string                 `gorm:"column:uniqueid;type:varchar(150);not null;index:idx_uniqueid" json:"uniqueid" example:"1634567890.123"`
	Filename  string                 `gorm:"column:filename;type:varchar(512);not null" json:"filename" example:"acme-corp-1634567890-123.wav"`
	FilePath  string                 `gorm:"column:file_path;type:varchar(1024);not null" json:"file_path" example:"/var/spool/asterisk/monitor/2023/10/25/acme-corp-1634567890-123.wav"`
	FileSize  int64                  `gorm:"column:file_size;default:0" json:"file_size" example:"524288"`
	Duration  int                    `gorm:"column:duration;default:0" json:"duration" example:"120"`
	Format    string                 `gorm:"column:format;type:varchar(16);default:wav" json:"format" example:"wav"`
	Status    common.RecordingStatus `gorm:"column:status;type:enum('recording','completed','failed','deleted');default:recording" json:"status" example:"completed"`
	CreatedAt time.Time              `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	CDR    *CDR         `gorm:"foreignKey:CDRID" json:"cdr,omitempty"`
}

// TableName specifies the table name
func (CallRecording) TableName() string {
	return "call_recordings"
}

// IsCompleted checks if recording is completed
func (cr *CallRecording) IsCompleted() bool {
	return cr.Status == common.RecordingStatusCompleted
}

// GetFileSizeMB returns file size in megabytes
func (cr *CallRecording) GetFileSizeMB() float64 {
	return float64(cr.FileSize) / (1024 * 1024)
}

// AgentState represents the current state of an agent
// @Description Agent presence and availability status
type AgentState struct {
	ID            int64              `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID      string             `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	UserID        int64              `gorm:"column:user_id;not null;uniqueIndex:unique_tenant_user" json:"user_id" example:"1"`
	EndpointID    string             `gorm:"column:endpoint_id;type:varchar(128);not null;index:idx_endpoint" json:"endpoint_id" example:"acme-agent1"`
	State         common.AgentStatus `gorm:"column:state;type:enum('available','busy','away','break','offline','dnd');default:offline;index:idx_state" json:"state" example:"available"`
	Reason        *string            `gorm:"column:reason;type:varchar(255)" json:"reason,omitempty" example:"Lunch break"`
	CurrentCallID *string            `gorm:"column:current_call_id;type:varchar(150)" json:"current_call_id,omitempty" example:"1634567890.123"`
	ChangedAt     time.Time          `gorm:"column:changed_at;autoUpdateTime" json:"changed_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User   *core.User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (AgentState) TableName() string {
	return "agent_states"
}

// IsAvailable checks if agent is available to receive calls
func (as *AgentState) IsAvailable() bool {
	return as.State == common.AgentStatusAvailable
}

// IsOnCall checks if agent is on a call
func (as *AgentState) IsOnCall() bool {
	return as.State == common.AgentStatusBusy && as.CurrentCallID != nil
}

// WebSocketSession represents a real-time WebSocket connection
// @Description WebSocket session for real-time agent communication
type WebSocketSession struct {
	ID            string    `gorm:"column:id;primaryKey;type:varchar(64)" json:"id" example:"ws-123456"`
	TenantID      string    `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	UserID        int64     `gorm:"column:user_id;not null;index:idx_user" json:"user_id" example:"1"`
	EndpointID    *string   `gorm:"column:endpoint_id;type:varchar(128)" json:"endpoint_id,omitempty" example:"acme-agent1"`
	ConnectionID  string    `gorm:"column:connection_id;type:varchar(255);not null" json:"connection_id" example:"conn-abc123"`
	IPAddress     *string   `gorm:"column:ip_address;type:varchar(45)" json:"ip_address,omitempty" example:"192.168.1.100"`
	UserAgent     *string   `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	ConnectedAt   time.Time `gorm:"column:connected_at;autoCreateTime" json:"connected_at"`
	LastHeartbeat time.Time `gorm:"column:last_heartbeat;autoUpdateTime;index:idx_last_heartbeat" json:"last_heartbeat"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User   *core.User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (WebSocketSession) TableName() string {
	return "websocket_sessions"
}

// IsActive checks if session is still active (heartbeat within last 30 seconds)
func (ws *WebSocketSession) IsActive() bool {
	return time.Since(ws.LastHeartbeat) < 30*time.Second
}
