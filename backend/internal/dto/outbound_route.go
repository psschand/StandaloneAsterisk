package dto

// CreateOutboundRouteRequest represents the request to create an outbound route
type CreateOutboundRouteRequest struct {
	Name           string  `json:"name" binding:"required,min=1,max=100"`
	Description    *string `json:"description"`
	Pattern        string  `json:"pattern" binding:"required,min=1,max=100"`
	TrunkID        string  `json:"trunk_id" binding:"required"`
	Priority       int     `json:"priority" binding:"min=1,max=999"`
	Enabled        *bool   `json:"enabled"`
	Prepend        *string `json:"prepend"`
	Strip          int     `json:"strip" binding:"min=0,max=20"`
	CallerIDName   *string `json:"caller_id_name"`
	CallerIDNumber *string `json:"caller_id_number"`
}

// UpdateOutboundRouteRequest represents the request to update an outbound route
type UpdateOutboundRouteRequest struct {
	Name           *string `json:"name" binding:"omitempty,min=1,max=100"`
	Description    *string `json:"description"`
	Pattern        *string `json:"pattern" binding:"omitempty,min=1,max=100"`
	TrunkID        *string `json:"trunk_id"`
	Priority       *int    `json:"priority" binding:"omitempty,min=1,max=999"`
	Enabled        *bool   `json:"enabled"`
	Prepend        *string `json:"prepend"`
	Strip          *int    `json:"strip" binding:"omitempty,min=0,max=20"`
	CallerIDName   *string `json:"caller_id_name"`
	CallerIDNumber *string `json:"caller_id_number"`
}

// OutboundRouteResponse represents an outbound route in API responses
type OutboundRouteResponse struct {
	ID             int64   `json:"id"`
	TenantID       string  `json:"tenant_id"`
	Name           string  `json:"name"`
	Description    *string `json:"description"`
	Pattern        string  `json:"pattern"`
	TrunkID        string  `json:"trunk_id"`
	TrunkName      *string `json:"trunk_name,omitempty"` // Joined from ps_endpoints
	Priority       int     `json:"priority"`
	Enabled        bool    `json:"enabled"`
	Prepend        *string `json:"prepend"`
	Strip          int     `json:"strip"`
	CallerIDName   *string `json:"caller_id_name"`
	CallerIDNumber *string `json:"caller_id_number"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}
