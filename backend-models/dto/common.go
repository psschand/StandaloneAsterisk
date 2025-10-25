package dto
package dto

import (
	"time"
	"github.com/yourusername/callcenter/backend-models/common"
)

// ===================================
// AUTHENTICATION & USER MANAGEMENT
// ===================================

// LoginRequest represents login credentials
// @Description Login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"john.doe@example.com"`
	Password string `json:"password" binding:"required,min=8" example:"password123"`
	TenantID string `json:"tenant_id,omitempty" example:"acme-corp"`
}

// LoginResponse represents successful login response
// @Description Login response with JWT token
type LoginResponse struct {
	Token        string          `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string          `json:"refresh_token" example:"refresh_token_here"`
	User         UserResponse    `json:"user"`
	Tenant       *TenantResponse `json:"tenant,omitempty"`
	ExpiresIn    int64           `json:"expires_in" example:"3600"`
}

// RegisterRequest represents user registration data
// @Description User registration payload
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email" example:"john.doe@example.com"`
	Password  string `json:"password" binding:"required,min=8" example:"password123"`
	FirstName string `json:"first_name" binding:"required" example:"John"`
	LastName  string `json:"last_name" binding:"required" example:"Doe"`
	Phone     string `json:"phone,omitempty" example:"+1234567890"`
	TenantID  string `json:"tenant_id,omitempty" example:"acme-corp"`
}

// UserResponse represents user data in API responses
// @Description User information
type UserResponse struct {
	ID            int64              `json:"id" example:"1"`
	Email         string             `json:"email" example:"john.doe@example.com"`
	FirstName     *string            `json:"first_name,omitempty" example:"John"`
	LastName      *string            `json:"last_name,omitempty" example:"Doe"`
	Phone         *string            `json:"phone,omitempty" example:"+1234567890"`
	Status        common.UserStatus  `json:"status" example:"active"`
	EmailVerified bool               `json:"email_verified" example:"true"`
	Avatar        *string            `json:"avatar,omitempty"`
	Timezone      *string            `json:"timezone,omitempty" example:"America/New_York"`
	Language      *string            `json:"language,omitempty" example:"en"`
	Roles         []UserRoleResponse `json:"roles,omitempty"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
}

// UserRoleResponse represents user role data
// @Description User role with permissions
type UserRoleResponse struct {
	ID          int64               `json:"id" example:"1"`
	TenantID    string              `json:"tenant_id" example:"acme-corp"`
	Role        common.UserRole     `json:"role" example:"agent"`
	EndpointID  *string             `json:"endpoint_id,omitempty" example:"acme-agent1"`
	Permissions common.Permissions  `json:"permissions"`
}

// UpdateUserRequest represents user update data
// @Description Update user information
type UpdateUserRequest struct {
	FirstName *string `json:"first_name,omitempty" example:"John"`
	LastName  *string `json:"last_name,omitempty" example:"Doe"`
	Phone     *string `json:"phone,omitempty" example:"+1234567890"`
	Avatar    *string `json:"avatar,omitempty"`
	Timezone  *string `json:"timezone,omitempty" example:"America/New_York"`
	Language  *string `json:"language,omitempty" example:"en"`
}

// ChangePasswordRequest represents password change data
// @Description Change password payload
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required" example:"oldpass123"`
	NewPassword string `json:"new_password" binding:"required,min=8" example:"newpass123"`
}

// ===================================
// TENANT MANAGEMENT
// ===================================

// TenantResponse represents tenant data
// @Description Tenant information
type TenantResponse struct {
	ID                 string                `json:"id" example:"acme-corp"`
	Name               string                `json:"name" example:"Acme Corporation"`
	Domain             *string               `json:"domain,omitempty" example:"acme.example.com"`
	Status             common.TenantStatus   `json:"status" example:"active"`
	MaxAgents          int                   `json:"max_agents" example:"50"`
	MaxDIDs            int                   `json:"max_dids" example:"20"`
	MaxConcurrentCalls int                   `json:"max_concurrent_calls" example:"25"`
	Features           common.TenantFeatures `json:"features"`
	Settings           common.TenantSettings `json:"settings"`
	CreatedAt          time.Time             `json:"created_at"`
	UpdatedAt          time.Time             `json:"updated_at"`
}

// CreateTenantRequest represents tenant creation data
// @Description Create new tenant
type CreateTenantRequest struct {
	ID                 string                `json:"id" binding:"required" example:"acme-corp"`
	Name               string                `json:"name" binding:"required" example:"Acme Corporation"`
	Domain             *string               `json:"domain,omitempty" example:"acme.example.com"`
	MaxAgents          int                   `json:"max_agents" example:"50"`
	MaxDIDs            int                   `json:"max_dids" example:"20"`
	MaxConcurrentCalls int                   `json:"max_concurrent_calls" example:"25"`
	Features           common.TenantFeatures `json:"features"`
	Settings           common.TenantSettings `json:"settings"`
	BillingEmail       *string               `json:"billing_email,omitempty" example:"billing@acme.com"`
	ContactName        *string               `json:"contact_name,omitempty" example:"John Doe"`
	ContactPhone       *string               `json:"contact_phone,omitempty" example:"+1234567890"`
}

// UpdateTenantRequest represents tenant update data
// @Description Update tenant information
type UpdateTenantRequest struct {
	Name               *string                `json:"name,omitempty" example:"Acme Corporation"`
	Domain             *string                `json:"domain,omitempty" example:"acme.example.com"`
	Status             *common.TenantStatus   `json:"status,omitempty" example:"active"`
	MaxAgents          *int                   `json:"max_agents,omitempty" example:"50"`
	MaxDIDs            *int                   `json:"max_dids,omitempty" example:"20"`
	MaxConcurrentCalls *int                   `json:"max_concurrent_calls,omitempty" example:"25"`
	Features           *common.TenantFeatures `json:"features,omitempty"`
	Settings           *common.TenantSettings `json:"settings,omitempty"`
	BillingEmail       *string                `json:"billing_email,omitempty" example:"billing@acme.com"`
	ContactName        *string                `json:"contact_name,omitempty" example:"John Doe"`
	ContactPhone       *string                `json:"contact_phone,omitempty" example:"+1234567890"`
}

// ===================================
// CONTACT MANAGEMENT
// ===================================

// ContactResponse represents contact data
// @Description Contact information
type ContactResponse struct {
	ID        int64          `json:"id" example:"1"`
	TenantID  string         `json:"tenant_id" example:"acme-corp"`
	UserID    int64          `json:"user_id" example:"1"`
	FirstName string         `json:"first_name" example:"Jane"`
	LastName  string         `json:"last_name" example:"Smith"`
	Email     *string        `json:"email,omitempty" example:"jane.smith@example.com"`
	Phone     *string        `json:"phone,omitempty" example:"+1234567890"`
	Company   *string        `json:"company,omitempty" example:"Example Corp"`
	JobTitle  *string        `json:"job_title,omitempty" example:"Manager"`
	Notes     *string        `json:"notes,omitempty"`
	Tags      []string       `json:"tags,omitempty"`
	Metadata  common.JSONMap `json:"metadata,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// CreateContactRequest represents contact creation data
// @Description Create new contact
type CreateContactRequest struct {
	FirstName string         `json:"first_name" binding:"required" example:"Jane"`
	LastName  string         `json:"last_name" binding:"required" example:"Smith"`
	Email     *string        `json:"email,omitempty" binding:"omitempty,email" example:"jane.smith@example.com"`
	Phone     *string        `json:"phone,omitempty" example:"+1234567890"`
	Company   *string        `json:"company,omitempty" example:"Example Corp"`
	JobTitle  *string        `json:"job_title,omitempty" example:"Manager"`
	Notes     *string        `json:"notes,omitempty"`
	Tags      []string       `json:"tags,omitempty"`
	Metadata  common.JSONMap `json:"metadata,omitempty"`
}

// UpdateContactRequest represents contact update data
// @Description Update contact information
type UpdateContactRequest struct {
	FirstName *string        `json:"first_name,omitempty" example:"Jane"`
	LastName  *string        `json:"last_name,omitempty" example:"Smith"`
	Email     *string        `json:"email,omitempty" binding:"omitempty,email" example:"jane.smith@example.com"`
	Phone     *string        `json:"phone,omitempty" example:"+1234567890"`
	Company   *string        `json:"company,omitempty" example:"Example Corp"`
	JobTitle  *string        `json:"job_title,omitempty" example:"Manager"`
	Notes     *string        `json:"notes,omitempty"`
	Tags      []string       `json:"tags,omitempty"`
	Metadata  common.JSONMap `json:"metadata,omitempty"`
}

// ImportContactsRequest represents bulk contact import data
// @Description Import contacts in bulk
type ImportContactsRequest struct {
	Contacts []CreateContactRequest `json:"contacts" binding:"required,dive"`
	Format   string                 `json:"format" example:"json"` // json, csv
}

// ImportContactsResponse represents import result
// @Description Bulk import result
type ImportContactsResponse struct {
	TotalImported int      `json:"total_imported" example:"45"`
	TotalFailed   int      `json:"total_failed" example:"5"`
	Errors        []string `json:"errors,omitempty"`
}

// ===================================
// PAGINATION & FILTERING
// ===================================

// PaginationRequest represents pagination parameters
// @Description Pagination parameters
type PaginationRequest struct {
	Page     int `form:"page" json:"page" binding:"min=1" example:"1"`
	PageSize int `form:"page_size" json:"page_size" binding:"min=1,max=100" example:"20"`
}

// PaginationResponse represents pagination metadata
// @Description Pagination metadata
type PaginationResponse struct {
	Page       int   `json:"page" example:"1"`
	PageSize   int   `json:"page_size" example:"20"`
	TotalItems int64 `json:"total_items" example:"150"`
	TotalPages int   `json:"total_pages" example:"8"`
}

// ListResponse represents a paginated list response
// @Description Generic paginated list response
type ListResponse struct {
	Data       interface{}        `json:"data"`
	Pagination PaginationResponse `json:"pagination"`
}

// ===================================
// ERROR RESPONSES
// ===================================

// ErrorResponse represents an error response
// @Description Error response
type ErrorResponse struct {
	Error   string      `json:"error" example:"Invalid request"`
	Message string      `json:"message" example:"Email is required"`
	Code    string      `json:"code,omitempty" example:"VALIDATION_ERROR"`
	Details interface{} `json:"details,omitempty"`
}

// ValidationError represents a validation error
// @Description Validation error details
type ValidationError struct {
	Field   string `json:"field" example:"email"`
	Message string `json:"message" example:"Email is required"`
}

// ===================================
// SUCCESS RESPONSES
// ===================================

// SuccessResponse represents a generic success response
// @Description Generic success response
type SuccessResponse struct {
	Success bool        `json:"success" example:"true"`
	Message string      `json:"message" example:"Operation completed successfully"`
	Data    interface{} `json:"data,omitempty"`
}

// MessageResponse represents a simple message response
// @Description Simple message response
type MessageResponse struct {
	Message string `json:"message" example:"Operation completed successfully"`
}
