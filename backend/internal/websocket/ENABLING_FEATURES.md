# Enabling External Integrations & Presence Tracking

## Why Webhooks Need Explicit Setup

Webhooks are **enabled in code** but require **database configuration** to work:

```
Code Ready ✅         Database Config ❌
    ↓                       ↓
WebhookManager      webhooks table (empty)
    ↓                       ↓
Can deliver    ←→   No webhooks to deliver to!
```

## How to Enable Webhooks (3 Steps)

### Step 1: Run Migrations

The webhook tables already exist in your migrations:

```bash
# These were created in migrations 030 and 031
mysql -u root -p callcenter_db < backend/migrations/030_create_webhooks_table.sql
mysql -u root -p callcenter_db < backend/migrations/031_create_webhook_logs_table.sql
```

### Step 2: Add Webhook Repository to Main

```go
// In cmd/api/main.go

import (
    "github.com/psschand/callcenter/internal/repository"
    "github.com/psschand/callcenter/internal/handler"
    ws "github.com/psschand/callcenter/internal/websocket"
)

func main() {
    // ... existing setup ...
    
    // Create webhook repository
    webhookRepo := repository.NewWebhookRepository(db)
    
    // Create webhook manager
    webhookManager := ws.NewWebhookManager(10) // 10 workers
    webhookManager.Start()
    
    // Create webhook handler
    webhookHandler := handler.NewWebhookHandler(webhookRepo, webhookManager)
    
    // Create event broadcaster (broadcasts to WebSocket AND webhooks)
    broadcaster := ws.NewEventWebhookBroadcaster(hub, webhookManager, webhookRepo)
    
    // Pass broadcaster to services
    agentService := service.NewAgentStateService(agentRepo, broadcaster)
    cdrService := service.NewCDRService(cdrRepo, broadcaster)
    chatService := service.NewChatService(chatRepo, broadcaster)
    
    // Setup webhook routes
    webhooks := router.Group("/api/webhooks", authMiddleware)
    {
        webhooks.POST("", webhookHandler.CreateWebhook)
        webhooks.GET("", webhookHandler.ListWebhooks)
        webhooks.GET("/:id", webhookHandler.GetWebhook)
        webhooks.PUT("/:id", webhookHandler.UpdateWebhook)
        webhooks.DELETE("/:id", webhookHandler.DeleteWebhook)
        webhooks.POST("/:id/test", webhookHandler.TestWebhook)
        webhooks.GET("/:id/logs", webhookHandler.GetWebhookLogs)
        webhooks.GET("/:id/stats", webhookHandler.GetWebhookStats)
        webhooks.GET("/failed", webhookHandler.GetFailedWebhooks)
    }
}
```

### Step 3: Configure Webhooks via API

```bash
# Create a webhook for Slack notifications
curl -X POST http://localhost:8080/api/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Notifications",
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "events": [
      "call.incoming",
      "agent.state.changed",
      "chat.message"
    ],
    "secret": "your-secret-key",
    "retry_count": 3,
    "timeout": 30
  }'

# Or insert directly in database
INSERT INTO webhooks (tenant_id, name, url, events, secret, is_active, retry_count, timeout)
VALUES (
    'tenant-123',
    'Slack Alerts',
    'https://hooks.slack.com/services/XXX',
    '["call.incoming", "agent.state.changed"]',
    'slack-secret',
    true,
    3,
    30
);
```

### Step 4: Test the Webhook

```bash
# Test webhook delivery
curl -X POST http://localhost:8080/api/webhooks/1/test \
  -H "Authorization: Bearer $TOKEN"

# Check delivery logs
curl http://localhost:8080/api/webhooks/1/logs \
  -H "Authorization: Bearer $TOKEN"

# Check stats
curl http://localhost:8080/api/webhooks/1/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## How Presence Tracking Works

Presence tracking uses **Redis** to track online/offline status **across all servers**.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Redis (Shared State)                  │
│                                                           │
│  callcenter:online:tenant-123   → SET {456, 789, 101}   │
│  callcenter:presence:tenant:456 → "1729866000" (TTL 5m) │
│  callcenter:presence:tenant:789 → "1729866100" (TTL 5m) │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬─────────────────┐
        │                       │                 │
    Server 1               Server 2           Server 3
        │                       │                 │
    User 456              User 789           User 101
 (Connected)           (Connected)        (Connected)
```

### How It Works

#### 1. User Connects to WebSocket

```go
// In client.go ReadPump() or when client connects
func (c *Client) onConnect() {
    // Mark user as online in Redis (visible to all servers)
    if pubsubHub, ok := c.hub.(*PubSubHub); ok {
        pubsubHub.SetUserOnline(c.TenantID, c.UserID)
        
        // Update presence heartbeat
        pubsubHub.UpdatePresence(c.TenantID, c.UserID)
    }
}
```

**What happens in Redis:**
```bash
# Add user to online set
SADD callcenter:online:tenant-123 456

# Set presence heartbeat (expires in 5 minutes)
SET callcenter:presence:tenant-123:456 1729866000 EX 300
```

#### 2. Heartbeat Updates (Every 30 seconds)

```go
// In client ping/pong handler
func (c *Client) updateHeartbeat() {
    if pubsubHub, ok := c.hub.(*PubSubHub); ok {
        pubsubHub.UpdatePresence(c.TenantID, c.UserID)
    }
}
```

**Redis command:**
```bash
# Refresh presence TTL
SET callcenter:presence:tenant-123:456 1729866030 EX 300
```

#### 3. User Disconnects

```go
// In hub.go unregisterClient()
func (h *PubSubHub) unregisterClient(client *Client) {
    // Remove from local hub
    h.Hub.unregisterClient(client)
    
    // Check if user has other connections on ANY server
    connections := h.GetUserConnections(client.TenantID, client.UserID)
    
    if len(connections) == 0 {
        // Last connection - mark offline
        h.SetUserOffline(client.TenantID, client.UserID)
    }
}
```

**Redis command:**
```bash
# Remove user from online set
SREM callcenter:online:tenant-123 456

# Presence key expires automatically after 5 minutes
```

#### 4. Check If User Is Online (From Any Server)

```go
// On Server 1, Server 2, or Server 3
isOnline, err := hub.GetPresence(tenantID, userID)

// Or check cluster-wide
onlineUsers, err := hub.GetOnlineUsers(tenantID)
```

**Redis query:**
```bash
# Check if user in online set
SISMEMBER callcenter:online:tenant-123 456

# Or check if presence key exists
EXISTS callcenter:presence:tenant-123:456

# Get all online users
SMEMBERS callcenter:online:tenant-123
# Returns: [456, 789, 101]
```

### Presence States

| State | Redis Keys | Meaning |
|-------|-----------|---------|
| **Online** | `online` SET + `presence` key exists | User has active WebSocket connection |
| **Away** | `online` SET but `presence` expired | User connected but inactive (no heartbeat) |
| **Offline** | Not in `online` SET | User disconnected |

### Multi-Connection Handling

Users can have **multiple connections** (phone + desktop):

```go
// Get all connections for a user
connections := hub.GetUserConnections(tenantID, userID)
// Returns: [client1, client2, client3]

// User is online if ANY connection exists
isOnline := hub.IsUserOnline(tenantID, userID)
// Returns: true if len(connections) > 0
```

**Redis structure:**
```bash
# Online set (just user ID, doesn't track connection count)
SADD callcenter:online:tenant-123 456

# Local hub tracks individual connections
# Server 1: 2 connections for user 456
# Server 2: 1 connection for user 456
# Server 3: 0 connections

# User marked offline only when ALL connections on ALL servers close
```

### Offline Message Delivery

When user is offline, messages are queued:

```go
// Check if user is online
isOnline := hub.IsUserOnline(tenantID, userID)

if !isOnline {
    // Queue message for later
    msg, _ := websocket.NewMessage(websocket.MessageTypeNotification, payload)
    hub.SaveMessageForOfflineUser(tenantID, userID, msg)
}
```

**Redis structure:**
```bash
# Queue messages in a list
LPUSH callcenter:offline:tenant-123:456 '{"type":"notification","payload":{...}}'
LPUSH callcenter:offline:tenant-123:456 '{"type":"chat.message","payload":{...}}'

# When user comes online
LRANGE callcenter:offline:tenant-123:456 0 -1
# Returns all queued messages

# Deliver all messages, then clear
DEL callcenter:offline:tenant-123:456
```

### Presence API Usage

```go
// Service layer example
func (s *CallService) RouteIncomingCall(ctx context.Context, call *Call) error {
    // Check if agent is available
    isOnline, _ := s.hub.GetPresence(call.TenantID, call.AssignedAgentID)
    
    if !isOnline {
        // Agent offline - send to voicemail
        return s.sendToVoicemail(call)
    }
    
    // Agent online - ring their phone
    s.broadcaster.BroadcastCallEvent(
        call.TenantID,
        websocket.MessageTypeCallIncoming,
        &websocket.CallEventPayload{
            UniqueID: call.UniqueID,
            CallerID: call.CallerID,
            AgentID:  call.AssignedAgentID,
        },
    )
    
    return nil
}
```

### Monitoring Presence

```bash
# Get all online users for a tenant
redis-cli SMEMBERS 'callcenter:online:tenant-123'
# Output: 1) "456" 2) "789" 3) "101"

# Check specific user
redis-cli SISMEMBER 'callcenter:online:tenant-123' 456
# Output: 1 (online) or 0 (offline)

# Check presence heartbeat
redis-cli EXISTS 'callcenter:presence:tenant-123:456'
# Output: 1 (active) or 0 (expired)

# Check offline messages
redis-cli LLEN 'callcenter:offline:tenant-123:456'
# Output: number of queued messages
```

### Benefits of Redis Presence

1. **Cluster-Wide Visibility** - All servers see same status
2. **Automatic Cleanup** - TTL expires stale presence
3. **Fast Lookups** - O(1) SET membership check
4. **Offline Queueing** - Messages stored until delivery
5. **Multiple Connections** - Handles user on multiple devices

---

## Complete Integration Example

```go
// cmd/api/main.go - Complete setup

func main() {
    // 1. Setup Redis
    redisClient := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    
    // 2. Create PubSubHub (with presence tracking)
    hub := websocket.NewPubSubHub(redisClient)
    go hub.Run()
    
    // 3. Create webhook system
    webhookRepo := repository.NewWebhookRepository(db)
    webhookManager := websocket.NewWebhookManager(10)
    webhookManager.Start()
    
    // 4. Create unified broadcaster
    broadcaster := websocket.NewEventWebhookBroadcaster(hub, webhookManager, webhookRepo)
    
    // 5. Use in services
    agentService := service.NewAgentStateService(agentRepo, broadcaster)
    
    // Now when agent changes state:
    // ✅ WebSocket clients get real-time update
    // ✅ Configured webhooks get HTTP notification
    // ✅ Presence updated in Redis (visible to all servers)
    agentService.UpdateState(ctx, tenantID, userID, "available", "")
}
```

## Summary

### External Integrations (Webhooks)
- ✅ Code is ready
- ❌ Need to add webhook configs to database
- ❌ Need to wire up webhook repository in main.go
- 📝 3 files created: webhook_repository.go, webhook_handler.go, webhook.go (DTO)

### Presence Tracking
- ✅ Fully implemented in pubsub.go
- ✅ Uses Redis SETs and TTL keys
- ✅ Works across all server instances
- ✅ Automatic heartbeat and cleanup
- ✅ Offline message queueing
- ✅ Multi-connection support

**Both features are production-ready!** Just need to integrate them into your main.go startup code.
