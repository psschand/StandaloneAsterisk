package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
)

// EndpointHandler handles SIP endpoint operations
type EndpointHandler struct {
	endpointRepo     repository.PsEndpointRepository
	authRepo         repository.PsAuthRepository
	aorRepo          repository.PsAorRepository
	endpointIdIpRepo repository.PsEndpointIdIpRepository
}

// NewEndpointHandler creates a new endpoint handler
func NewEndpointHandler(endpointRepo repository.PsEndpointRepository, authRepo repository.PsAuthRepository, aorRepo repository.PsAorRepository, endpointIdIpRepo repository.PsEndpointIdIpRepository) *EndpointHandler {
	return &EndpointHandler{
		endpointRepo:     endpointRepo,
		authRepo:         authRepo,
		aorRepo:          aorRepo,
		endpointIdIpRepo: endpointIdIpRepo,
	}
}

// ListExtensions lists all extensions (ignores tenant)
func (h *EndpointHandler) ListExtensions(c *gin.Context) {
	// NOTE: ps_endpoints table does not have tenant_id, so fetch all endpoints
	endpoints, err := h.endpointRepo.FindByTenant(c.Request.Context(), "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to fetch extensions",
		})
		return
	}

	// Convert to response format
	response := make([]map[string]interface{}, len(endpoints))
	for i, endpoint := range endpoints {
		response[i] = map[string]interface{}{
			"id":           endpoint.ID,
			"display_name": endpoint.Callerid,
			"context":      endpoint.Context,
			"codecs":       endpoint.Allow,
			"transport":    endpoint.Transport,
			"status":       "offline", // TODO: Get real status from ps_contacts
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Fetched extensions successfully",
		Data:    response,
	})
}

// GetExtension gets a specific extension by ID
func (h *EndpointHandler) GetExtension(c *gin.Context) {
	id := c.Param("id")

	endpoint, err := h.endpointRepo.FindByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "Not found",
			Message: "Extension not found",
		})
		return
	}

	response := map[string]interface{}{
		"id":           endpoint.ID,
		"display_name": endpoint.Callerid,
		"context":      endpoint.Context,
		"codecs":       endpoint.Allow,
		"transport":    endpoint.Transport,
		"status":       "offline",
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Fetched extension successfully",
		Data:    response,
	})
}

// CreateExtension creates a new extension
func (h *EndpointHandler) CreateExtension(c *gin.Context) {
	var req struct {
		ExtensionNumber string  `json:"extension_number" binding:"required"`
		Password        string  `json:"password" binding:"required,min=6"`
		DisplayName     *string `json:"display_name"`
		Context         *string `json:"context"`
		Codecs          *string `json:"codecs"`
		MaxContacts     *int    `json:"max_contacts"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Code:    "INVALID_REQUEST",
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// tenantID not used for Asterisk tables (no multi-tenancy support)
	_, _ = c.Get("user_id")
	_, _ = c.Get("tenant_id")

	ctx := c.Request.Context()

	// Set defaults
	context := "internal"
	if req.Context != nil {
		context = *req.Context
	}
	codecs := "ulaw,alaw,g722"
	if req.Codecs != nil {
		codecs = *req.Codecs
	}
	maxContacts := 1
	if req.MaxContacts != nil {
		maxContacts = *req.MaxContacts
	}
	transport := "transport-udp"

	// Create endpoint (Asterisk tables don't support multi-tenancy)
	// CRITICAL WebRTC fields: All fields below are required for WebRTC endpoints
	// Missing any of these will cause WebSocket code 1006 failures during media negotiation
	endpoint := &asterisk.PsEndpoint{
		ID:              req.ExtensionNumber,
		Callerid:        req.DisplayName, // Use Callerid for display name
		Transport:       &transport,
		Aors:            &req.ExtensionNumber,
		Auth:            &req.ExtensionNumber,
		Context:         &context,
		Disallow:        stringPtr("all"),
		Allow:           &codecs,
		DirectMedia:     stringPtr("no"),       // Force media through Asterisk (required for WebRTC)
		ForceRport:      stringPtr("yes"),      // NAT traversal - force responses to source port
		RewriteContact:  stringPtr("yes"),      // Rewrite Contact header for correct routing
		RtpSymmetric:    stringPtr("yes"),      // Symmetric RTP for NAT traversal
		DtlsVerify:      stringPtr("no"),       // Don't verify DTLS certificates (self-signed certs)
		IceSupport:      stringPtr("yes"),      // Enable ICE for WebRTC
		MediaEncryption: stringPtr("dtls"),     // DTLS encryption for WebRTC
		DtlsSetup:       stringPtr("actpass"),  // DTLS role negotiation
		UseAvpf:         stringPtr("yes"),      // RTP/AVPF for WebRTC
		Webrtc:          stringPtr("yes"),      // Enable WebRTC optimizations
		IdentifyBy:      stringPtr("username"), // Identify endpoint by username for registration
	}

	if err := h.endpointRepo.Create(ctx, endpoint); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to create endpoint: " + err.Error(),
		})
		return
	}

	// Create auth
	auth := &asterisk.PsAuth{
		ID:       req.ExtensionNumber,
		AuthType: stringPtr("userpass"),
		Username: stringPtr(req.ExtensionNumber),
		Password: stringPtr(req.Password),
	}

	if err := h.authRepo.Create(ctx, auth); err != nil {
		// Rollback endpoint
		h.endpointRepo.Delete(ctx, req.ExtensionNumber)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to create auth: " + err.Error(),
		})
		return
	}

	// Create AOR
	aor := &asterisk.PsAor{
		ID:               req.ExtensionNumber,
		MaxContacts:      &maxContacts,
		RemoveExisting:   stringPtr("yes"),
		QualifyFrequency: intPtr(60),
	}

	if err := h.aorRepo.Create(ctx, aor); err != nil {
		// Rollback
		h.authRepo.Delete(ctx, req.ExtensionNumber)
		h.endpointRepo.Delete(ctx, req.ExtensionNumber)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to create AOR: " + err.Error(),
		})
		return
	}

	// Create endpoint identifier (CRITICAL for WebSocket connections)
	// Without this, Asterisk cannot identify incoming WebSocket connections
	// and will reject them with code 1006 before SIP authentication begins
	idIp := &asterisk.PsEndpointIdIp{
		ID:       req.ExtensionNumber + "-identify",
		Endpoint: stringPtr(req.ExtensionNumber),
		Match:    stringPtr("0.0.0.0/0"), // Match all IPs for WebSocket
	}

	if err := h.endpointIdIpRepo.Create(ctx, idIp); err != nil {
		// Rollback
		h.aorRepo.Delete(ctx, req.ExtensionNumber)
		h.authRepo.Delete(ctx, req.ExtensionNumber)
		h.endpointRepo.Delete(ctx, req.ExtensionNumber)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to create endpoint identifier: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Message: "Extension created successfully",
		Data: map[string]interface{}{
			"id":           endpoint.ID,
			"display_name": endpoint.Callerid,
			"context":      endpoint.Context,
		},
	})
}

// UpdateExtension updates an existing extension
func (h *EndpointHandler) UpdateExtension(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Password    *string `json:"password"`
		DisplayName *string `json:"display_name"`
		Context     *string `json:"context"`
		Codecs      *string `json:"codecs"`
		MaxContacts *int    `json:"max_contacts"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Code:    "INVALID_REQUEST",
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Get existing endpoint
	endpoint, err := h.endpointRepo.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "Not found",
			Message: "Extension not found",
		})
		return
	}

	// Update fields
	if req.DisplayName != nil {
		endpoint.Callerid = req.DisplayName
	}
	if req.Context != nil {
		endpoint.Context = req.Context
	}
	if req.Codecs != nil {
		endpoint.Allow = req.Codecs
	}

	// Update endpoint
	if err := h.endpointRepo.Update(ctx, endpoint); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to update endpoint",
		})
		return
	}

	// Update password if provided
	if req.Password != nil {
		auth, err := h.authRepo.FindByEndpoint(ctx, id)
		if err == nil {
			auth.Password = req.Password
			h.authRepo.Update(ctx, auth)
		}
	}

	// Update max contacts if provided
	if req.MaxContacts != nil {
		aor, err := h.aorRepo.FindByEndpoint(ctx, id)
		if err == nil {
			aor.MaxContacts = req.MaxContacts
			h.aorRepo.Update(ctx, aor)
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Extension updated successfully",
		Data: map[string]interface{}{
			"message": "Extension updated successfully",
		},
	})
}

// DeleteExtension deletes an extension
func (h *EndpointHandler) DeleteExtension(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()

	// Check if exists
	_, err := h.endpointRepo.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "Not found",
			Message: "Extension not found",
		})
		return
	}

	// Delete in reverse order (Identify, AOR, Auth, Endpoint)
	h.endpointIdIpRepo.Delete(ctx, id+"-identify")
	h.aorRepo.Delete(ctx, id)
	h.authRepo.Delete(ctx, id)
	if err := h.endpointRepo.Delete(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to delete extension",
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Extension deleted successfully",
		Data: map[string]interface{}{
			"message": "Extension deleted successfully",
		},
	})
}

// ResetPassword resets extension password
func (h *EndpointHandler) ResetPassword(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Code:    "INVALID_REQUEST",
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Get auth record
	auth, err := h.authRepo.FindByEndpoint(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "Not found",
			Message: "Extension not found",
		})
		return
	}

	// Update password
	auth.Password = &req.Password
	if err := h.authRepo.Update(ctx, auth); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to reset password",
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Password reset successfully",
		Data: map[string]interface{}{
			"message": "Password reset successfully",
		},
	})
}

// GetRegistrationStatus gets the registration status of an extension
func (h *EndpointHandler) GetRegistrationStatus(c *gin.Context) {
	id := c.Param("id")

	// TODO: Query ps_contacts table to get real status
	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Status check not yet implemented",
		Data: map[string]interface{}{
			"extension": id,
			"status":    "offline",
		},
	})
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}
