package chat

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WebsiteHandler struct {
	db *gorm.DB
}

func NewWebsiteHandler(db *gorm.DB) *WebsiteHandler {
	return &WebsiteHandler{db: db}
}

// ListWebsites godoc
// @Summary List websites for tenant
// @Description Get all websites for the authenticated tenant
// @Tags Websites
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/chat/websites [get]
func (h *WebsiteHandler) ListWebsites(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var websites []Website
	if err := h.db.Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&websites).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to fetch websites"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    websites,
	})
}

// GetWebsite godoc
// @Summary Get website by ID
// @Description Get a single website by ID
// @Tags Websites
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path int true "Website ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/chat/websites/:id [get]
func (h *WebsiteHandler) GetWebsite(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id := c.Param("id")

	var website Website
	if err := h.db.Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&website).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   gin.H{"message": "Website not found"},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to fetch website"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    website,
	})
}

// CreateWebsite godoc
// @Summary Create a new website
// @Description Create a new website for the tenant
// @Tags Websites
// @Accept json
// @Produce json
// @Security Bearer
// @Param request body object true "Website data"
// @Success 201 {object} map[string]interface{}
// @Router /api/v1/chat/websites [post]
func (h *WebsiteHandler) CreateWebsite(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	// Check tenant's domain mode and website limit
	var tenant struct {
		DomainMode  string `gorm:"column:domain_mode"`
		MaxWebsites *int   `gorm:"column:max_websites"`
	}
	if err := h.db.Table("tenants").
		Select("domain_mode, max_websites").
		Where("id = ?", tenantID).
		First(&tenant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to verify tenant settings"},
		})
		return
	}

	// Count existing websites
	var count int64
	h.db.Model(&Website{}).Where("tenant_id = ?", tenantID).Count(&count)

	// Check domain mode limits
	if tenant.DomainMode == "single" && count >= 1 {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   gin.H{"message": "Tenant is in single-domain mode. Cannot create more than 1 website."},
		})
		return
	}

	// Check max websites limit (if set)
	if tenant.MaxWebsites != nil && count >= int64(*tenant.MaxWebsites) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   gin.H{"message": "Maximum website limit reached"},
		})
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Domain      string `json:"domain"`
		Description string `json:"description"`
		IsActive    *bool  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   gin.H{"message": "Invalid request data", "details": err.Error()},
		})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	website := Website{
		TenantID:    tenantID,
		Name:        req.Name,
		Domain:      req.Domain,
		Description: req.Description,
		IsActive:    isActive,
	}

	// Start transaction to create website + default widget
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&website).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to create website"},
		})
		return
	}

	// Create default chat widget for the new website
	// Generate unique widget_key
	widgetKey := fmt.Sprintf("widget_%s_%d", tenantID, website.ID)

	defaultWidget := map[string]interface{}{
		"tenant_id":              tenantID,
		"website_id":             website.ID,
		"name":                   website.Name + " - Default Widget",
		"widget_key":             widgetKey,
		"enabled":                true,
		"primary_color":          "#3B82F6",
		"secondary_color":        "#FFFFFF",
		"position":               "bottom-right",
		"widget_position":        "bottom-right",
		"title":                  "Chat Support",
		"subtitle":               "We're here to help!",
		"welcome_message":        "Hello! How can we help you today?",
		"offline_message":        "We're currently offline. Please leave a message.",
		"placeholder_text":       "Type your message...",
		"team_name":              "Support Team",
		"show_agent_typing":      true,
		"show_read_receipts":     true,
		"allow_file_upload":      true,
		"allow_emojis":           true,
		"require_email":          false,
		"require_name":           true,
		"auto_assign":            true,
		"business_hours_enabled": false,
		"is_enabled":             true,
	}

	if err := tx.Table("chat_widgets").Create(defaultWidget).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to create default widget"},
		})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to complete transaction"},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    website,
		"message": "Website and default widget created successfully",
	})
}

// UpdateWebsite godoc
// @Summary Update website
// @Description Update website details
// @Tags Websites
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path int true "Website ID"
// @Param request body object true "Website data"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/chat/websites/:id [put]
func (h *WebsiteHandler) UpdateWebsite(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id := c.Param("id")

	var website Website
	if err := h.db.Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&website).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   gin.H{"message": "Website not found"},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to fetch website"},
		})
		return
	}

	var req struct {
		Name        string `json:"name"`
		Domain      string `json:"domain"`
		Description string `json:"description"`
		IsActive    *bool  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   gin.H{"message": "Invalid request data"},
		})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Domain != "" {
		updates["domain"] = req.Domain
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := h.db.Model(&website).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to update website"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    website,
		"message": "Website updated successfully",
	})
}

// DeleteWebsite godoc
// @Summary Delete website
// @Description Delete a website (will cascade delete widgets)
// @Tags Websites
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path int true "Website ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/chat/websites/:id [delete]
func (h *WebsiteHandler) DeleteWebsite(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	id := c.Param("id")

	var website Website
	if err := h.db.Where("id = ? AND tenant_id = ?", id, tenantID).
		First(&website).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   gin.H{"message": "Website not found"},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to fetch website"},
		})
		return
	}

	// Check if website has widgets
	var widgetCount int64
	h.db.Model(&ChatWidget{}).Where("website_id = ?", id).Count(&widgetCount)
	if widgetCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error": gin.H{
				"message": "Cannot delete website with active widgets",
				"widgets": widgetCount,
			},
		})
		return
	}

	if err := h.db.Delete(&website).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"message": "Failed to delete website"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Website deleted successfully",
	})
}

// GetWebsiteStats godoc
// @Summary Get website statistics
// @Description Get widget count and other stats for a website
// @Tags Websites
// @Accept json
// @Produce json
// @Security Bearer
// @Param id path int true "Website ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/chat/websites/:id/stats [get]
func (h *WebsiteHandler) GetWebsiteStats(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	idStr := c.Param("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	var stats struct {
		WidgetCount       int64 `json:"widget_count"`
		ActiveWidgets     int64 `json:"active_widgets"`
		ConversationCount int64 `json:"conversation_count"`
	}

	// Count widgets
	h.db.Model(&ChatWidget{}).
		Where("website_id = ? AND tenant_id = ?", id, tenantID).
		Count(&stats.WidgetCount)

	// Count active widgets
	h.db.Model(&ChatWidget{}).
		Where("website_id = ? AND tenant_id = ? AND is_active = ?", id, tenantID, true).
		Count(&stats.ActiveWidgets)

	// Count conversations (from widgets belonging to this website)
	h.db.Table("conversations c").
		Joins("JOIN chat_widgets w ON c.widget_id = w.id").
		Where("w.website_id = ? AND w.tenant_id = ?", id, tenantID).
		Count(&stats.ConversationCount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
