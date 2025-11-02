package websocket

import (
	"encoding/json"
	"log"
	"time"
)

// HubAdapter adapts the Hub to work with the service layer
type HubAdapter struct {
	hub *Hub
}

// NewHubAdapter creates a new hub adapter
func NewHubAdapter(hub *Hub) *HubAdapter {
	return &HubAdapter{hub: hub}
}

// BroadcastToTenant broadcasts a message to all clients in a tenant
func (a *HubAdapter) BroadcastToTenant(tenantID string, messageType string, payload interface{}) {
	log.Printf("[HubAdapter] BroadcastToTenant called: tenant=%s, type=%s", tenantID, messageType)
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[HubAdapter] Error marshaling payload: %v", err)
		return
	}

	msg := &Message{
		Type:      MessageType(messageType),
		Payload:   json.RawMessage(payloadBytes),
		Timestamp: time.Now(),
	}

	log.Printf("[HubAdapter] Broadcasting message to hub for tenant: %s", tenantID)
	a.hub.BroadcastToTenant(tenantID, msg)
}

// BroadcastToUser broadcasts a message to a specific user
func (a *HubAdapter) BroadcastToUser(tenantID string, userID int64, messageType string, payload interface{}) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return
	}

	msg := &Message{
		Type:      MessageType(messageType),
		Payload:   json.RawMessage(payloadBytes),
		Timestamp: time.Now(),
	}

	a.hub.BroadcastToUser(tenantID, userID, msg)
}
