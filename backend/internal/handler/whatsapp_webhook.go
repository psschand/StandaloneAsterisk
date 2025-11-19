package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/services/whatsapp"
)

type WhatsAppHandler struct {
	db              *sql.DB
	whatsappService *whatsapp.Service
}

func NewWhatsAppHandler(db *sql.DB) *WhatsAppHandler {
	return &WhatsAppHandler{
		db:              db,
		whatsappService: whatsapp.NewService(),
	}
}

// VerifyWebhook handles WhatsApp webhook verification
// GET /webhooks/whatsapp
func (h *WhatsAppHandler) VerifyWebhook(c *gin.Context) {
	mode := c.Query("hub.mode")
	token := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	// Get verify token from any active WhatsApp channel (they should all use the same verify token)
	var verifyToken string
	query := `
		SELECT JSON_UNQUOTE(JSON_EXTRACT(credentials, '$.webhook_verify_token'))
		FROM channel_connections
		WHERE channel_type = 'whatsapp' AND is_active = true
		LIMIT 1
	`
	h.db.QueryRow(query).Scan(&verifyToken)

	if verifyToken == "" {
		verifyToken = "default_verify_token" // Fallback
	}

	responseChallenge, valid := h.whatsappService.VerifyWebhook(mode, token, challenge, verifyToken)
	if valid {
		c.String(http.StatusOK, responseChallenge)
		return
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "Verification failed"})
}

// ReceiveWebhook handles incoming WhatsApp messages
// POST /webhooks/whatsapp
func (h *WhatsAppHandler) ReceiveWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Error reading webhook body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Parse webhook payload
	payload, err := h.whatsappService.ParseWebhookPayload(body)
	if err != nil {
		log.Printf("Error parsing webhook payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Extract message
	phoneNumber, senderName, messageBody, messageID, messageType, hasMessage := h.whatsappService.ExtractMessage(payload)

	if !hasMessage {
		// No message to process (might be a status update)
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
		return
	}

	log.Printf("WhatsApp message received - From: %s, Name: %s, Message: %s", phoneNumber, senderName, messageBody)

	// Find which channel this message belongs to
	var channelID int64
	var websiteID int64
	var tenantID string
	var aiProfileID sql.NullInt64
	var autoRespond bool
	var credentialsJSON []byte

	query := `
		SELECT cc.id, cc.website_id, cc.tenant_id, cc.auto_respond, cc.credentials, cw.ai_agent_profile_id
		FROM channel_connections cc
		LEFT JOIN chat_widgets cw ON cw.website_id = cc.website_id
		WHERE cc.channel_type = 'whatsapp' AND cc.is_active = true
		LIMIT 1
	`
	err = h.db.QueryRow(query).Scan(&channelID, &websiteID, &tenantID, &autoRespond, &credentialsJSON, &aiProfileID)
	if err != nil {
		log.Printf("Error finding WhatsApp channel: %v", err)
		c.JSON(http.StatusOK, gin.H{"status": "channel not found"})
		return
	}

	// Find or create chat session
	sessionID, err := h.findOrCreateSession(tenantID, websiteID, channelID, phoneNumber, senderName)
	if err != nil {
		log.Printf("Error creating session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Save message
	err = h.saveMessage(sessionID, "visitor", senderName, messageBody, messageID, messageType)
	if err != nil {
		log.Printf("Error saving message: %v", err)
	}

	// Auto-respond with AI if enabled
	if autoRespond && aiProfileID.Valid {
		go h.handleAutoResponse(sessionID, aiProfileID.Int64, phoneNumber, messageBody, credentialsJSON)
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// findOrCreateSession finds existing session or creates new one
func (h *WhatsAppHandler) findOrCreateSession(tenantID string, websiteID, channelID int64, phoneNumber, senderName string) (int64, error) {
	// Check for existing active session
	var sessionID int64
	query := `
		SELECT id FROM chat_sessions
		WHERE tenant_id = ? AND channel_user_id = ? AND channel_type = 'whatsapp'
		  AND status IN ('active', 'waiting')
		ORDER BY created_at DESC
		LIMIT 1
	`
	err := h.db.QueryRow(query, tenantID, phoneNumber).Scan(&sessionID)
	if err == nil {
		// Update session timestamp
		h.db.Exec("UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?", sessionID)
		return sessionID, nil
	}

	// Create new session
	visitorID := fmt.Sprintf("whatsapp_%s", phoneNumber)
	// Generate a unique session_key
	sessionKey := fmt.Sprintf("whatsapp_%s_%d", phoneNumber, time.Now().Unix())

	insertQuery := `
		INSERT INTO chat_sessions 
		(tenant_id, widget_id, website_id, channel_connection_id, channel_type, channel_user_id, 
		 channel_username, visitor_id, visitor_name, session_key, status, created_at, updated_at)
		VALUES (?, NULL, ?, ?, 'whatsapp', ?, ?, ?, ?, ?, 'active', NOW(), NOW())
	`
	// Note: widget_id is NULL for WhatsApp (and all non-web channels)
	// This is correct as per the schema - only web chat has widgets

	result, err := h.db.Exec(insertQuery, tenantID, websiteID, channelID, phoneNumber,
		senderName, visitorID, senderName, sessionKey)
	if err != nil {
		return 0, err
	}

	sessionID, _ = result.LastInsertId()
	return sessionID, nil
}

// saveMessage saves a chat message
func (h *WhatsAppHandler) saveMessage(sessionID int64, senderType, senderName, body, channelMessageID, messageType string) error {
	metadata := map[string]interface{}{
		"message_type": messageType,
	}
	metadataJSON, _ := json.Marshal(metadata)

	query := `
		INSERT INTO chat_messages 
		(session_id, sender_type, sender_name, body, message_type, channel_message_id, channel_metadata, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
	`
	_, err := h.db.Exec(query, sessionID, senderType, senderName, body, messageType, channelMessageID, metadataJSON)
	return err
}

// handleAutoResponse generates and sends AI response
func (h *WhatsAppHandler) handleAutoResponse(sessionID, aiProfileID int64, phoneNumber, userMessage string, credentialsJSON []byte) {
	// TODO: Integrate with AI service to generate response
	// For now, send a simple auto-response

	response := "Thank you for your message! An agent will be with you shortly. 🤖"

	// Parse credentials
	var credentials map[string]interface{}
	json.Unmarshal(credentialsJSON, &credentials)

	phoneNumberID, _ := credentials["phone_number_id"].(string)
	accessToken, _ := credentials["access_token"].(string)

	if phoneNumberID == "" || accessToken == "" {
		log.Printf("Missing WhatsApp credentials for auto-response")
		return
	}

	// Send message
	err := h.whatsappService.SendTextMessage(phoneNumberID, accessToken, phoneNumber, response)
	if err != nil {
		log.Printf("Error sending WhatsApp auto-response: %v", err)
		return
	}

	// Save agent message
	h.saveMessage(sessionID, "agent", "AI Assistant", response, "", "text")
	log.Printf("Auto-response sent to %s", phoneNumber)
}

// SendMessage sends a message to WhatsApp (called by agent)
// POST /api/v1/channels/whatsapp/send
func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	tenantID := c.GetString("tenant_id")

	var req struct {
		SessionID int64  `json:"session_id" binding:"required"`
		Message   string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get session and channel info
	var channelID int64
	var phoneNumber string
	var credentialsJSON []byte

	query := `
		SELECT cs.channel_connection_id, cs.channel_user_id, cc.credentials
		FROM chat_sessions cs
		JOIN channel_connections cc ON cc.id = cs.channel_connection_id
		WHERE cs.id = ? AND cs.tenant_id = ? AND cc.channel_type = 'whatsapp'
	`
	err := h.db.QueryRow(query, req.SessionID, tenantID).Scan(&channelID, &phoneNumber, &credentialsJSON)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Parse credentials
	var credentials map[string]interface{}
	json.Unmarshal(credentialsJSON, &credentials)

	phoneNumberID, _ := credentials["phone_number_id"].(string)
	accessToken, _ := credentials["access_token"].(string)

	// Send message via WhatsApp
	err = h.whatsappService.SendTextMessage(phoneNumberID, accessToken, phoneNumber, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Save message
	agentName := c.GetString("user_name")
	h.saveMessage(req.SessionID, "agent", agentName, req.Message, "", "text")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Message sent successfully",
	})
}
