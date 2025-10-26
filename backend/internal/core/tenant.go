package core

import (
	"time"

	"github.com/psschand/callcenter/internal/common"
)

// Tenant represents a business/organization in the multi-tenant system
// @Description Tenant information with resource limits and features
type Tenant struct {
	ID                 string                `gorm:"column:id;primaryKey;type:varchar(64)" json:"id" example:"acme-corp"`
	Name               string                `gorm:"column:name;type:varchar(255);not null" json:"name" example:"Acme Corporation"`
	Domain             *string               `gorm:"column:domain;type:varchar(255);uniqueIndex" json:"domain,omitempty" example:"acme.example.com"`
	Status             common.TenantStatus   `gorm:"column:status;type:enum('active','suspended','trial','inactive');default:active;index" json:"status" example:"active"`
	MaxAgents          int                   `gorm:"column:max_agents;default:10" json:"max_agents" example:"50"`
	MaxDIDs            int                   `gorm:"column:max_dids;default:5" json:"max_dids" example:"20"`
	MaxConcurrentCalls int                   `gorm:"column:max_concurrent_calls;default:10" json:"max_concurrent_calls" example:"25"`
	Features           common.TenantFeatures `gorm:"column:features;type:json" json:"features"`
	Settings           common.TenantSettings `gorm:"column:settings;type:json" json:"settings"`
	BillingEmail       *string               `gorm:"column:billing_email;type:varchar(255)" json:"billing_email,omitempty" example:"billing@acme.com"`
	ContactName        *string               `gorm:"column:contact_name;type:varchar(255)" json:"contact_name,omitempty" example:"John Doe"`
	ContactPhone       *string               `gorm:"column:contact_phone;type:varchar(32)" json:"contact_phone,omitempty" example:"+1234567890"`
	TrialExpiresAt     *time.Time            `gorm:"column:trial_expires_at" json:"trial_expires_at,omitempty"`
	CreatedAt          time.Time             `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt          time.Time             `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relations (not stored in DB)
	Users []User        `gorm:"foreignKey:TenantID" json:"users,omitempty"`
	DIDs  []interface{} `gorm:"foreignKey:TenantID" json:"dids,omitempty"` // Circular import - use interface{}
}

// TableName specifies the table name
func (Tenant) TableName() string {
	return "tenants"
}

// IsActive checks if tenant is active
func (t *Tenant) IsActive() bool {
	return t.Status == common.TenantStatusActive
}

// IsTrial checks if tenant is on trial
func (t *Tenant) IsTrial() bool {
	return t.Status == common.TenantStatusTrial && t.TrialExpiresAt != nil && t.TrialExpiresAt.After(time.Now())
}

// HasFeature checks if a specific feature is enabled
func (t *Tenant) HasFeature(feature string) bool {
	switch feature {
	case "webrtc":
		return t.Features.WebRTC
	case "sms":
		return t.Features.SMS
	case "recording":
		return t.Features.Recording
	case "queue":
		return t.Features.Queue
	case "ivr":
		return t.Features.IVR
	case "chat":
		return t.Features.Chat
	case "helpdesk":
		return t.Features.Helpdesk
	case "analytics":
		return t.Features.Analytics
	case "api":
		return t.Features.API
	default:
		return false
	}
}

// CanAddAgent checks if tenant can add more agents
func (t *Tenant) CanAddAgent(currentAgentCount int) bool {
	return currentAgentCount < t.MaxAgents
}

// CanAddDID checks if tenant can add more DIDs
func (t *Tenant) CanAddDID(currentDIDCount int) bool {
	return currentDIDCount < t.MaxDIDs
}
