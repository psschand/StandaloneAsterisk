package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// TenantHandler handles tenant requests
type TenantHandler struct {
	tenantService service.TenantService
}

// NewTenantHandler creates a new tenant handler
func NewTenantHandler(tenantService service.TenantService) *TenantHandler {
	return &TenantHandler{
		tenantService: tenantService,
	}
}

// Create creates a new tenant
func (h *TenantHandler) Create(c *gin.Context) {
	var req dto.CreateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.tenantService.Create(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// Get gets a tenant by ID
func (h *TenantHandler) Get(c *gin.Context) {
	id := c.Param("id")

	result, err := h.tenantService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// List lists all tenants with pagination
func (h *TenantHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	tenants, total, err := h.tenantService.GetAll(c.Request.Context(), page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, tenants, meta)
}

// Update updates a tenant
func (h *TenantHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.tenantService.Update(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// Delete deletes a tenant
func (h *TenantHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.tenantService.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// GetByDomain gets a tenant by domain
func (h *TenantHandler) GetByDomain(c *gin.Context) {
	domain := c.Query("domain")
	if domain == "" {
		response.ValidationError(c, map[string]string{"domain": "domain is required"})
		return
	}

	result, err := h.tenantService.GetByDomain(c.Request.Context(), domain)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// GetResourceUsage gets resource usage for a tenant
func (h *TenantHandler) GetResourceUsage(c *gin.Context) {
	id := c.Param("id")

	result, err := h.tenantService.GetResourceUsage(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// UpdateStatus updates tenant status
func (h *TenantHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.tenantService.UpdateStatus(c.Request.Context(), id, req.Status); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}
