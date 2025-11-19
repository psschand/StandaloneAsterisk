package chat

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AIProfileHandler struct {
	db *gorm.DB
}

func NewAIProfileHandler(db *gorm.DB) *AIProfileHandler {
	return &AIProfileHandler{db: db}
}

// List AI Agent Profiles
func (h *AIProfileHandler) ListProfiles(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found"})
		return
	}

	var profiles []AIAgentConfig
	if err := h.db.Where("tenant_id = ?", tenantID).
		Order("is_default DESC, created_at DESC").
		Find(&profiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch AI profiles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    profiles,
	})
}

// Get Single AI Profile
func (h *AIProfileHandler) GetProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	profileID := c.Param("id")

	var profile AIAgentConfig
	if err := h.db.Where("id = ? AND tenant_id = ?", profileID, tenantID).
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "AI profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch AI profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    profile,
	})
}

// Create AI Profile
func (h *AIProfileHandler) CreateProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant ID not found"})
		return
	}

	var req struct {
		ProfileName  string   `json:"profile_name" binding:"required"`
		Description  string   `json:"description"`
		WebsiteID    *int64   `json:"website_id"`
		Model        string   `json:"model" binding:"required"`
		SystemPrompt string   `json:"system_prompt"`
		Temperature  float64  `json:"temperature"`
		MaxTokens    int      `json:"max_tokens"`
		RAGEnabled   bool     `json:"rag_enabled"`
		KBTags       []string `json:"kb_tags"`
		IsDefault    bool     `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If setting as default, unset other defaults
	if req.IsDefault {
		h.db.Model(&AIAgentConfig{}).
			Where("tenant_id = ? AND is_default = ?", tenantID, true).
			Update("is_default", false)
	}

	profile := AIAgentConfig{
		TenantID:     tenantID,
		ProfileName:  req.ProfileName,
		Description:  req.Description,
		WebsiteID:    req.WebsiteID,
		Model:        req.Model,
		SystemPrompt: req.SystemPrompt,
		Temperature:  req.Temperature,
		MaxTokens:    req.MaxTokens,
		RAGEnabled:   req.RAGEnabled,
		IsDefault:    req.IsDefault,
		// SupportedLanguages will be nil (NULL in DB)
	}

	// Convert tags to JSON string
	if len(req.KBTags) > 0 {
		tagsJSON, err := json.Marshal(req.KBTags)
		if err == nil {
			profile.KBTags = string(tagsJSON)
		}
	}

	if err := h.db.Create(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create AI profile"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    profile,
	})
}

// Update AI Profile
func (h *AIProfileHandler) UpdateProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	profileID := c.Param("id")

	var profile AIAgentConfig
	if err := h.db.Where("id = ? AND tenant_id = ?", profileID, tenantID).
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "AI profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch AI profile"})
		return
	}

	var req struct {
		ProfileName  string   `json:"profile_name"`
		Description  string   `json:"description"`
		WebsiteID    *int64   `json:"website_id"`
		Model        string   `json:"model"`
		SystemPrompt string   `json:"system_prompt"`
		Temperature  float64  `json:"temperature"`
		MaxTokens    int      `json:"max_tokens"`
		RAGEnabled   bool     `json:"rag_enabled"`
		KBTags       []string `json:"kb_tags"`
		IsDefault    bool     `json:"is_default"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If setting as default, unset other defaults
	if req.IsDefault && !profile.IsDefault {
		h.db.Model(&AIAgentConfig{}).
			Where("tenant_id = ? AND is_default = ? AND id != ?", tenantID, true, profileID).
			Update("is_default", false)
	}

	// Update fields
	updates := map[string]interface{}{
		"profile_name":  req.ProfileName,
		"description":   req.Description,
		"website_id":    req.WebsiteID,
		"model":         req.Model,
		"system_prompt": req.SystemPrompt,
		"temperature":   req.Temperature,
		"max_tokens":    req.MaxTokens,
		"rag_enabled":   req.RAGEnabled,
		"is_default":    req.IsDefault,
	}

	if len(req.KBTags) > 0 {
		tagsJSON, err := json.Marshal(req.KBTags)
		if err == nil {
			updates["kb_tags"] = string(tagsJSON)
		}
	}

	if err := h.db.Model(&profile).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update AI profile"})
		return
	}

	// Reload updated profile
	h.db.Where("id = ?", profileID).First(&profile)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    profile,
	})
}

// Delete AI Profile
func (h *AIProfileHandler) DeleteProfile(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	profileID := c.Param("id")

	var profile AIAgentConfig
	if err := h.db.Where("id = ? AND tenant_id = ?", profileID, tenantID).
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "AI profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch AI profile"})
		return
	}

	// Prevent deleting the default profile if it's the only one
	if profile.IsDefault {
		var count int64
		h.db.Model(&AIAgentConfig{}).Where("tenant_id = ?", tenantID).Count(&count)
		if count == 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete the only AI profile"})
			return
		}
	}

	if err := h.db.Delete(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete AI profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI profile deleted successfully",
	})
}

// Get AI Profile by Widget ID
func (h *AIProfileHandler) GetProfileByWidget(c *gin.Context) {
	widgetID := c.Param("widget_id")
	tenantID := c.GetString("tenant_id")

	// Get widget with AI profile
	var widget struct {
		ID               int64  `json:"id"`
		AIAgentProfileID *int64 `json:"ai_agent_profile_id"`
		TenantID         string `json:"tenant_id"`
	}

	if err := h.db.Table("chat_widgets").
		Where("id = ? AND tenant_id = ?", widgetID, tenantID).
		First(&widget).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Widget not found"})
		return
	}

	// If widget has no AI profile assigned, return default
	var profile AIAgentConfig
	if widget.AIAgentProfileID != nil {
		if err := h.db.Where("id = ? AND tenant_id = ?", *widget.AIAgentProfileID, tenantID).
			First(&profile).Error; err != nil {
			// Fall back to default if assigned profile not found
			h.db.Where("tenant_id = ? AND is_default = ?", tenantID, true).First(&profile)
		}
	} else {
		// Get default profile
		if err := h.db.Where("tenant_id = ? AND is_default = ?", tenantID, true).
			First(&profile).Error; err != nil {
			// If no default, get any profile
			h.db.Where("tenant_id = ?", tenantID).First(&profile)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    profile,
	})
}

// Link AI Profile to Widget
func (h *AIProfileHandler) LinkToWidget(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	widgetID := c.Param("widget_id")

	var req struct {
		AIAgentProfileID int64 `json:"ai_agent_profile_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify profile exists
	var profile AIAgentConfig
	if err := h.db.Where("id = ? AND tenant_id = ?", req.AIAgentProfileID, tenantID).
		First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "AI profile not found"})
		return
	}

	// Update widget
	widgetIDInt, _ := strconv.ParseInt(widgetID, 10, 64)
	if err := h.db.Table("chat_widgets").
		Where("id = ? AND tenant_id = ?", widgetIDInt, tenantID).
		Update("ai_agent_profile_id", req.AIAgentProfileID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link AI profile to widget"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI profile linked to widget successfully",
	})
}
