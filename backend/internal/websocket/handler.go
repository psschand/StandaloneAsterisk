package websocket

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Implement proper origin checking in production
		return true
	},
}

// Handler handles WebSocket connection requests
type Handler struct {
	hub *Hub
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *Hub) *Handler {
	return &Handler{
		hub: hub,
	}
}

// HandleWebSocket handles WebSocket upgrade requests
func (h *Handler) HandleWebSocket(c *gin.Context) {
	// Get tenant and user from context (set by auth middleware)
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing tenant context"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing user context"})
		return
	}

	role, _ := c.Get("role")
	roleStr, ok := role.(string)
	if !ok {
		roleStr = "agent"
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}

	// Create new client
	client := NewClient(
		conn,
		h.hub,
		tenantID.(string),
		userID.(int64),
		roleStr,
	)

	// Register client with hub
	h.hub.register <- client

	// Start client goroutines
	go client.WritePump()
	go client.ReadPump()
}

// HandleWebSocketPublic handles public WebSocket connections (for chat widgets)
func (h *Handler) HandleWebSocketPublic(c *gin.Context) {
	// Get widget key from query params
	widgetKey := c.Query("widget_key")
	if widgetKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing widget_key"})
		return
	}

	sessionKey := c.Query("session_key")
	if sessionKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing session_key"})
		return
	}

	// TODO: Validate widget_key and get tenant_id from database
	// For now, using a placeholder
	tenantID := "public_" + widgetKey

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}

	// Create new client for visitor (userID = 0 for visitors)
	client := NewClient(
		conn,
		h.hub,
		tenantID,
		0,
		"visitor",
	)

	// Subscribe to chat events only
	client.Subscribe(
		MessageTypeChatMessage,
		MessageTypeChatSessionStarted,
		MessageTypeChatSessionEnded,
		MessageTypeChatTyping,
	)

	// Register client with hub
	h.hub.register <- client

	// Start client goroutines
	go client.WritePump()
	go client.ReadPump()
}

// HandleStats returns WebSocket connection statistics
func (h *Handler) HandleStats(c *gin.Context) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing tenant context"})
		return
	}

	stats := gin.H{
		"tenant_connections": h.hub.GetClientCount(tenantID.(string)),
		"total_connections":  h.hub.GetTotalClientCount(),
	}

	c.JSON(http.StatusOK, stats)
}

// HandleUserOnline checks if a user is online
func (h *Handler) HandleUserOnline(c *gin.Context) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing tenant context"})
		return
	}

	userIDParam := c.Param("user_id")
	var userID int64
	if _, err := fmt.Sscanf(userIDParam, "%d", &userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	isOnline := h.hub.IsUserOnline(tenantID.(string), userID)
	connections := h.hub.GetUserConnections(tenantID.(string), userID)

	c.JSON(http.StatusOK, gin.H{
		"user_id":          userID,
		"is_online":        isOnline,
		"connection_count": len(connections),
	})
}

// GetHub returns the hub instance
func (h *Handler) GetHub() *Hub {
	return h.hub
}
