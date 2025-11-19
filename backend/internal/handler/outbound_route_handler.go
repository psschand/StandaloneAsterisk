package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

type OutboundRouteHandler struct {
	service service.OutboundRouteService
}

func NewOutboundRouteHandler(service service.OutboundRouteService) *OutboundRouteHandler {
	return &OutboundRouteHandler{service: service}
}

func (h *OutboundRouteHandler) ListOutboundRoutes(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		tenantID = "default"
	}

	routes, err := h.service.GetAll(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, routes)
}

func (h *OutboundRouteHandler) GetOutboundRoute(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		tenantID = "default"
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid route ID"})
		return
	}

	route, err := h.service.GetByID(c.Request.Context(), id, tenantID)
	if err != nil {
		response.NotFound(c, "Outbound route not found")
		return
	}

	response.Success(c, route)
}

func (h *OutboundRouteHandler) CreateOutboundRoute(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		tenantID = "default"
	}

	var req dto.CreateOutboundRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	route, err := h.service.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, route)
}

func (h *OutboundRouteHandler) UpdateOutboundRoute(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		tenantID = "default"
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid route ID"})
		return
	}

	var req dto.UpdateOutboundRouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	route, err := h.service.Update(c.Request.Context(), id, tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, route)
}

func (h *OutboundRouteHandler) DeleteOutboundRoute(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		tenantID = "default"
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid route ID"})
		return
	}

	if err := h.service.Delete(c.Request.Context(), id, tenantID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}
