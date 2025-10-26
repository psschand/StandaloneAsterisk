package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/service"
	"github.com/psschand/callcenter/pkg/response"
)

// CDRHandler handles CDR requests
type CDRHandler struct {
	cdrService service.CDRService
}

// NewCDRHandler creates a new CDR handler
func NewCDRHandler(cdrService service.CDRService) *CDRHandler {
	return &CDRHandler{
		cdrService: cdrService,
	}
}

// Get gets a CDR by ID
func (h *CDRHandler) Get(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"id": "invalid CDR ID"})
		return
	}

	result, err := h.cdrService.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, result)
}

// List lists all CDRs for the current tenant
func (h *CDRHandler) List(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	cdrs, total, err := h.cdrService.GetByTenant(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, cdrs, meta)
}

// GetByDateRange gets CDRs by date range
func (h *CDRHandler) GetByDateRange(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

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

	cdrs, total, err := h.cdrService.GetByDateRange(c.Request.Context(), tenantID, start, end, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, cdrs, meta)
}

// GetByUser gets CDRs for a specific user
func (h *CDRHandler) GetByUser(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	userID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		response.ValidationError(c, map[string]string{"userId": "invalid user ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	cdrs, total, err := h.cdrService.GetByUser(c.Request.Context(), tenantID, userID, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, cdrs, meta)
}

// GetByQueue gets CDRs for a specific queue
func (h *CDRHandler) GetByQueue(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	queueName := c.Param("queueName")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	cdrs, total, err := h.cdrService.GetByQueue(c.Request.Context(), tenantID, queueName, page, pageSize)
	if err != nil {
		response.Error(c, err)
		return
	}

	meta := response.NewMeta(page, pageSize, int(total))
	response.SuccessWithMeta(c, cdrs, meta)
}

// GetStats gets CDR statistics
func (h *CDRHandler) GetStats(c *gin.Context) {
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

	stats, err := h.cdrService.GetStats(c.Request.Context(), tenantID, start, end)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, stats)
}

// GetCallVolume gets call volume by hour
func (h *CDRHandler) GetCallVolume(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	dateStr := c.Query("date")
	if dateStr == "" {
		response.ValidationError(c, map[string]string{"date": "date is required"})
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		response.ValidationError(c, map[string]string{"date": "invalid date format, use YYYY-MM-DD"})
		return
	}

	volumes, err := h.cdrService.GetCallVolumeByHour(c.Request.Context(), tenantID, date)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, volumes)
}
