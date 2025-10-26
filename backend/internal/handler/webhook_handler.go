package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/psschand/callcenter/internal/dto"
	"github.com/psschand/callcenter/internal/repository"
	"github.com/psschand/callcenter/internal/websocket"
	"github.com/psschand/callcenter/pkg/errors"
	"github.com/psschand/callcenter/pkg/response"
)

// WebhookHandler handles webhook configuration endpoints
type WebhookHandler struct {
	repo           *repository.WebhookRepository
	webhookManager *websocket.WebhookManager
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(repo *repository.WebhookRepository, webhookManager *websocket.WebhookManager) *WebhookHandler {
	return &WebhookHandler{
		repo:           repo,
		webhookManager: webhookManager,
	}
}

// CreateWebhook creates a new webhook configuration
// @Router /api/webhooks [post]
func (h *WebhookHandler) CreateWebhook(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req dto.CreateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	webhook := &websocket.WebhookConfig{
		TenantID:   tenantID,
		Name:       req.Name,
		URL:        req.URL,
		Events:     req.Events,
		Secret:     req.Secret,
		IsActive:   true,
		RetryCount: req.RetryCount,
		Timeout:    req.Timeout,
	}

	if err := h.repo.CreateWebhook(c.Request.Context(), webhook); err != nil {
		response.Error(c, errors.NewInternal("Failed to create webhook", err))
		return
	}

	response.Created(c, webhook)
}

// GetWebhook retrieves a webhook by ID
// @Router /api/webhooks/:id [get]
func (h *WebhookHandler) GetWebhook(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	webhook, err := h.repo.GetWebhook(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "Webhook not found")
		return
	}

	response.Success(c, webhook)
}

// ListWebhooks retrieves all webhooks for a tenant
// @Router /api/webhooks [get]
func (h *WebhookHandler) ListWebhooks(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	webhooks, err := h.repo.GetActiveWebhooksByTenant(c.Request.Context(), tenantID)
	if err != nil {
		response.Error(c, errors.NewInternal("Failed to retrieve webhooks", err))
		return
	}

	response.Success(c, webhooks)
}

// UpdateWebhook updates a webhook configuration
// @Router /api/webhooks/:id [put]
func (h *WebhookHandler) UpdateWebhook(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var req dto.UpdateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	webhook, err := h.repo.GetWebhook(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "Webhook not found")
		return
	}

	// Update fields
	if req.Name != "" {
		webhook.Name = req.Name
	}
	if req.URL != "" {
		webhook.URL = req.URL
	}
	if len(req.Events) > 0 {
		webhook.Events = req.Events
	}
	if req.Secret != "" {
		webhook.Secret = req.Secret
	}
	if req.RetryCount > 0 {
		webhook.RetryCount = req.RetryCount
	}
	if req.Timeout > 0 {
		webhook.Timeout = req.Timeout
	}

	if err := h.repo.UpdateWebhook(c.Request.Context(), webhook); err != nil {
		response.Error(c, errors.NewInternal("Failed to update webhook", err))
		return
	}

	response.Success(c, webhook)
}

// DeleteWebhook deletes a webhook
// @Router /api/webhooks/:id [delete]
func (h *WebhookHandler) DeleteWebhook(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	if err := h.repo.DeleteWebhook(c.Request.Context(), id); err != nil {
		response.Error(c, errors.NewInternal("Failed to delete webhook", err))
		return
	}

	response.Success(c, gin.H{"message": "Webhook deleted successfully"})
}

// TestWebhook sends a test event to a webhook
// @Router /api/webhooks/:id/test [post]
func (h *WebhookHandler) TestWebhook(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	webhook, err := h.repo.GetWebhook(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "Webhook not found")
		return
	}

	// Send test webhook
	if err := h.webhookManager.TestWebhook(webhook.URL, webhook.Secret); err != nil {
		response.Error(c, errors.NewInternal("Webhook test failed", err))
		return
	}

	response.Success(c, gin.H{"message": "Test webhook sent successfully"})
}

// GetWebhookLogs retrieves delivery logs for a webhook
// @Router /api/webhooks/:id/logs [get]
func (h *WebhookHandler) GetWebhookLogs(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	limit := 50

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	logs, err := h.repo.GetWebhookLogs(c.Request.Context(), id, limit)
	if err != nil {
		response.Error(c, errors.NewInternal("Failed to retrieve logs", err))
		return
	}

	response.Success(c, logs)
}

// GetWebhookStats retrieves statistics for a webhook
// @Router /api/webhooks/:id/stats [get]
func (h *WebhookHandler) GetWebhookStats(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	// Default to last 24 hours
	since := time.Now().Add(-24 * time.Hour)
	if sinceStr := c.Query("since"); sinceStr != "" {
		if t, err := time.Parse(time.RFC3339, sinceStr); err == nil {
			since = t
		}
	}

	stats, err := h.repo.GetWebhookStats(c.Request.Context(), id, since)
	if err != nil {
		response.Error(c, errors.NewInternal("Failed to retrieve stats", err))
		return
	}

	response.Success(c, stats)
}

// GetFailedWebhooks retrieves failed webhook deliveries
// @Router /api/webhooks/failed [get]
func (h *WebhookHandler) GetFailedWebhooks(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	// Default to last hour
	since := time.Now().Add(-1 * time.Hour)
	if sinceStr := c.Query("since"); sinceStr != "" {
		if t, err := time.Parse(time.RFC3339, sinceStr); err == nil {
			since = t
		}
	}

	logs, err := h.repo.GetFailedWebhookLogs(c.Request.Context(), tenantID, since)
	if err != nil {
		response.Error(c, errors.NewInternal("Failed to retrieve failed webhooks", err))
		return
	}

	response.Success(c, logs)
}
