# Pub/Sub and Webhook Support

## Overview

The WebSocket package now supports:
1. **Redis Pub/Sub** - For horizontal scaling across multiple servers
2. **Webhooks** - For HTTP-based event notifications to external systems

---

## Redis Pub/Sub

### Features

✅ **Horizontal Scaling** - Multiple server instances share events via Redis  
✅ **Topic-Based** - Subscribe to specific topics/channels  
✅ **Presence Tracking** - Track online users across all servers  
✅ **Message Persistence** - Store messages for offline users  
✅ **Cluster Support** - Works with Redis Cluster  

### Setup

```go
import (
    "github.com/redis/go-redis/v9"
    "github.com/psschand/callcenter/internal/websocket"
)

// Create Redis client
redisClient := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "",
    DB:       0,
})

// Create PubSubHub
hub := websocket.NewPubSubHub(redisClient)
go hub.Run()

// Use like regular hub
broadcaster := websocket.NewEventBroadcaster(hub)
broadcaster.AgentStateChange(tenantID, userID, username, "available", "")
```

### How It Works

```
Server 1                  Redis                   Server 2
   |                        |                        |
   |-- Publish Event ------>|                        |
   |                        |-- Distribute --------->|
   |                        |                        |
   |<-- Subscribe Events ---|<-- Subscribe Events ---|
   |                        |                        |
   |-- WebSocket Clients    |    WebSocket Clients --|
```

### Topic-Based Pub/Sub

```go
// Subscribe to custom topic
hub.SubscribeTopic("callcenter:custom:alerts")

// Publish to topic
msg, _ := websocket.NewMessage(websocket.MessageTypeAlert, payload)
hub.PublishToTopic("callcenter:custom:alerts", msg)

// Automatic topic routing
hub.PublishAgentState(tenantID, payload)  // -> callcenter:agents:{tenant}
hub.PublishCallEvent(tenantID, msgType, payload)  // -> callcenter:calls:{tenant}
hub.PublishQueueEvent(tenantID, msgType, payload) // -> callcenter:queues:{tenant}
```

### Presence Tracking

```go
// Mark user online (called when WebSocket connects)
hub.SetUserOnline(tenantID, userID)

// Mark user offline (called when WebSocket disconnects)
hub.SetUserOffline(tenantID, userID)

// Get all online users across all servers
onlineUsers, err := hub.GetOnlineUsers(tenantID)

// Check if specific user is online (with heartbeat check)
isOnline, err := hub.GetPresence(tenantID, userID)

// Update presence heartbeat (call periodically)
hub.UpdatePresence(tenantID, userID)
```

### Offline Message Persistence

```go
// Save message for offline user
msg, _ := websocket.NewMessage(websocket.MessageTypeNotification, payload)
hub.SaveMessageForOfflineUser(tenantID, userID, msg)

// Retrieve offline messages when user connects
messages, err := hub.GetOfflineMessages(tenantID, userID)
for _, msg := range messages {
    client.SendMessage(msg.Type, msg.Payload)
}
```

### Redis Keys Used

- `callcenter:events` - Main event broadcast channel
- `callcenter:agents:{tenant}` - Agent state events
- `callcenter:calls:{tenant}` - Call events
- `callcenter:queues:{tenant}` - Queue events
- `callcenter:online:{tenant}` - Set of online user IDs
- `callcenter:presence:{tenant}:{user}` - User presence heartbeat
- `callcenter:offline:{tenant}:{user}` - List of offline messages

---

## Webhooks

### Features

✅ **HTTP POST Delivery** - Send events to external URLs  
✅ **HMAC Signatures** - Secure payload verification  
✅ **Automatic Retries** - Configurable retry with exponential backoff  
✅ **Event Filtering** - Subscribe to specific event types  
✅ **Delivery Logs** - Track success/failure of deliveries  
✅ **Concurrent Workers** - Multiple parallel webhook deliveries  

### Setup

```go
// Create webhook manager
webhookManager := websocket.NewWebhookManager(10) // 10 workers
webhookManager.Start()

// Create repository (implement this interface)
type webhookRepo struct {
    db *gorm.DB
}

func (r *webhookRepo) GetWebhooksByEvent(ctx context.Context, tenantID string, event MessageType) ([]*WebhookConfig, error) {
    var webhooks []*WebhookConfig
    err := r.db.Where("tenant_id = ? AND is_active = ? AND JSON_CONTAINS(events, ?)", 
        tenantID, true, fmt.Sprintf(`"%s"`, event)).Find(&webhooks).Error
    return webhooks, err
}

// Create combined broadcaster
broadcaster := websocket.NewEventWebhookBroadcaster(hub, webhookManager, webhookRepo)

// Events now go to both WebSocket AND webhooks
broadcaster.BroadcastAgentState(tenantID, payload)
broadcaster.BroadcastCallEvent(tenantID, msgType, payload)
```

### Webhook Configuration

Webhooks are configured in the `webhooks` table:

```sql
INSERT INTO webhooks (tenant_id, name, url, events, secret, is_active, retry_count, timeout)
VALUES (
    'tenant-123',
    'Slack Notifications',
    'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    '["call.incoming", "agent.state.changed", "chat.message"]',
    'your-secret-key',
    true,
    3,
    30
);
```

### Webhook Payload Format

```json
{
  "event": "call.incoming",
  "timestamp": 1729866000,
  "data": {
    "unique_id": "1729866000.123",
    "caller_id": "+1234567890",
    "destination": "100",
    "queue_name": "support",
    "direction": "inbound"
  }
}
```

### Webhook Headers

```
Content-Type: application/json
User-Agent: CallCenter-Webhook/1.0
X-Webhook-Event: call.incoming
X-Webhook-ID: 42
X-Webhook-Attempt: 1
X-Webhook-Signature: abc123... (HMAC SHA256 if secret configured)
```

### Signature Verification

**Server-side (receiving webhook):**

```go
import (
    "io"
    "net/http"
    "github.com/psschand/callcenter/internal/websocket"
)

func handleWebhook(w http.ResponseWriter, r *http.Request) {
    // Read body
    body, _ := io.ReadAll(r.Body)
    
    // Get signature from header
    signature := r.Header.Get("X-Webhook-Signature")
    secret := "your-secret-key"
    
    // Verify signature
    if !websocket.VerifySignature(body, signature, secret) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    // Process webhook...
    w.WriteHeader(http.StatusOK)
}
```

**Client-side (Node.js example):**

```javascript
const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your-secret-key';
  
  // Calculate expected signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');
  
  // Verify
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Received event:', req.body.event);
  res.status(200).send('OK');
});
```

### Testing Webhooks

```go
// Test webhook endpoint
err := webhookManager.TestWebhook("https://example.com/webhook", "secret")
if err != nil {
    log.Printf("Webhook test failed: %v", err)
}
```

### Retry Logic

- **Attempt 1**: Immediate delivery
- **Attempt 2**: Wait 2 seconds, retry
- **Attempt 3**: Wait 4 seconds, retry
- **Attempt 4**: Wait 8 seconds, final attempt

Retries occur on:
- Network errors
- Connection timeouts
- HTTP 5xx status codes

No retries on:
- HTTP 4xx status codes (client errors)
- HTTP 2xx status codes (success)

### Webhook Delivery Logs

All deliveries are logged to `webhook_logs` table:

```sql
SELECT * FROM webhook_logs 
WHERE webhook_id = 42 
ORDER BY created_at DESC 
LIMIT 10;
```

Shows:
- Event type
- Payload sent
- Response code
- Response body
- Error message (if failed)
- Delivery duration
- Attempt number

---

## Combined Architecture

```
Application Event
        |
        v
EventWebhookBroadcaster
        |
        +----------+----------+
        |                     |
        v                     v
   WebSocket Hub        Webhook Manager
        |                     |
        v                     v
   Redis Pub/Sub        HTTP Workers
        |                     |
        v                     v
  All Servers           External APIs
        |                     |
        v                     v
  Connected Clients    Slack/Zapier/etc
```

---

## Use Cases

### 1. Multi-Server Deployment

```go
// Server 1
hub1 := websocket.NewPubSubHub(redisClient)
go hub1.Run()

// Server 2
hub2 := websocket.NewPubSubHub(redisClient)
go hub2.Run()

// Event published on Server 1 reaches clients on Server 2
hub1.BroadcastToTenant(tenantID, msg)
```

### 2. Integration with External Services

**Slack Notifications:**
```sql
INSERT INTO webhooks (tenant_id, name, url, events, is_active)
VALUES (
    'tenant-123',
    'Slack Alerts',
    'https://hooks.slack.com/services/XXX',
    '["call.incoming", "ticket.created"]',
    true
);
```

**Zapier Integration:**
```sql
INSERT INTO webhooks (tenant_id, name, url, events, is_active)
VALUES (
    'tenant-123',
    'Zapier Workflow',
    'https://hooks.zapier.com/hooks/catch/XXX',
    '["chat.session.started", "call.ended"]',
    true
);
```

**Custom CRM:**
```sql
INSERT INTO webhooks (tenant_id, name, url, events, secret, is_active)
VALUES (
    'tenant-123',
    'CRM Integration',
    'https://crm.example.com/api/webhooks/callcenter',
    '["call.incoming", "call.ended", "chat.message"]',
    'secure-secret-key',
    true
);
```

### 3. Presence and Online Status

```go
// Check if agent available across all servers
isOnline, _ := hub.GetPresence(tenantID, agentID)

if isOnline {
    // Route call to agent
} else {
    // Send to voicemail or queue
}
```

### 4. Offline Message Delivery

```go
// When important event occurs
if !hub.IsUserOnline(tenantID, userID) {
    // Save for later delivery
    msg, _ := websocket.NewMessage(websocket.MessageTypeNotification, payload)
    hub.SaveMessageForOfflineUser(tenantID, userID, msg)
}

// When user connects
messages, _ := hub.GetOfflineMessages(tenantID, userID)
for _, msg := range messages {
    client.SendRaw(msg)
}
```

---

## Dependencies

Add to `go.mod`:

```bash
go get github.com/redis/go-redis/v9
```

---

## Configuration

### Redis Configuration

```go
// Standalone Redis
redisClient := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "your-password",
    DB:       0,
})

// Redis Cluster
redisClient := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{
        "redis-1:6379",
        "redis-2:6379",
        "redis-3:6379",
    },
})

// Redis Sentinel
redisClient := redis.NewFailoverClient(&redis.FailoverOptions{
    MasterName:    "mymaster",
    SentinelAddrs: []string{"sentinel-1:26379", "sentinel-2:26379"},
})
```

### Webhook Configuration

```go
// Configure webhook manager
webhookManager := websocket.NewWebhookManager(10) // 10 concurrent workers

// Can be scaled up for high-volume deployments
webhookManager := websocket.NewWebhookManager(50) // 50 workers
```

---

## Monitoring

### Redis Monitoring

```bash
# Monitor Redis pub/sub
redis-cli PSUBSCRIBE 'callcenter:*'

# Check online users
redis-cli SMEMBERS 'callcenter:online:tenant-123'

# Check offline messages
redis-cli LLEN 'callcenter:offline:tenant-123:456'
```

### Webhook Monitoring

```sql
-- Failed webhooks in last hour
SELECT w.name, wl.event, wl.error, wl.created_at
FROM webhook_logs wl
JOIN webhooks w ON w.id = wl.webhook_id
WHERE wl.response_code >= 400 
  AND wl.created_at > NOW() - INTERVAL 1 HOUR
ORDER BY wl.created_at DESC;

-- Webhook success rate
SELECT 
    w.name,
    COUNT(*) as total_deliveries,
    SUM(CASE WHEN wl.response_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) as successful,
    ROUND(100.0 * SUM(CASE WHEN wl.response_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM webhook_logs wl
JOIN webhooks w ON w.id = wl.webhook_id
WHERE wl.created_at > NOW() - INTERVAL 24 HOUR
GROUP BY w.id, w.name;
```

---

## Performance Considerations

- **Redis Connection Pool**: Configure appropriate pool size for your load
- **Webhook Workers**: Scale workers based on webhook volume
- **Message TTL**: Set expiration on offline messages to prevent memory growth
- **Delivery Timeout**: Configure webhook timeout based on external service SLA
- **Rate Limiting**: Consider rate limiting webhook deliveries per tenant

---

## Security Best Practices

1. **Always use secrets** for webhook signatures
2. **Validate webhook URLs** before saving to prevent SSRF
3. **Use HTTPS** for webhook endpoints
4. **Rotate secrets** periodically
5. **Implement IP whitelisting** for webhook sources if possible
6. **Monitor failed webhooks** for potential attacks
7. **Use Redis AUTH** in production
8. **Encrypt sensitive data** in Redis if needed
