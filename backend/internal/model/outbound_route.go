package model

import "time"

// OutboundRoute represents a dial plan routing rule for outbound calls
type OutboundRoute struct {
ID             int64      `gorm:"primaryKey;autoIncrement" json:"id"`
TenantID       string     `gorm:"type:varchar(100);not null;index" json:"tenant_id"`
Name           string     `gorm:"type:varchar(100);not null" json:"name"`
Description    *string    `gorm:"type:varchar(255)" json:"description"`
Pattern        string     `gorm:"type:varchar(100);not null" json:"pattern"`
TrunkID        string     `gorm:"type:varchar(100);not null" json:"trunk_id"`
Priority       int        `gorm:"not null;default:100;index" json:"priority"`
Enabled        bool       `gorm:"not null;default:true;index" json:"enabled"`
Prepend        *string    `gorm:"type:varchar(20)" json:"prepend"`
Strip          int        `gorm:"default:0" json:"strip"`
CallerIDName   *string    `gorm:"type:varchar(100)" json:"caller_id_name"`
CallerIDNumber *string    `gorm:"type:varchar(50)" json:"caller_id_number"`
CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name for GORM
func (OutboundRoute) TableName() string {
return "outbound_routes"
}
