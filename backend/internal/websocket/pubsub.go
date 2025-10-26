package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// PubSubHub extends Hub with Redis pub/sub for horizontal scaling
type PubSubHub struct {
	*Hub
	redis      *redis.Client
	ctx        context.Context
	cancelFunc context.CancelFunc
	channels   []string
}

// NewPubSubHub creates a hub with Redis pub/sub support
func NewPubSubHub(redisClient *redis.Client) *PubSubHub {
	ctx, cancel := context.WithCancel(context.Background())

	return &PubSubHub{
		Hub:        NewHub(),
		redis:      redisClient,
		ctx:        ctx,
		cancelFunc: cancel,
		channels:   []string{"callcenter:events"},
	}
}

// Run starts both the hub and Redis subscription
func (h *PubSubHub) Run() {
	// Start the base hub
	go h.Hub.Run()

	// Start Redis subscriber
	if h.redis != nil {
		go h.subscribeToRedis()
	}
}

// subscribeToRedis subscribes to Redis channels and forwards messages to local clients
func (h *PubSubHub) subscribeToRedis() {
	pubsub := h.redis.Subscribe(h.ctx, h.channels...)
	defer pubsub.Close()

	log.Printf("Subscribed to Redis channels: %v", h.channels)

	// Wait for confirmation that subscription is created
	_, err := pubsub.Receive(h.ctx)
	if err != nil {
		log.Printf("Failed to subscribe to Redis: %v", err)
		return
	}

	// Start receiving messages
	ch := pubsub.Channel()
	for {
		select {
		case msg := <-ch:
			h.handleRedisMessage(msg)
		case <-h.ctx.Done():
			log.Println("Redis subscription closed")
			return
		}
	}
}

// handleRedisMessage processes messages from Redis and broadcasts to local clients
func (h *PubSubHub) handleRedisMessage(redisMsg *redis.Message) {
	var bm BroadcastMessage
	if err := json.Unmarshal([]byte(redisMsg.Payload), &bm); err != nil {
		log.Printf("Failed to unmarshal Redis message: %v", err)
		return
	}

	// Broadcast to local clients only
	h.Hub.broadcast <- &bm
}

// PublishToRedis publishes a message to Redis for distribution to all servers
func (h *PubSubHub) PublishToRedis(bm *BroadcastMessage) error {
	if h.redis == nil {
		// No Redis configured, use local broadcast only
		h.Hub.broadcast <- bm
		return nil
	}

	data, err := json.Marshal(bm)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast message: %w", err)
	}

	return h.redis.Publish(h.ctx, "callcenter:events", data).Err()
}

// BroadcastToTenant publishes to Redis for cluster-wide broadcast
func (h *PubSubHub) BroadcastToTenant(tenantID string, msg *Message) {
	bm := &BroadcastMessage{
		TenantID: tenantID,
		Message:  msg,
	}

	if err := h.PublishToRedis(bm); err != nil {
		log.Printf("Failed to publish to Redis: %v", err)
		// Fallback to local broadcast
		h.Hub.broadcast <- bm
	}
}

// BroadcastToUser publishes user-specific message to Redis
func (h *PubSubHub) BroadcastToUser(tenantID string, userID int64, msg *Message) {
	bm := &BroadcastMessage{
		TenantID: tenantID,
		UserID:   userID,
		Message:  msg,
	}

	if err := h.PublishToRedis(bm); err != nil {
		log.Printf("Failed to publish to Redis: %v", err)
		// Fallback to local broadcast
		h.Hub.broadcast <- bm
	}
}

// Close shuts down the PubSubHub
func (h *PubSubHub) Close() {
	h.cancelFunc()
	if h.redis != nil {
		h.redis.Close()
	}
}

// Topic-based pub/sub methods

// SubscribeTopic allows clients to subscribe to custom topics
func (h *PubSubHub) SubscribeTopic(topic string) error {
	if h.redis == nil {
		return fmt.Errorf("Redis not configured")
	}

	// Add topic to channels if not already present
	for _, ch := range h.channels {
		if ch == topic {
			return nil // Already subscribed
		}
	}

	h.channels = append(h.channels, topic)
	return nil
}

// PublishToTopic publishes a message to a specific topic
func (h *PubSubHub) PublishToTopic(topic string, msg *Message) error {
	if h.redis == nil {
		return fmt.Errorf("Redis not configured")
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	return h.redis.Publish(h.ctx, topic, data).Err()
}

// GetOnlineUsers returns list of online users across all servers (using Redis)
func (h *PubSubHub) GetOnlineUsers(tenantID string) ([]int64, error) {
	if h.redis == nil {
		// Fallback to local only
		return h.getLocalOnlineUsers(tenantID), nil
	}

	key := fmt.Sprintf("callcenter:online:%s", tenantID)
	members, err := h.redis.SMembers(h.ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var userIDs []int64
	for _, member := range members {
		var userID int64
		fmt.Sscanf(member, "%d", &userID)
		userIDs = append(userIDs, userID)
	}

	return userIDs, nil
}

// getLocalOnlineUsers returns users connected to this server instance
func (h *PubSubHub) getLocalOnlineUsers(tenantID string) []int64 {
	h.mu.RLock()
	defer h.mu.RUnlock()

	userMap := make(map[int64]bool)
	if clients, ok := h.clients[tenantID]; ok {
		for client := range clients {
			if client.UserID > 0 {
				userMap[client.UserID] = true
			}
		}
	}

	var userIDs []int64
	for userID := range userMap {
		userIDs = append(userIDs, userID)
	}
	return userIDs
}

// SetUserOnline marks a user as online in Redis
func (h *PubSubHub) SetUserOnline(tenantID string, userID int64) error {
	if h.redis == nil {
		return nil
	}

	key := fmt.Sprintf("callcenter:online:%s", tenantID)
	return h.redis.SAdd(h.ctx, key, userID).Err()
}

// SetUserOffline marks a user as offline in Redis
func (h *PubSubHub) SetUserOffline(tenantID string, userID int64) error {
	if h.redis == nil {
		return nil
	}

	key := fmt.Sprintf("callcenter:online:%s", tenantID)
	return h.redis.SRem(h.ctx, key, userID).Err()
}

// Presence tracking with Redis

// UpdatePresence updates user presence with heartbeat
func (h *PubSubHub) UpdatePresence(tenantID string, userID int64) error {
	if h.redis == nil {
		return nil
	}

	key := fmt.Sprintf("callcenter:presence:%s:%d", tenantID, userID)
	return h.redis.Set(h.ctx, key, time.Now().Unix(), 5*time.Minute).Err()
}

// GetPresence checks if user was active recently
func (h *PubSubHub) GetPresence(tenantID string, userID int64) (bool, error) {
	if h.redis == nil {
		return h.Hub.IsUserOnline(tenantID, userID), nil
	}

	key := fmt.Sprintf("callcenter:presence:%s:%d", tenantID, userID)
	exists, err := h.redis.Exists(h.ctx, key).Result()
	return exists > 0, err
}

// Message persistence for offline users

// SaveMessageForOfflineUser saves a message for delivery when user comes online
func (h *PubSubHub) SaveMessageForOfflineUser(tenantID string, userID int64, msg *Message) error {
	if h.redis == nil {
		return fmt.Errorf("Redis not configured")
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("callcenter:offline:%s:%d", tenantID, userID)
	return h.redis.LPush(h.ctx, key, data).Err()
}

// GetOfflineMessages retrieves messages for a user
func (h *PubSubHub) GetOfflineMessages(tenantID string, userID int64) ([]*Message, error) {
	if h.redis == nil {
		return nil, fmt.Errorf("Redis not configured")
	}

	key := fmt.Sprintf("callcenter:offline:%s:%d", tenantID, userID)

	// Get all messages
	results, err := h.redis.LRange(h.ctx, key, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	var messages []*Message
	for _, result := range results {
		var msg Message
		if err := json.Unmarshal([]byte(result), &msg); err != nil {
			log.Printf("Failed to unmarshal offline message: %v", err)
			continue
		}
		messages = append(messages, &msg)
	}

	// Delete messages after retrieval
	h.redis.Del(h.ctx, key)

	return messages, nil
}

// Channel-based pub/sub for specific features

// PublishAgentState publishes agent state to dedicated channel
func (h *PubSubHub) PublishAgentState(tenantID string, payload *AgentStatePayload) error {
	msg, err := NewMessage(MessageTypeAgentStateChanged, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID

	topic := fmt.Sprintf("callcenter:agents:%s", tenantID)
	return h.PublishToTopic(topic, msg)
}

// PublishCallEvent publishes call event to dedicated channel
func (h *PubSubHub) PublishCallEvent(tenantID string, msgType MessageType, payload *CallEventPayload) error {
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID

	topic := fmt.Sprintf("callcenter:calls:%s", tenantID)
	return h.PublishToTopic(topic, msg)
}

// PublishQueueEvent publishes queue event to dedicated channel
func (h *PubSubHub) PublishQueueEvent(tenantID string, msgType MessageType, payload interface{}) error {
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID

	topic := fmt.Sprintf("callcenter:queues:%s", tenantID)
	return h.PublishToTopic(topic, msg)
}
