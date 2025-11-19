package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// IVRHandler manages IVR menu endpoints.
type IVRHandler struct {
	ivrService service.IVRService
}

// NewIVRHandler creates a new IVR handler.
func NewIVRHandler(ivrService service.IVRService) *IVRHandler {
	return &IVRHandler{ivrService: ivrService}
}

// Create handles IVR menu creation.
func (h *IVRHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateIVRMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	menu, err := h.ivrService.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, menu)
}

// List returns all IVR menus for the tenant.
func (h *IVRHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	menus, err := h.ivrService.List(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, menus)
}

// Get retrieves a single IVR menu by ID.
func (h *IVRHandler) Get(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid IVR menu ID"})
		return
	}

	menu, err := h.ivrService.Get(c.Request.Context(), tenantID, id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, menu)
}

// Update modifies an existing IVR menu.
func (h *IVRHandler) Update(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid IVR menu ID"})
		return
	}

	var req dto.UpdateIVRMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	menu, err := h.ivrService.Update(c.Request.Context(), tenantID, id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, menu)
}

// Delete removes an IVR menu.
func (h *IVRHandler) Delete(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid IVR menu ID"})
		return
	}

	if err := h.ivrService.Delete(c.Request.Context(), tenantID, id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}
