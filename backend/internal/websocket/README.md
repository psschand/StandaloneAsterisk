# WebSocket Package

Real-time bidirectional communication for the Call Center application using WebSocket protocol.

## Overview

This package provides a complete WebSocket implementation for broadcasting real-time events to connected clients, including:

- **Agent State Changes** - Login/logout, availability, breaks
- **Call Events** - Incoming calls, answered, ended, transferred, hold/unhold
- **Queue Events** - Queue join/leave, member management, statistics
- **Chat Events** - Messages, sessions, typing indicators, transfers
- **Notifications** - User notifications and system alerts

## Architecture

### Components

1. **Hub** (`hub.go`) - Central message broker
   - Manages all client connections
   - Routes messages to appropriate clients
   - Maintains tenant isolation
   - Provides broadcast methods for different event types

2. **Client** (`client.go`) - WebSocket connection wrapper
   - Handles individual WebSocket connections
   - Manages read/write pumps
   - Supports event subscriptions
   - Implements ping/pong keepalive

3. **Message** (`message.go`) - Message types and payloads
   - Defines all message types and structures
   - Provides type-safe payload parsing
   - Includes helper functions for message creation

4. **Handler** (`handler.go`) - HTTP endpoint handlers
   - Upgrades HTTP connections to WebSocket
   - Handles authentication and authorization
   - Provides public endpoint for chat widgets
   - Exposes connection statistics

5. **EventBroadcaster** (`events.go`) - High-level event API
   - Convenience methods for broadcasting events
   - Type-safe event creation
   - Simplifies integration with services

## Usage

### Initialization

```go
// Create hub
hub := websocket.NewHub()

// Start hub in goroutine
go hub.Run()

// Create handler
wsHandler := websocket.NewHandler(hub)

// Create event broadcaster (for services)
broadcaster := websocket.NewEventBroadcaster(hub)
```

### Routing Setup

```go
// Protected WebSocket endpoint (requires authentication)
router.GET("/ws", authMiddleware, wsHandler.HandleWebSocket)

// Public WebSocket endpoint (for chat widgets)
router.GET("/ws/public", wsHandler.HandleWebSocketPublic)

// Statistics endpoint
router.GET("/ws/stats", authMiddleware, wsHandler.HandleStats)

// Check user online status
router.GET("/ws/users/:user_id/online", authMiddleware, wsHandler.HandleUserOnline)
```

### Broadcasting Events from Services

#### Agent State Events

```go
// Agent login
broadcaster.AgentLogin(tenantID, userID, username, extension)

// Agent state change
broadcaster.AgentStateChange(tenantID, userID, username, "break", "Lunch break")

// Agent logout
broadcaster.AgentLogout(tenantID, userID, username)
```

#### Call Events

```go
// Incoming call
broadcaster.CallIncoming(tenantID, uniqueID, callerID, destination, queueName)

// Call answered
broadcaster.CallAnswered(tenantID, uniqueID, agentID, agentName)

// Call ended
broadcaster.CallEnded(tenantID, uniqueID, duration)

// Call transferred
broadcaster.CallTransferred(tenantID, uniqueID, newDestination)
```

#### Queue Events

```go
// Queue member added
broadcaster.QueueMemberAdded(tenantID, queueName, userID, username, interface)

// Queue member paused
broadcaster.QueueMemberPaused(tenantID, queueName, userID, username)

// Update queue stats
stats := &websocket.QueueStatsPayload{
    CallsWaiting: 5,
    AvailableAgents: 3,
    LoggedInAgents: 10,
    // ... more stats
}
broadcaster.UpdateQueueStats(tenantID, queueName, stats)
```

#### Chat Events

```go
// Chat session started
broadcaster.ChatSessionStarted(tenantID, sessionID, visitorName, visitorEmail)

// Chat message sent
broadcaster.ChatMessageSent(tenantID, sessionID, messageID, senderID, 
    senderType, senderName, messageBody)

// Typing indicator
broadcaster.ChatTypingIndicator(tenantID, sessionID, "agent", "John Doe", true)

// Chat session ended
broadcaster.ChatSessionEnded(tenantID, sessionID)
```

#### Notifications

```go
// Send notification to specific user
broadcaster.SendNotification(tenantID, userID, "ticket_assigned", 
    "New Ticket Assigned", "Ticket #1234 has been assigned to you", 
    map[string]interface{}{"ticket_id": 1234})

// Broadcast alert to all users
broadcaster.SendAlert(tenantID, "System Maintenance", 
    "System will be down for maintenance in 30 minutes")
```

### Client-Side Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.example.com/ws');

// Handle connection open
ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Subscribe to specific events
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: {
      events: [
        'agent.state.changed',
        'call.incoming',
        'chat.message',
        'notification'
      ]
    }
  }));
};

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'agent.state.changed':
      handleAgentStateChange(message.payload);
      break;
    case 'call.incoming':
      handleIncomingCall(message.payload);
      break;
    case 'chat.message':
      handleChatMessage(message.payload);
      break;
    case 'notification':
      showNotification(message.payload);
      break;
  }
};

// Send ping periodically
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

## Message Types

### Agent Events
- `agent.state.changed` - Agent state changed
- `agent.login` - Agent logged in
- `agent.logout` - Agent logged out

### Call Events
- `call.incoming` - New incoming call
- `call.answered` - Call answered by agent
- `call.ended` - Call ended
- `call.transferred` - Call transferred
- `call.hold` - Call placed on hold
- `call.unhold` - Call removed from hold

### Queue Events
- `queue.joined` - Call joined queue
- `queue.left` - Call left queue
- `queue.stats` - Queue statistics update
- `queue.member.added` - Member added to queue
- `queue.member.removed` - Member removed from queue
- `queue.member.paused` - Member paused
- `queue.member.unpaused` - Member unpaused

### Chat Events
- `chat.session.started` - Chat session started
- `chat.message` - New chat message
- `chat.session.ended` - Chat session ended
- `chat.transferred` - Chat transferred to another agent
- `chat.typing` - Typing indicator

### System Events
- `notification` - User notification
- `alert` - System alert
- `ping` - Keepalive ping
- `pong` - Keepalive pong response
- `error` - Error message
- `subscribe` - Subscribe to events
- `unsubscribe` - Unsubscribe from events

## Features

### Tenant Isolation
All messages are scoped to tenants. Clients only receive messages for their tenant.

### Event Subscriptions
Clients can subscribe to specific event types to reduce bandwidth:

```json
{
  "type": "subscribe",
  "payload": {
    "events": ["call.incoming", "agent.state.changed"]
  }
}
```

### Keepalive
Automatic ping/pong mechanism maintains connection health:
- Server sends ping every 54 seconds
- Client must respond with pong within 60 seconds
- Connection closes if pong not received

### User Targeting
Messages can be targeted to:
- All users in a tenant (broadcast)
- Specific user (targeted)
- Users subscribed to specific event types

### Connection Management
- Automatic reconnection handling
- Graceful disconnection
- Connection statistics tracking
- Online status checking

## Integration Points

### Agent State Service
Broadcast state changes when agents login, logout, or change availability.

### CDR Service
Broadcast call events as they occur (incoming, answered, ended).

### Queue Service
Broadcast queue events and statistics updates.

### Chat Service
Broadcast chat messages and session events in real-time.

### Notification Service
Send notifications to specific users or broadcast alerts.

## Performance Considerations

- **Buffered Channels**: 256-message buffer per client prevents blocking
- **Non-blocking Sends**: Messages dropped if client buffer full
- **Goroutines**: Separate read/write goroutines per client
- **Message Limits**: 512KB max message size
- **Connection Limits**: Monitor with `/ws/stats` endpoint

## Security

- **Authentication Required**: Protected endpoints require valid JWT
- **Tenant Isolation**: Clients only receive messages for their tenant
- **Origin Checking**: Configure `CheckOrigin` in production
- **Rate Limiting**: Implement at reverse proxy level
- **TLS Required**: Use `wss://` in production

## Monitoring

Check connection statistics:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/ws/stats
```

Check user online status:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/ws/users/123/online
```

## Testing

### Manual Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect with authentication
wscat -c "ws://localhost:8080/ws" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send ping
> {"type":"ping"}

# Subscribe to events
> {"type":"subscribe","payload":{"events":["call.incoming"]}}
```

## Future Enhancements

- [ ] Message persistence for offline clients
- [ ] Replay recent messages on reconnect
- [ ] Compression support for large payloads
- [ ] Metrics and monitoring integration
- [ ] Load balancing across multiple instances
- [ ] Redis pub/sub for horizontal scaling
