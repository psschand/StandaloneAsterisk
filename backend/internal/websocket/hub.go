package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients (keyed by tenant_id)
	clients map[string]map[*Client]bool
	mu      sync.RWMutex

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast messages to all clients in a tenant
	broadcast chan *BroadcastMessage
}

// BroadcastMessage represents a message to broadcast
type BroadcastMessage struct {
	TenantID string
	Message  *Message
	UserID   int64 // Optional: target specific user (0 = broadcast to all)
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *BroadcastMessage, 256),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastMessage(message)
		}
	}
}

// registerClient registers a new client
func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[client.TenantID] == nil {
		h.clients[client.TenantID] = make(map[*Client]bool)
	}
	h.clients[client.TenantID][client] = true

	log.Printf("Client registered: %s (Tenant: %s, User: %d, Total clients: %d)",
		client.ID, client.TenantID, client.UserID, h.countClients())
}

// unregisterClient unregisters a client
func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.clients[client.TenantID]; ok {
		if _, ok := clients[client]; ok {
			delete(clients, client)
			client.Close()

			// Clean up empty tenant maps
			if len(clients) == 0 {
				delete(h.clients, client.TenantID)
			}

			log.Printf("Client unregistered: %s (Tenant: %s, User: %d, Remaining clients: %d)",
				client.ID, client.TenantID, client.UserID, h.countClients())
		}
	}
}

// broadcastMessage broadcasts a message to relevant clients
func (h *Hub) broadcastMessage(bm *BroadcastMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients, ok := h.clients[bm.TenantID]
	if !ok {
		return
	}

	messageBytes, err := json.Marshal(bm.Message)
	if err != nil {
		log.Printf("Failed to marshal broadcast message: %v", err)
		return
	}

	for client := range clients {
		// Skip if user-specific and doesn't match
		if bm.UserID > 0 && client.UserID != bm.UserID {
			continue
		}

		// Check subscription
		if !client.IsSubscribed(bm.Message.Type) {
			continue
		}

		// Send message
		client.SendRaw(messageBytes)
	}
}

// countClients counts total connected clients
func (h *Hub) countClients() int {
	count := 0
	for _, clients := range h.clients {
		count += len(clients)
	}
	return count
}

// BroadcastToTenant broadcasts a message to all clients in a tenant
func (h *Hub) BroadcastToTenant(tenantID string, msg *Message) {
	h.broadcast <- &BroadcastMessage{
		TenantID: tenantID,
		Message:  msg,
	}
}

// BroadcastToUser sends a message to a specific user
func (h *Hub) BroadcastToUser(tenantID string, userID int64, msg *Message) {
	h.broadcast <- &BroadcastMessage{
		TenantID: tenantID,
		UserID:   userID,
		Message:  msg,
	}
}

// BroadcastAgentStateChange broadcasts agent state change event
func (h *Hub) BroadcastAgentStateChange(tenantID string, payload *AgentStatePayload) error {
	msg, err := NewMessage(MessageTypeAgentStateChanged, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToTenant(tenantID, msg)
	return nil
}

// BroadcastCallEvent broadcasts a call event
func (h *Hub) BroadcastCallEvent(tenantID string, msgType MessageType, payload *CallEventPayload) error {
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToTenant(tenantID, msg)
	return nil
}

// BroadcastQueueStats broadcasts queue statistics
func (h *Hub) BroadcastQueueStats(tenantID string, payload *QueueStatsPayload) error {
	msg, err := NewMessage(MessageTypeQueueStats, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToTenant(tenantID, msg)
	return nil
}

// BroadcastQueueMemberEvent broadcasts queue member event
func (h *Hub) BroadcastQueueMemberEvent(tenantID string, msgType MessageType, payload *QueueMemberPayload) error {
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToTenant(tenantID, msg)
	return nil
}

// BroadcastChatMessage broadcasts a chat message
func (h *Hub) BroadcastChatMessage(tenantID string, payload *ChatMessagePayload) error {
	msg, err := NewMessage(MessageTypeChatMessage, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToTenant(tenantID, msg)
	return nil
}

// BroadcastChatSessionEvent broadcasts a chat session event
func (h *Hub) BroadcastChatSessionEvent(tenantID string, msgType MessageType, payload *ChatSessionPayload) error {
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToTenant(tenantID, msg)
	return nil
}

// BroadcastNotification sends a notification to a specific user
func (h *Hub) BroadcastNotification(tenantID string, userID int64, payload *NotificationPayload) error {
	msg, err := NewMessage(MessageTypeNotification, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	h.BroadcastToUser(tenantID, userID, msg)
	return nil
}

// GetClientCount returns the number of connected clients for a tenant
func (h *Hub) GetClientCount(tenantID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.clients[tenantID]; ok {
		return len(clients)
	}
	return 0
}

// GetTotalClientCount returns the total number of connected clients
func (h *Hub) GetTotalClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.countClients()
}

// GetUserConnections returns all connections for a specific user
func (h *Hub) GetUserConnections(tenantID string, userID int64) []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var connections []*Client
	if clients, ok := h.clients[tenantID]; ok {
		for client := range clients {
			if client.UserID == userID {
				connections = append(connections, client)
			}
		}
	}
	return connections
}

// IsUserOnline checks if a user has any active connections
func (h *Hub) IsUserOnline(tenantID string, userID int64) bool {
	return len(h.GetUserConnections(tenantID, userID)) > 0
}
