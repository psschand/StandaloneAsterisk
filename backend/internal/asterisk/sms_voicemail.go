package asterisk

import (
	"time"

	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/core"
)

// SMSMessage represents an SMS message
// @Description SMS message with delivery status
type SMSMessage struct {
	ID                int64               `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID          string              `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	DIDID             *int64              `gorm:"column:did_id;index:idx_did" json:"did_id,omitempty" example:"1"`
	Direction         common.SMSDirection `gorm:"column:direction;type:enum('inbound','outbound');not null;index:idx_direction_status" json:"direction" example:"outbound"`
	Sender            string              `gorm:"column:sender;type:varchar(64);not null;index:idx_sender" json:"sender" example:"+15551234567"`
	Recipient         string              `gorm:"column:recipient;type:varchar(64);not null;index:idx_recipient" json:"recipient" example:"+15559876543"`
	Body              *string             `gorm:"column:body;type:text" json:"body,omitempty" example:"Hello from Acme Corp!"`
	Status            common.SMSStatus    `gorm:"column:status;type:enum('pending','queued','sent','delivered','failed','received');default:pending;index:idx_direction_status" json:"status" example:"delivered"`
	ErrorMessage      *string             `gorm:"column:error_message;type:text" json:"error_message,omitempty"`
	Segments          int                 `gorm:"column:segments;default:1" json:"segments" example:"1"`
	Cost              float64             `gorm:"column:cost;type:decimal(10,4);default:0" json:"cost" example:"0.0075"`
	UserID            *int64              `gorm:"column:user_id;index:idx_user" json:"user_id,omitempty" example:"1"`
	Provider          string              `gorm:"column:provider;type:varchar(64);default:internal" json:"provider" example:"twilio"`
	ProviderMessageID *string             `gorm:"column:provider_message_id;type:varchar(255)" json:"provider_message_id,omitempty" example:"SM1234567890abcdef"`
	Metadata          common.JSONMap      `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt         time.Time           `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`
	UpdatedAt         time.Time           `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	DID    *DID         `gorm:"foreignKey:DIDID" json:"did,omitempty"`
	User   *core.User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (SMSMessage) TableName() string {
	return "sms_messages"
}

// IsDelivered checks if SMS was delivered
func (s *SMSMessage) IsDelivered() bool {
	return s.Status == common.SMSStatusDelivered
}

// IsFailed checks if SMS delivery failed
func (s *SMSMessage) IsFailed() bool {
	return s.Status == common.SMSStatusFailed
}

// Voicemail represents a voicemail message
// @Description Voicemail message with audio file
type Voicemail struct {
	ID            int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID      string         `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	DIDID         *int64         `gorm:"column:did_id;index:idx_did" json:"did_id,omitempty" example:"1"`
	UserID        *int64         `gorm:"column:user_id;index:idx_user" json:"user_id,omitempty" example:"1"`
	EndpointID    *string        `gorm:"column:endpoint_id;type:varchar(128);index:idx_endpoint" json:"endpoint_id,omitempty" example:"acme-agent1"`
	CallerID      string         `gorm:"column:callerid;type:varchar(80);not null;index:idx_caller" json:"callerid" example:"+15551234567"`
	CallerName    *string        `gorm:"column:callername;type:varchar(80)" json:"callername,omitempty" example:"John Doe"`
	Duration      int            `gorm:"column:duration;default:0" json:"duration" example:"45"`
	FilePath      string         `gorm:"column:file_path;type:varchar(1024);not null" json:"file_path" example:"/var/spool/asterisk/voicemail/acme-corp/101/INBOX/msg0001.wav"`
	FileSize      int64          `gorm:"column:file_size;default:0" json:"file_size" example:"180224"`
	Format        string         `gorm:"column:format;type:varchar(16);default:wav" json:"format" example:"wav"`
	IsRead        bool           `gorm:"column:is_read;default:false;index:idx_read" json:"is_read" example:"false"`
	IsDeleted     bool           `gorm:"column:is_deleted;default:false;index:idx_deleted" json:"is_deleted" example:"false"`
	Transcription *string        `gorm:"column:transcription;type:text" json:"transcription,omitempty"`
	Metadata      common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt     time.Time      `gorm:"column:created_at;autoCreateTime;index:idx_created" json:"created_at"`
	ReadAt        *time.Time     `gorm:"column:read_at" json:"read_at,omitempty"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	DID    *DID         `gorm:"foreignKey:DIDID" json:"did,omitempty"`
	User   *core.User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (Voicemail) TableName() string {
	return "voicemails"
}

// MarkAsRead marks the voicemail as read
func (v *Voicemail) MarkAsRead() {
	v.IsRead = true
	now := time.Now()
	v.ReadAt = &now
}

// GetDurationMinutes returns duration in minutes
func (v *Voicemail) GetDurationMinutes() float64 {
	return float64(v.Duration) / 60.0
}

// GetFileSizeMB returns file size in megabytes
func (v *Voicemail) GetFileSizeMB() float64 {
	return float64(v.FileSize) / (1024 * 1024)
}

// PsEndpoint represents an Asterisk PJSIP endpoint (ps_endpoints table)
// This is an ARA (Asterisk Realtime Architecture) table
// @Description PJSIP endpoint configuration (ARA)
type PsEndpoint struct {
	ID              string    `gorm:"column:id;primaryKey;type:varchar(128)" json:"id" example:"acme-agent1"`
	TenantID        string    `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_endpoint" json:"tenant_id" example:"acme-corp"`
	DisplayName     *string   `gorm:"column:display_name;type:varchar(255)" json:"display_name,omitempty" example:"John Doe (Agent 1)"`
	Transport       *string   `gorm:"column:transport;type:varchar(128)" json:"transport,omitempty" example:"transport-wss"`
	Aors            *string   `gorm:"column:aors;type:varchar(256)" json:"aors,omitempty" example:"acme-agent1"`
	Auth            *string   `gorm:"column:auth;type:varchar(128)" json:"auth,omitempty" example:"acme-agent1-auth"`
	Context         *string   `gorm:"column:context;type:varchar(128)" json:"context,omitempty" example:"agents"`
	Disallow        *string   `gorm:"column:disallow;type:varchar(256)" json:"disallow,omitempty" example:"all"`
	Allow           *string   `gorm:"column:allow;type:varchar(256)" json:"allow,omitempty" example:"opus,ulaw,alaw"`
	DirectMedia     *string   `gorm:"column:direct_media;type:varchar(10)" json:"direct_media,omitempty" example:"no"`
	DtmfMode        *string   `gorm:"column:dtmf_mode;type:varchar(20)" json:"dtmf_mode,omitempty" example:"rfc4733"`
	ForceRport      *string   `gorm:"column:force_rport;type:varchar(10)" json:"force_rport,omitempty" example:"yes"`
	IceSupport      *string   `gorm:"column:ice_support;type:varchar(10)" json:"ice_support,omitempty" example:"yes"`
	RtpSymmetric    *string   `gorm:"column:rtp_symmetric;type:varchar(10)" json:"rtp_symmetric,omitempty" example:"yes"`
	RewriteContact  *string   `gorm:"column:rewrite_contact;type:varchar(10)" json:"rewrite_contact,omitempty" example:"yes"`
	Callerid        *string   `gorm:"column:callerid;type:varchar(128)" json:"callerid,omitempty" example:"Agent 1 <101>"`
	MediaEncryption *string   `gorm:"column:media_encryption;type:varchar(20)" json:"media_encryption,omitempty" example:"dtls"`
	Webrtc          *string   `gorm:"column:webrtc;type:varchar(10)" json:"webrtc,omitempty" example:"yes"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (PsEndpoint) TableName() string {
	return "ps_endpoints"
}

// PsAuth represents an Asterisk PJSIP auth (ps_auths table)
// This is an ARA table
// @Description PJSIP authentication configuration (ARA)
type PsAuth struct {
	ID            string    `gorm:"column:id;primaryKey;type:varchar(128)" json:"id" example:"acme-agent1-auth"`
	TenantID      string    `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_auth" json:"tenant_id" example:"acme-corp"`
	AuthType      *string   `gorm:"column:auth_type;type:varchar(20)" json:"auth_type,omitempty" example:"userpass"`
	Username      *string   `gorm:"column:username;type:varchar(128)" json:"username,omitempty" example:"acme-agent1"`
	Password      *string   `gorm:"column:password;type:varchar(256)" json:"-"`
	Realm         *string   `gorm:"column:realm;type:varchar(128)" json:"realm,omitempty" example:"asterisk"`
	NonceLifetime *int      `gorm:"column:nonce_lifetime" json:"nonce_lifetime,omitempty" example:"32"`
	Md5Cred       *string   `gorm:"column:md5_cred;type:varchar(256)" json:"md5_cred,omitempty"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (PsAuth) TableName() string {
	return "ps_auths"
}

// PsAor represents an Asterisk PJSIP AOR (ps_aors table)
// This is an ARA table
// @Description PJSIP Address of Record configuration (ARA)
type PsAor struct {
	ID                  string    `gorm:"column:id;primaryKey;type:varchar(128)" json:"id" example:"acme-agent1"`
	TenantID            string    `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_aor" json:"tenant_id" example:"acme-corp"`
	Contact             *string   `gorm:"column:contact;type:varchar(256)" json:"contact,omitempty"`
	DefaultExpiration   *int      `gorm:"column:default_expiration" json:"default_expiration,omitempty" example:"3600"`
	MaxContacts         *int      `gorm:"column:max_contacts" json:"max_contacts,omitempty" example:"2"`
	MinimumExpiration   *int      `gorm:"column:minimum_expiration" json:"minimum_expiration,omitempty" example:"60"`
	MaximumExpiration   *int      `gorm:"column:maximum_expiration" json:"maximum_expiration,omitempty" example:"7200"`
	QualifyFrequency    *int      `gorm:"column:qualify_frequency" json:"qualify_frequency,omitempty" example:"60"`
	AuthenticateQualify *string   `gorm:"column:authenticate_qualify;type:varchar(10)" json:"authenticate_qualify,omitempty" example:"no"`
	RemoveExisting      *string   `gorm:"column:remove_existing;type:varchar(10)" json:"remove_existing,omitempty" example:"yes"`
	Mailboxes           *string   `gorm:"column:mailboxes;type:varchar(256)" json:"mailboxes,omitempty"`
	OutboundProxy       *string   `gorm:"column:outbound_proxy;type:varchar(256)" json:"outbound_proxy,omitempty"`
	SupportPath         *string   `gorm:"column:support_path;type:varchar(10)" json:"support_path,omitempty" example:"yes"`
	CreatedAt           time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (PsAor) TableName() string {
	return "ps_aors"
}

// PsContact represents a registered contact (ps_contacts table)
// This is an ARA table populated by Asterisk
// @Description PJSIP contact registration (ARA - managed by Asterisk)
type PsContact struct {
	ID               string  `gorm:"column:id;primaryKey;type:varchar(255)" json:"id" example:"acme-agent1;@bc123"`
	TenantID         string  `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_endpoint" json:"tenant_id" example:"acme-corp"`
	Endpoint         *string `gorm:"column:endpoint;type:varchar(128);index:idx_tenant_endpoint" json:"endpoint,omitempty" example:"acme-agent1"`
	URI              *string `gorm:"column:uri;type:varchar(511)" json:"uri,omitempty" example:"sip:acme-agent1@192.168.1.100:5060"`
	ExpirationTime   *int64  `gorm:"column:expiration_time" json:"expiration_time,omitempty" example:"1634571490"`
	QualifyFrequency *int    `gorm:"column:qualify_frequency" json:"qualify_frequency,omitempty" example:"60"`
	OutboundProxy    *string `gorm:"column:outbound_proxy;type:varchar(256)" json:"outbound_proxy,omitempty"`
	Path             *string `gorm:"column:path;type:text" json:"path,omitempty"`
	UserAgent        *string `gorm:"column:user_agent;type:varchar(255)" json:"user_agent,omitempty" example:"Zoiper 5.4.8"`
	RegServer        *string `gorm:"column:reg_server;type:varchar(255)" json:"reg_server,omitempty"`

	// Relations
	Tenant *core.Tenant `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (PsContact) TableName() string {
	return "ps_contacts"
}

// IsExpired checks if the contact registration is expired
func (pc *PsContact) IsExpired() bool {
	if pc.ExpirationTime == nil {
		return true
	}
	return time.Now().Unix() > *pc.ExpirationTime
}
