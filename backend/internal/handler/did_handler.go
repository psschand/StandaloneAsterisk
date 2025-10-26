package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// DIDHandler handles DID requests
type DIDHandler struct {
	didService service.DIDService
}

// NewDIDHandler creates a new DID handler
func NewDIDHandler(didService service.DIDService) *DIDHandler {
	return &DIDHandler{
		didService: didService,
	}
}

// Create creates a new DID
func (h *DIDHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateDIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.didService.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// Get gets a DID by ID
func (h *DIDHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid DID ID"})
		return
	}

	result, err := h.didService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// List lists all DIDs for the current tenant
func (h *DIDHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	dids, total, err := h.didService.GetByTenant(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, dids, meta)
}

// Update updates a DID
func (h *DIDHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid DID ID"})
		return
	}

	var req dto.UpdateDIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.didService.Update(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// Delete deletes a DID
func (h *DIDHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid DID ID"})
		return
	}

	if err := h.didService.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// UpdateRouting updates DID routing
func (h *DIDHandler) UpdateRouting(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid DID ID"})
		return
	}

	var req dto.UpdateDIDRoutingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.didService.UpdateRouting(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// GetByNumber gets a DID by phone number
func (h *DIDHandler) GetByNumber(c *gin.Context) {
	number := c.Query("number")
	if number == "" {
		response.ValidationError(c, map[string]string{"number": "phone number is required"})
		return
	}

	result, err := h.didService.GetByNumber(c.Request.Context(), number)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// GetAvailable gets available DIDs
func (h *DIDHandler) GetAvailable(c *gin.Context) {
	dids, err := h.didService.GetAvailable(c.Request.Context())
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, dids)
}
