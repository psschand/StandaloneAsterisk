package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512 * 1024 // 512KB
)

// Client represents a WebSocket client connection
type Client struct {
	// WebSocket connection
	conn *websocket.Conn

	// Hub that manages this client
	hub *Hub

	// Buffered channel of outbound messages
	send chan []byte

	// Client metadata
	ID       string
	TenantID string
	UserID   int64
	Role     string

	// Subscribed event types
	subscriptions map[MessageType]bool
	subMutex      sync.RWMutex

	// Connection state
	isAlive bool
	mu      sync.RWMutex
}

// NewClient creates a new WebSocket client
func NewClient(conn *websocket.Conn, hub *Hub, tenantID string, userID int64, role string) *Client {
	return &Client{
		conn:          conn,
		hub:           hub,
		send:          make(chan []byte, 256),
		ID:            generateClientID(tenantID, userID),
		TenantID:      tenantID,
		UserID:        userID,
		Role:          role,
		subscriptions: make(map[MessageType]bool),
		isAlive:       true,
	}
}

// generateClientID generates a unique client ID
func generateClientID(tenantID string, userID int64) string {
	return tenantID + "_" + string(rune(userID)) + "_" + time.Now().Format("20060102150405")
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Parse incoming message
		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Failed to parse WebSocket message: %v", err)
			continue
		}

		// Handle specific message types
		c.handleIncomingMessage(&msg)
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleIncomingMessage handles messages received from the client
func (c *Client) handleIncomingMessage(msg *Message) {
	switch msg.Type {
	case MessageTypePing:
		// Respond with pong
		c.SendMessage(MessageTypePong, nil)

	case MessageTypeSubscribe:
		var payload SubscribePayload
		if err := msg.ParsePayload(&payload); err != nil {
			log.Printf("Failed to parse subscribe payload: %v", err)
			return
		}
		c.Subscribe(payload.Events...)

	case MessageTypeUnsubscribe:
		var payload SubscribePayload
		if err := msg.ParsePayload(&payload); err != nil {
			log.Printf("Failed to parse unsubscribe payload: %v", err)
			return
		}
		c.Unsubscribe(payload.Events...)

	case MessageTypeChatTyping:
		// Broadcast typing indicator to other clients in the same session
		c.hub.BroadcastToTenant(c.TenantID, msg)

	default:
		log.Printf("Unhandled message type: %s", msg.Type)
	}
}

// SendMessage sends a message to the client
func (c *Client) SendMessage(msgType MessageType, payload interface{}) error {
	msg, err := NewMessageWithContext(msgType, payload, c.TenantID, c.UserID)
	if err != nil {
		return err
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	// Non-blocking send
	select {
	case c.send <- msgBytes:
	default:
		log.Printf("Client %s send buffer full, dropping message", c.ID)
	}

	return nil
}

// SendRaw sends raw bytes to the client
func (c *Client) SendRaw(data []byte) {
	select {
	case c.send <- data:
	default:
		log.Printf("Client %s send buffer full, dropping message", c.ID)
	}
}

// Subscribe subscribes the client to specific event types
func (c *Client) Subscribe(events ...MessageType) {
	c.subMutex.Lock()
	defer c.subMutex.Unlock()

	for _, event := range events {
		c.subscriptions[event] = true
	}

	log.Printf("Client %s subscribed to events: %v", c.ID, events)
}

// Unsubscribe unsubscribes the client from specific event types
func (c *Client) Unsubscribe(events ...MessageType) {
	c.subMutex.Lock()
	defer c.subMutex.Unlock()

	for _, event := range events {
		delete(c.subscriptions, event)
	}

	log.Printf("Client %s unsubscribed from events: %v", c.ID, events)
}

// IsSubscribed checks if the client is subscribed to an event type
func (c *Client) IsSubscribed(msgType MessageType) bool {
	c.subMutex.RLock()
	defer c.subMutex.RUnlock()

	// If no subscriptions, receive all messages
	if len(c.subscriptions) == 0 {
		return true
	}

	return c.subscriptions[msgType]
}

// IsAlive returns whether the client connection is alive
func (c *Client) IsAlive() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.isAlive
}

// SetAlive sets the alive state of the client
func (c *Client) SetAlive(alive bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.isAlive = alive
}

// Close closes the client connection
func (c *Client) Close() {
	c.SetAlive(false)
	close(c.send)
}
