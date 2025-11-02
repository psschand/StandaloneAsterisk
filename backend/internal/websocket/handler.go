package websocket

import (
	"context"
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

// ChatSession is a simple struct to avoid import cycles
type ChatSession struct {
	ID       int64
	TenantID string
}

// ChatSessionGetter interface to avoid import cycle
type ChatSessionGetter interface {
	GetSessionByKey(ctx context.Context, sessionKey string) (*ChatSession, error)
}

// Handler handles WebSocket connection requests
type Handler struct {
	hub         *Hub
	chatService ChatSessionGetter
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *Hub, chatService ChatSessionGetter) *Handler {
	return &Handler{
		hub:         hub,
		chatService: chatService,
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

	// Create new client (agents don't have session filtering)
	client := NewClient(
		conn,
		h.hub,
		tenantID.(string),
		userID.(int64),
		roleStr,
		0, // sessionID = 0 for agents (see all sessions)
	)

	// Register client with hub
	h.hub.register <- client

	// Start client goroutines
	go client.WritePump()
	go client.ReadPump()
}

// HandleWebSocketPublic handles public WebSocket connections (for chat widgets)
func (h *Handler) HandleWebSocketPublic(c *gin.Context) {
	// Get session KEY from URL parameter (e.g., "session-1762087398688217608")
	sessionKey := c.Param("sessionId")
	if sessionKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing session_id"})
		return
	}

	// Get session from database to get tenant_id and numeric session ID
	session, err := h.chatService.GetSessionByKey(c.Request.Context(), sessionKey)
	if err != nil {
		log.Printf("Failed to get session %s: %v", sessionKey, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}

	log.Printf("[WebSocket] Public connection established for session %d (key: %s, tenant: %s)", session.ID, sessionKey, session.TenantID)

	// Create new client for visitor with session ID
	client := NewClient(
		conn,
		h.hub,
		session.TenantID,
		0, // userID = 0 for visitors
		"visitor",
		session.ID, // Pass session ID for message filtering
	)

	// Subscribe to chat events only
	client.Subscribe(
		MessageTypeChatMessage,
		MessageTypeChatMessageNew, // Subscribe to new messages
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
