package core
package core

import (
	"time"
	"github.com/yourusername/callcenter/backend-models/common"
)

// User represents a user account in the system
// @Description User account with authentication and profile information
type User struct {
	ID            int64              `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	Email         string             `gorm:"column:email;type:varchar(255);not null;uniqueIndex" json:"email" example:"john.doe@example.com"`
	PasswordHash  string             `gorm:"column:password_hash;type:varchar(255);not null" json:"-"`
	FirstName     *string            `gorm:"column:first_name;type:varchar(100)" json:"first_name,omitempty" example:"John"`
	LastName      *string            `gorm:"column:last_name;type:varchar(100)" json:"last_name,omitempty" example:"Doe"`
	Phone         *string            `gorm:"column:phone;type:varchar(32)" json:"phone,omitempty" example:"+1234567890"`
	Status        common.UserStatus  `gorm:"column:status;type:enum('active','inactive','suspended');default:active;index" json:"status" example:"active"`
	EmailVerified bool               `gorm:"column:email_verified;default:false" json:"email_verified" example:"true"`
	LastLoginAt   *time.Time         `gorm:"column:last_login_at" json:"last_login_at,omitempty"`
	Avatar        *string            `gorm:"column:avatar;type:varchar(512)" json:"avatar,omitempty"`
	Timezone      *string            `gorm:"column:timezone;type:varchar(64)" json:"timezone,omitempty" example:"America/New_York"`
	Language      *string            `gorm:"column:language;type:varchar(10)" json:"language,omitempty" example:"en"`
	Metadata      common.JSONMap     `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt     time.Time          `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time          `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	
	// Relations (not stored in DB)
	Roles         []UserRole         `gorm:"foreignKey:UserID" json:"roles,omitempty"`
}

// TableName specifies the table name
func (User) TableName() string {
	return "users"
}

// IsActive checks if user is active
func (u *User) IsActive() bool {
	return u.Status == common.UserStatusActive
}

// GetFullName returns the full name of the user
func (u *User) GetFullName() string {
	if u.FirstName != nil && u.LastName != nil {
		return *u.FirstName + " " + *u.LastName
	}
	if u.FirstName != nil {
		return *u.FirstName
	}
	if u.LastName != nil {
		return *u.LastName
	}
	return u.Email
}

// UserRole represents a user's role within a specific tenant
// @Description User role assignment with tenant-specific permissions
type UserRole struct {
	ID          int64               `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	UserID      int64               `gorm:"column:user_id;not null;index:idx_user_tenant" json:"user_id" example:"1"`
	TenantID    string              `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_user_tenant;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	Role        common.UserRole     `gorm:"column:role;type:enum('superadmin','tenant_admin','supervisor','agent','viewer');not null;index" json:"role" example:"agent"`
	EndpointID  *string             `gorm:"column:endpoint_id;type:varchar(128);index" json:"endpoint_id,omitempty" example:"acme-agent1"`
	Permissions common.Permissions  `gorm:"column:permissions;type:json" json:"permissions"`
	CreatedAt   time.Time           `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time           `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	
	// Relations
	User        *User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Tenant      *Tenant             `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (UserRole) TableName() string {
	return "user_roles"
}

// IsAgent checks if this role is an agent
func (ur *UserRole) IsAgent() bool {
	return ur.Role == common.RoleAgent
}

// IsSupervisor checks if this role is a supervisor
func (ur *UserRole) IsSupervisor() bool {
	return ur.Role == common.RoleSupervisor
}

// IsAdmin checks if this role has admin privileges
func (ur *UserRole) IsAdmin() bool {
	return ur.Role == common.RoleTenantAdmin || ur.Role == common.RoleSuperAdmin
}

// CanManageAgents checks if this role can manage agents
func (ur *UserRole) CanManageAgents() bool {
	return ur.Permissions.CanManageAgents
}

// Contact represents a contact entry for agents
// @Description Contact information stored per tenant
type Contact struct {
	ID          int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID    string         `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	UserID      int64          `gorm:"column:user_id;not null;index:idx_user" json:"user_id" example:"1"`
	FirstName   string         `gorm:"column:first_name;type:varchar(100);not null" json:"first_name" example:"Jane"`
	LastName    string         `gorm:"column:last_name;type:varchar(100);not null" json:"last_name" example:"Smith"`
	Email       *string        `gorm:"column:email;type:varchar(255)" json:"email,omitempty" example:"jane.smith@example.com"`
	Phone       *string        `gorm:"column:phone;type:varchar(32)" json:"phone,omitempty" example:"+1234567890"`
	Company     *string        `gorm:"column:company;type:varchar(255)" json:"company,omitempty" example:"Example Corp"`
	JobTitle    *string        `gorm:"column:job_title;type:varchar(100)" json:"job_title,omitempty" example:"Manager"`
	Notes       *string        `gorm:"column:notes;type:text" json:"notes,omitempty"`
	Tags        []string       `gorm:"-" json:"tags,omitempty"` // Handled via ContactTag table
	Metadata    common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	
	// Relations
	Tenant      *Tenant        `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User        *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ContactTags []ContactTag   `gorm:"foreignKey:ContactID" json:"contact_tags,omitempty"`
}

// TableName specifies the table name
func (Contact) TableName() string {
	return "contacts"
}

// GetFullName returns the full name
func (c *Contact) GetFullName() string {
	return c.FirstName + " " + c.LastName
}

// Tag represents a tag for categorizing contacts
// @Description Tag for organizing contacts
type Tag struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID  string    `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant_name" json:"tenant_id" example:"acme-corp"`
	Name      string    `gorm:"column:name;type:varchar(100);not null;index:idx_tenant_name" json:"name" example:"VIP"`
	Color     *string   `gorm:"column:color;type:varchar(7)" json:"color,omitempty" example:"#FF5733"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	
	// Relations
	Tenant    *Tenant   `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name
func (Tag) TableName() string {
	return "tags"
}

// ContactTag represents the many-to-many relationship between contacts and tags
type ContactTag struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	ContactID int64     `gorm:"column:contact_id;not null;index:idx_contact" json:"contact_id"`
	TagID     int64     `gorm:"column:tag_id;not null;index:idx_tag" json:"tag_id"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	
	// Relations
	Contact   *Contact  `gorm:"foreignKey:ContactID" json:"contact,omitempty"`
	Tag       *Tag      `gorm:"foreignKey:TagID" json:"tag,omitempty"`
}

// TableName specifies the table name
func (ContactTag) TableName() string {
	return "contact_tags"
}

// AuditLog represents an audit trail entry for tracking changes
// @Description Audit log for tracking user actions
type AuditLog struct {
	ID          int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id" example:"1"`
	TenantID    string         `gorm:"column:tenant_id;type:varchar(64);not null;index:idx_tenant" json:"tenant_id" example:"acme-corp"`
	UserID      *int64         `gorm:"column:user_id;index:idx_user" json:"user_id,omitempty" example:"1"`
	Action      string         `gorm:"column:action;type:varchar(100);not null;index" json:"action" example:"create_user"`
	EntityType  string         `gorm:"column:entity_type;type:varchar(100);not null;index" json:"entity_type" example:"user"`
	EntityID    string         `gorm:"column:entity_id;type:varchar(100);not null;index" json:"entity_id" example:"123"`
	IPAddress   *string        `gorm:"column:ip_address;type:varchar(45)" json:"ip_address,omitempty" example:"192.168.1.1"`
	UserAgent   *string        `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	Changes     common.JSONMap `gorm:"column:changes;type:json" json:"changes,omitempty"`
	CreatedAt   time.Time      `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	
	// Relations
	Tenant      *Tenant        `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	User        *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (AuditLog) TableName() string {
	return "audit_logs"
}
