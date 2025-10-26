package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// QueueHandler handles queue requests
type QueueHandler struct {
	queueService service.QueueService
}

// NewQueueHandler creates a new queue handler
func NewQueueHandler(queueService service.QueueService) *QueueHandler {
	return &QueueHandler{
		queueService: queueService,
	}
}

// Create creates a new queue
func (h *QueueHandler) Create(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.queueService.Create(c.Request.Context(), tenantID, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, result)
}

// Get gets a queue by ID
func (h *QueueHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid queue ID"})
		return
	}

	result, err := h.queueService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// List lists all queues for the current tenant
func (h *QueueHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	queues, total, err := h.queueService.GetByTenant(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, queues, meta)
}

// Update updates a queue
func (h *QueueHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid queue ID"})
		return
	}

	var req dto.UpdateQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	result, err := h.queueService.Update(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// Delete deletes a queue
func (h *QueueHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid queue ID"})
		return
	}

	if err := h.queueService.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// GetMembers gets all members of a queue
func (h *QueueHandler) GetMembers(c *gin.Context) {
	queueID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid queue ID"})
		return
	}

	members, err := h.queueService.GetMembers(c.Request.Context(), queueID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, members)
}

// AddMember adds a member to a queue
func (h *QueueHandler) AddMember(c *gin.Context) {
	queueID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid queue ID"})
		return
	}

	var req dto.AddQueueMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Extract userID from request body or context
	userID := c.GetInt64("user_id") // Get from authenticated user context

	if err := h.queueService.AddMember(c.Request.Context(), queueID, userID, &req); err != nil {
		response.Error(c, err)
		return
	}

	response.Created(c, nil)
}

// RemoveMember removes a member from a queue
func (h *QueueHandler) RemoveMember(c *gin.Context) {
	queueID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid queue ID"})
		return
	}

	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"userId": "invalid user ID"})
		return
	}

	if err := h.queueService.RemoveMember(c.Request.Context(), queueID, userID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}

// UpdateMember updates a queue member
func (h *QueueHandler) UpdateMember(c *gin.Context) {
	memberID, err := strconv.ParseInt(c.Param("memberId"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"memberId": "invalid member ID"})
		return
	}

	var req dto.UpdateQueueMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	if err := h.queueService.UpdateMember(c.Request.Context(), memberID, &req); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil)
}
