package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/common"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// TicketHandler handles ticket requests
type TicketHandler struct {
	ticketService service.TicketService
}

// NewTicketHandler creates a new ticket handler
func NewTicketHandler(ticketService service.TicketService) *TicketHandler {
	return &TicketHandler{
		ticketService: ticketService,
	}
}

// Create creates a new ticket
func (h *TicketHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.ticketService.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// Get gets a ticket by ID
func (h *TicketHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	result, err := h.ticketService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// List lists all tickets for the current tenant
func (h *TicketHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// Check for status filter
	statusStr := c.Query("status")
	if statusStr != "" {
		status := common.TicketStatus(statusStr)
		tickets, total, err := h.ticketService.GetByStatus(c.Request.Context(), tenantID, status, page, pageSize)
		if err != nil {
			response.Error(c, err)
			return
		}
		meta := response.NewMeta(page, pageSize, int(total))
		response.SuccessWithMeta(c, tickets, meta)
		return
	}

	tickets, total, err := h.ticketService.GetByTenant(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, tickets, meta)
}

// Update updates a ticket
func (h *TicketHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	var req dto.UpdateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.ticketService.Update(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// Delete deletes a ticket
func (h *TicketHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	if err := h.ticketService.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// Assign assigns a ticket to a user
func (h *TicketHandler) Assign(c *gin.Context) {
	ticketID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	var req struct {
		AssigneeID int64 `json:"assignee_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.ticketService.Assign(c.Request.Context(), ticketID, req.AssigneeID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// UpdateStatus updates ticket status
func (h *TicketHandler) UpdateStatus(c *gin.Context) {
	ticketID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	var req struct {
		Status common.TicketStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.ticketService.UpdateStatus(c.Request.Context(), ticketID, req.Status); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// GetMyTickets gets tickets assigned to current user
func (h *TicketHandler) GetMyTickets(c *gin.Context) {
	userID := c.GetInt64("user_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	tickets, total, err := h.ticketService.GetByAssignee(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, tickets, meta)
}

// AddMessage adds a message to a ticket
func (h *TicketHandler) AddMessage(c *gin.Context) {
	ticketID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	var req dto.AddTicketMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.ticketService.AddMessage(c.Request.Context(), ticketID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// GetMessages gets all messages for a ticket
func (h *TicketHandler) GetMessages(c *gin.Context) {
	ticketID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid ticket ID"})
		return
	}

	messages, err := h.ticketService.GetMessages(c.Request.Context(), ticketID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, messages)
}

// Search searches for tickets
func (h *TicketHandler) Search(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	query := c.Query("q")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if query == "" {
		response.ValidationError(c, map[string]string{"q": "search query is required"})
		return
	}

	tickets, total, err := h.ticketService.Search(c.Request.Context(), tenantID, query, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, tickets, meta)
}

// GetStats gets ticket statistics
func (h *TicketHandler) GetStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr == "" || endStr == "" {
		response.ValidationError(c, map[string]string{"date_range": "start and end dates are required"})
		return
	}

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		response.ValidationError(c, map[string]string{"start": "invalid date format, use YYYY-MM-DD"})
		return
	}

	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		response.ValidationError(c, map[string]string{"end": "invalid date format, use YYYY-MM-DD"})
		return
	}

	// Set end date to end of day
	end = end.Add(24*time.Hour - time.Second)

	stats, err := h.ticketService.GetStats(c.Request.Context(), tenantID, start, end)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, stats)
}

// GetOverdue gets overdue tickets
func (h *TicketHandler) GetOverdue(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	tickets, err := h.ticketService.GetOverdue(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, tickets)
}
