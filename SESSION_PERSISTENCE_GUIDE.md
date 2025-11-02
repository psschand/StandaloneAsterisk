# Session Persistence Implementation Guide

## Overview
The chat widget now implements **Session Persistence with Smart Abandonment** to provide a better user experience. Visitors can reload pages or close tabs without losing their chat context, while sessions are intelligently cleaned up after prolonged inactivity.

## How It Works

### 1. **Session Storage**
- When a visitor starts a chat, the session details are saved to browser `localStorage`
- Stored data includes:
  - `session_id` - Unique session identifier
  - `session_key` - Session authentication key
  - `conversation_id` - Internal conversation ID
  - `messages` - Chat message history
  - `timestamp` - Last activity timestamp

### 2. **Session Restoration**
- When the visitor returns (page reload, new tab, etc.), the widget checks `localStorage`
- If a session exists and is less than 30 minutes old:
  - Widget verifies session is still active on backend
  - If active: restores the session with full message history
  - If ended/abandoned: starts a new session
- If no session or expired: starts a new session

### 3. **Heartbeat Mechanism**
- WebSocket sends heartbeat ping every 30 seconds
- Backend can detect disconnected clients
- Keeps session alive during active browsing
- Updates timestamp in localStorage

### 4. **Session Expiration**
Sessions are marked as abandoned when:
- ✅ **30+ minutes of inactivity** - No messages or page loads
- ✅ **User clicks "End Chat" button** - Manual termination
- ⏳ **WebSocket disconnect > 5 minutes** - Backend timeout (future enhancement)

### 5. **Manual End Chat**
- New "End Chat" button added to widget interface
- Clicking prompts confirmation dialog
- Immediately ends session and clears localStorage
- Sends system message to backend
- Closes widget after 2 seconds

## User Experience Benefits

### ✅ **Better UX**
- No lost context when accidentally closing tab
- Can continue chat after brief interruptions
- Seamless experience across page navigation

### ✅ **Smart Cleanup**
- Old sessions automatically marked abandoned
- No database bloat from zombie sessions
- Clear differentiation between active and stale chats

### ✅ **Agent Efficiency**
- Agents see accurate queue counts
- No wasted effort on disconnected visitors
- History filter shows truly ended chats

## Technical Implementation

### Frontend Changes

**File: `frontend/public/chat-widget.js`**

1. **LocalStorage Keys**
```javascript
const STORAGE_KEY = 'cc_chat_session';
const STORAGE_EXPIRY = 30 * 60 * 1000; // 30 minutes
```

2. **Session Persistence Functions**
- `saveSessionToStorage()` - Saves session data to localStorage
- `loadSessionFromStorage()` - Loads and validates stored session
- `clearSession()` - Removes session from storage
- `restoreSession()` - Reconnects to existing session

3. **Heartbeat Functions**
- `startHeartbeat()` - Sends ping every 30 seconds
- `stopHeartbeat()` - Clears heartbeat interval
- Updates localStorage timestamp on each beat

4. **End Chat Function**
- `endChat()` - Calls backend, closes WebSocket, clears storage

5. **UI Changes**
- Added "End Chat" button with red styling
- Confirmation dialog before ending
- Session restoration message

### Backend Changes

**File: `backend/internal/handler/public_chat.go`**

1. **New Endpoints**
```go
// GET /api/v1/chat/public/status/:session_id
func GetSessionStatus(c *gin.Context)

// POST /api/v1/chat/public/end
func EndSession(c *gin.Context)
```

2. **Endpoint Details**

**Get Session Status**
```
GET /api/v1/chat/public/status/:session_id
Response: {
  "success": true,
  "data": {
    "session_id": "abc123",
    "status": "active",
    "assigned_to_id": 1,
    "created_at": "2025-01-02T10:00:00Z",
    "updated_at": "2025-01-02T10:15:00Z"
  }
}
```

**End Session**
```
POST /api/v1/chat/public/end
Body: { "session_id": 123 }
Response: {
  "success": true,
  "data": {
    "message": "Chat session ended successfully",
    "status": "ended"
  }
}
```

**File: `backend/cmd/api/main.go`**
- Registered new routes in public chat group

## Testing Session Persistence

### Test 1: Basic Reconnection
1. Open widget demo page: `http://localhost/widget-demo.html`
2. Click chat bubble, send a message
3. Reload the page
4. Click chat bubble again
5. ✅ **Expected**: Message history restored, "Your chat has been restored" message

### Test 2: Session Expiration
1. Start a chat session
2. Wait 31 minutes (or manually clear localStorage and change timestamp)
3. Reload page and open widget
4. ✅ **Expected**: New session started, no history restored

### Test 3: Manual End Chat
1. Start a chat session
2. Click "End Chat" button
3. Confirm in dialog
4. ✅ **Expected**: Session ended, storage cleared, widget closes

### Test 4: Multi-Tab Behavior
1. Open widget in Tab A, start chat
2. Open same URL in Tab B
3. Click widget in Tab B
4. ✅ **Expected**: Same session restored in Tab B

### Test 5: Backend Session Validation
1. Start a chat session
2. Manually end session via agent interface
3. Reload page, try to restore
4. ✅ **Expected**: New session started (backend returns session not active)

## Console Logging

The widget logs all session persistence actions:

```
✅ Session saved to localStorage
🔄 Attempting to restore session: abc123
✅ Found saved session, age: 45 seconds
✅ Session restored successfully
💓 Heartbeat sent
🔌 WebSocket connected
🗑️ Session cleared from storage
⏰ Session expired, clearing storage
❌ Session not found on backend, starting new session
```

## Future Enhancements

### Phase 2: Backend Auto-Cleanup
Create a background job to mark abandoned sessions:

```sql
UPDATE chat_sessions 
SET status = 'abandoned' 
WHERE status IN ('queued', 'active') 
  AND updated_at < NOW() - INTERVAL 30 MINUTE 
  AND assigned_to_id IS NULL;
```

Run every 5 minutes via cron or scheduled task.

### Phase 3: WebSocket Disconnect Detection
- Track last heartbeat timestamp on backend
- If no heartbeat for 5+ minutes, mark session abandoned
- Coordinate with session persistence (allow brief disconnects during page reload)

### Phase 4: Enhanced Analytics
- Track session restoration rate
- Measure average session duration
- Identify abandonment patterns

## Configuration Options

Widget can be configured with custom expiration:

```javascript
CallCenterChat.init({
  apiUrl: 'http://localhost:8443',
  tenantId: 'demo-tenant',
  position: 'bottom-right',
  primaryColor: '#4F46E5',
  
  // Custom session options
  sessionExpiry: 30 * 60 * 1000,  // 30 minutes (default)
  heartbeatInterval: 30000,        // 30 seconds (default)
  autoRestore: true                // Enable restoration (default)
});
```

## Security Considerations

1. **Session Keys**: Stored in localStorage (not secure for sensitive data)
2. **Validation**: Backend always validates session status before restoring
3. **Cleanup**: Sessions auto-expire after 30 minutes
4. **No PII**: Avoid storing personal information in localStorage

## Troubleshooting

### Issue: Session not restoring
**Symptoms**: New session starts despite localStorage data

**Check**:
1. Browser console for error logs
2. Session age (must be < 30 minutes)
3. Backend session status (must be 'active' or 'queued')
4. Network tab for /status/:session_id API call

**Solution**: Check console logs, verify backend is running

### Issue: Heartbeat errors
**Symptoms**: "Failed to send heartbeat" in console

**Check**:
1. WebSocket connection status
2. Backend availability
3. Network connectivity

**Solution**: Reconnect WebSocket, check backend logs

### Issue: Old sessions not marked abandoned
**Symptoms**: Sessions from hours ago still show as "queued"

**Status**: Backend auto-cleanup not yet implemented
**Workaround**: Manually update via SQL or wait for Phase 2 implementation

## Summary

Session Persistence provides:
- ✅ Seamless reconnection after page reload
- ✅ 30-minute session timeout
- ✅ Manual "End Chat" option
- ✅ Heartbeat mechanism
- ✅ Full message history restoration
- ✅ Smart backend validation

This creates a professional chat experience while maintaining clean session management and preventing database bloat.
