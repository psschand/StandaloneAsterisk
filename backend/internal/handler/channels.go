package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/models"
	"github.com/psschand/callcenter/internal/services/whatsapp"
)

type ChannelHandler struct {
	db              *sql.DB
	whatsappService *whatsapp.Service
}

func NewChannelHandler(db *sql.DB) *ChannelHandler {
	return &ChannelHandler{
		db:              db,
		whatsappService: whatsapp.NewService(),
	}
}

// GetWebsiteChannels gets all channels for a website
// GET /api/v1/websites/:id/channels
func (h *ChannelHandler) GetWebsiteChannels(c *gin.Context) {
	websiteID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	query := `
		SELECT id, tenant_id, website_id, channel_type, channel_name, 
		       credentials, is_active, auto_respond, business_hours_only,
		       connection_status, last_connected_at, created_at, updated_at
		FROM channel_connections
		WHERE website_id = ? AND tenant_id = ?
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(query, websiteID, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch channels"})
		return
	}
	defer rows.Close()

	channels := []models.ChannelConnection{}
	for rows.Next() {
		var channel models.ChannelConnection
		var credentialsJSON []byte

		err := rows.Scan(
			&channel.ID, &channel.TenantID, &channel.WebsiteID,
			&channel.ChannelType, &channel.ChannelName,
			&credentialsJSON, &channel.IsActive, &channel.AutoRespond,
			&channel.BusinessHoursOnly, &channel.ConnectionStatus,
			&channel.LastConnectedAt, &channel.CreatedAt, &channel.UpdatedAt,
		)
		if err != nil {
			continue
		}

		// Parse credentials JSON
		if len(credentialsJSON) > 0 {
			json.Unmarshal(credentialsJSON, &channel.Credentials)
		}

		// Mask sensitive data
		if channel.Credentials != nil {
			if token, ok := channel.Credentials["access_token"].(string); ok && len(token) > 10 {
				channel.Credentials["access_token"] = token[:10] + "..." + token[len(token)-4:]
			}
		}

		channels = append(channels, channel)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    channels,
	})
}

// CreateChannel creates a new channel connection
// POST /api/v1/websites/:id/channels
func (h *ChannelHandler) CreateChannel(c *gin.Context) {
	websiteID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req models.CreateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify website belongs to tenant
	var count int
	err := h.db.QueryRow("SELECT COUNT(*) FROM websites WHERE id = ? AND tenant_id = ?", websiteID, tenantID).Scan(&count)
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}

	// Convert credentials to JSON
	credentialsJSON, err := json.Marshal(req.Credentials)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credentials format"})
		return
	}

	// Insert channel
	query := `
		INSERT INTO channel_connections 
		(tenant_id, website_id, channel_type, channel_name, credentials, 
		 is_active, auto_respond, business_hours_only, connection_status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := h.db.Exec(query,
		tenantID, websiteID, req.ChannelType, req.ChannelName,
		credentialsJSON, false, req.AutoRespond, req.BusinessHoursOnly, "pending",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create channel"})
		return
	}

	channelID, _ := result.LastInsertId()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Channel created successfully",
		"data": gin.H{
			"id": channelID,
		},
	})
}

// UpdateChannel updates a channel configuration
// PUT /api/v1/channels/:id
func (h *ChannelHandler) UpdateChannel(c *gin.Context) {
	channelID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var req models.UpdateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify channel belongs to tenant
	var count int
	err := h.db.QueryRow("SELECT COUNT(*) FROM channel_connections WHERE id = ? AND tenant_id = ?", channelID, tenantID).Scan(&count)
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
		return
	}

	// Build update query dynamically
	updates := []string{}
	args := []interface{}{}

	if req.ChannelName != "" {
		updates = append(updates, "channel_name = ?")
		args = append(args, req.ChannelName)
	}
	if req.Credentials != nil {
		credentialsJSON, _ := json.Marshal(req.Credentials)
		updates = append(updates, "credentials = ?")
		args = append(args, credentialsJSON)
	}
	if req.IsActive != nil {
		updates = append(updates, "is_active = ?")
		args = append(args, *req.IsActive)
	}
	if req.AutoRespond != nil {
		updates = append(updates, "auto_respond = ?")
		args = append(args, *req.AutoRespond)
	}
	if req.BusinessHoursOnly != nil {
		updates = append(updates, "business_hours_only = ?")
		args = append(args, *req.BusinessHoursOnly)
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	args = append(args, channelID, tenantID)

	query := "UPDATE channel_connections SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += ", updated_at = NOW() WHERE id = ? AND tenant_id = ?"

	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update channel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channel updated successfully",
	})
}

// DeleteChannel deletes a channel
// DELETE /api/v1/channels/:id
func (h *ChannelHandler) DeleteChannel(c *gin.Context) {
	channelID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	result, err := h.db.Exec("DELETE FROM channel_connections WHERE id = ? AND tenant_id = ?", channelID, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete channel"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channel deleted successfully",
	})
}

// TestChannel tests the connection to a channel
// POST /api/v1/channels/:id/test
func (h *ChannelHandler) TestChannel(c *gin.Context) {
	channelID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	// Get channel details
	var channel models.ChannelConnection
	var credentialsJSON []byte

	query := `SELECT channel_type, credentials FROM channel_connections WHERE id = ? AND tenant_id = ?`
	err := h.db.QueryRow(query, channelID, tenantID).Scan(&channel.ChannelType, &credentialsJSON)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
		return
	}

	// Parse credentials
	json.Unmarshal(credentialsJSON, &channel.Credentials)

	// Test based on channel type
	switch channel.ChannelType {
	case "whatsapp":
		phoneNumberID, _ := channel.Credentials["phone_number_id"].(string)
		accessToken, _ := channel.Credentials["access_token"].(string)

		if phoneNumberID == "" || accessToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Missing WhatsApp credentials",
			})
			return
		}

		success, message := h.whatsappService.TestConnection(phoneNumberID, accessToken)

		// Update connection status
		status := "error"
		if success {
			status = "active"
			h.db.Exec("UPDATE channel_connections SET connection_status = ?, last_connected_at = NOW() WHERE id = ?", status, channelID)
		}

		c.JSON(http.StatusOK, models.ChannelTestResponse{
			Success: success,
			Message: message,
		})

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Channel type not yet supported",
		})
	}
}

// GetChannelByID gets a single channel
// GET /api/v1/channels/:id
func (h *ChannelHandler) GetChannelByID(c *gin.Context) {
	channelID := c.Param("id")
	tenantID := c.GetString("tenant_id")

	var channel models.ChannelConnection
	var credentialsJSON []byte

	query := `
		SELECT id, tenant_id, website_id, channel_type, channel_name, 
		       credentials, is_active, auto_respond, business_hours_only,
		       connection_status, last_connected_at, created_at, updated_at
		FROM channel_connections
		WHERE id = ? AND tenant_id = ?
	`

	err := h.db.QueryRow(query, channelID, tenantID).Scan(
		&channel.ID, &channel.TenantID, &channel.WebsiteID,
		&channel.ChannelType, &channel.ChannelName,
		&credentialsJSON, &channel.IsActive, &channel.AutoRespond,
		&channel.BusinessHoursOnly, &channel.ConnectionStatus,
		&channel.LastConnectedAt, &channel.CreatedAt, &channel.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch channel"})
		return
	}

	// Parse credentials
	if len(credentialsJSON) > 0 {
		json.Unmarshal(credentialsJSON, &channel.Credentials)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    channel,
	})
}
