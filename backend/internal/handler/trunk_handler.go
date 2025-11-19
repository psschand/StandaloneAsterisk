package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
)

type TrunkHandler struct {
	endpointRepo repository.PsEndpointRepository
	authRepo     repository.PsAuthRepository
	aorRepo      repository.PsAorRepository
}

func NewTrunkHandler(
	endpointRepo repository.PsEndpointRepository,
	authRepo repository.PsAuthRepository,
	aorRepo repository.PsAorRepository,
) *TrunkHandler {
	return &TrunkHandler{
		endpointRepo: endpointRepo,
		authRepo:     authRepo,
		aorRepo:      aorRepo,
	}
}

// Helper to create string pointer
func ptrStr(s string) *string {
	return &s
}

// Helper to create int pointer
func ptrInt(i int) *int {
	return &i
}

// ListTrunks lists all SIP trunks
func (h *TrunkHandler) ListTrunks(c *gin.Context) {
	ctx := c.Request.Context()

	endpoints, err := h.endpointRepo.FindByTenant(ctx, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to fetch trunks",
		})
		return
	}

	trunks := []map[string]interface{}{}
	for _, endpoint := range endpoints {
		// Identify trunks by context or ID pattern
		if (endpoint.Context != nil && *endpoint.Context == "from-trunk") ||
			strings.Contains(endpoint.ID, "trunk") {

			trunkData := map[string]interface{}{
				"id":     endpoint.ID,
				"name":   endpoint.ID,
				"status": "active",
			}

			if endpoint.Transport != nil {
				trunkData["transport"] = *endpoint.Transport
			}
			if endpoint.Context != nil {
				trunkData["context"] = *endpoint.Context
			}
			if endpoint.Allow != nil {
				trunkData["codecs"] = *endpoint.Allow
			}

			trunks = append(trunks, trunkData)
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Fetched trunks successfully",
		Data:    trunks,
	})
}

// CreateTrunk creates a new SIP trunk
func (h *TrunkHandler) CreateTrunk(c *gin.Context) {
	var req struct {
		Name      string `json:"name" binding:"required"`
		Host      string `json:"host" binding:"required"`
		Username  string `json:"username"`
		Password  string `json:"password"`
		Transport string `json:"transport"`
		Codecs    string `json:"codecs"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Code:    "INVALID_INPUT",
			Error:   "Invalid input",
			Message: err.Error(),
		})
		return
	}

	ctx := c.Request.Context()

	// Create endpoint
	endpoint := asterisk.PsEndpoint{
		ID:          req.Name,
		Transport:   ptrStr(req.Transport),
		Aors:        ptrStr(req.Name),
		Auth:        ptrStr(req.Name + "-auth"),
		Context:     ptrStr("from-trunk"),
		Disallow:    ptrStr("all"),
		Allow:       ptrStr(req.Codecs),
		DirectMedia: ptrStr("no"),
	}

	if err := h.endpointRepo.Create(ctx, &endpoint); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to create trunk endpoint",
		})
		return
	}

	// Create auth if credentials provided
	if req.Username != "" && req.Password != "" {
		auth := asterisk.PsAuth{
			ID:       req.Name + "-auth",
			AuthType: ptrStr("userpass"),
			Username: ptrStr(req.Username),
			Password: ptrStr(req.Password),
		}

		if err := h.authRepo.Create(ctx, &auth); err != nil {
			h.endpointRepo.Delete(ctx, endpoint.ID)
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Code:    "INTERNAL_ERROR",
				Error:   "Internal error",
				Message: "Failed to create trunk auth",
			})
			return
		}
	}

	// Create AOR
	aor := asterisk.PsAor{
		ID:               req.Name,
		MaxContacts:      ptrInt(1),
		QualifyFrequency: ptrInt(60),
		Contact:          ptrStr("sip:" + req.Host),
	}

	if err := h.aorRepo.Create(ctx, &aor); err != nil {
		h.authRepo.Delete(ctx, req.Name+"-auth")
		h.endpointRepo.Delete(ctx, endpoint.ID)
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to create trunk AOR",
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Message: "Trunk created successfully",
		Data: map[string]interface{}{
			"id":        endpoint.ID,
			"name":      req.Name,
			"host":      req.Host,
			"transport": req.Transport,
		},
	})
}

// DeleteTrunk deletes a SIP trunk
func (h *TrunkHandler) DeleteTrunk(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()

	// Delete in order: AOR -> Auth -> Endpoint
	h.aorRepo.Delete(ctx, id)
	h.authRepo.Delete(ctx, id+"-auth")

	if err := h.endpointRepo.Delete(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Code:    "INTERNAL_ERROR",
			Error:   "Internal error",
			Message: "Failed to delete trunk",
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Trunk deleted successfully",
		Data:    nil,
	})
}

// GetTrunk gets a specific trunk
func (h *TrunkHandler) GetTrunk(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()

	endpoint, err := h.endpointRepo.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Code:    "NOT_FOUND",
			Error:   "Not found",
			Message: "Trunk not found",
		})
		return
	}

	trunkData := map[string]interface{}{
		"id":   endpoint.ID,
		"name": endpoint.ID,
	}

	if endpoint.Transport != nil {
		trunkData["transport"] = *endpoint.Transport
	}
	if endpoint.Context != nil {
		trunkData["context"] = *endpoint.Context
	}
	if endpoint.Allow != nil {
		trunkData["codecs"] = *endpoint.Allow
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Trunk fetched successfully",
		Data:    trunkData,
	})
}
