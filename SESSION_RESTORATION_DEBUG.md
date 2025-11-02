# Session Restoration Debugging Guide

## Issue: Previous chat disappears on reload

### Enhanced Debugging

The widget now has extensive console logging to trace the restoration flow.

## How to Debug

### 1. Open the Test Page
Visit: `http://localhost/test-restoration.html`

### 2. Open Browser Console (F12)
Keep the console open during the entire test to see all logs.

### 3. Test Sequence

#### Step 1: Start New Chat
1. Click "Open Chat" button
2. **Expected console output:**
```
🔵 Chat opened. State: {sessionId: null, sessionKey: null, sessionRestored: false, messageCount: 0}
🔍 No active session, checking localStorage...
🆕 No saved session, starting new one
🆕 New session created: {sessionKey: "session-...", sessionId: 64, conversationId: 64}
✅ Session saved to localStorage: {sessionKey: "...", conversationId: 64, messageCount: 0}
🔌 WebSocket connected
💓 Heartbeat sent
```

#### Step 2: Send a Message
1. Type: "Test message 1"
2. Press Enter or click Send
3. **Expected console output:**
```
✅ Session saved to localStorage: {sessionKey: "...", conversationId: 64, messageCount: 1}
```

#### Step 3: Send Another Message (Optional)
1. Type: "Test message 2"
2. Press Enter
3. **Expected console output:**
```
✅ Session saved to localStorage: {sessionKey: "...", conversationId: 64, messageCount: 2}
```

#### Step 4: Close the Widget
1. Click the X button in widget header
2. **Expected console output:**
```
🔵 Chat closed
```

#### Step 5: Reload the Page
1. Click the "Reload Page" button (or press F5)
2. Page will refresh
3. **No console output yet** - page just reloaded

#### Step 6: Open Chat Again (CRITICAL)
1. Click "Open Chat" button
2. **Expected console output:**
```
🔵 Chat opened. State: {sessionId: null, sessionKey: null, sessionRestored: false, messageCount: 0}
🔍 No active session, checking localStorage...
📦 Found saved session, attempting restoration...
🔄 Attempting to restore session: session-...
📊 Session data: {sessionKey: "...", conversationId: 64, messages: Array(2), timestamp: ...}
📡 Backend response: {success: true, data: {status: "active", ...}}
💾 Restoring 2 messages from localStorage
  📝 Restoring message 1: {content: "Test message 1", type: "user", timestamp: ...}
  📝 Restoring message 2: {content: "Test message 2", type: "user", timestamp: ...}
✅ Restored 2 messages to UI
✅ Session restored successfully
🔌 WebSocket connected
```

3. **Widget should show:**
   - Welcome message
   - "Test message 1" (your message)
   - "Test message 2" (your message)  
   - "Your chat has been restored." (confirmation)

## Troubleshooting

### Problem 1: "No saved session, starting new one"
**Symptom:** Console shows no saved session found

**Check:**
1. Click "Show Storage" button on test page
2. Verify localStorage contains data
3. Check if timestamp is < 30 minutes old

**Solutions:**
- If no data: Session wasn't saved properly
- If expired: Normal behavior, session > 30 min old
- If data exists but not loaded: Check browser localStorage permissions

### Problem 2: "Session not found on backend"
**Symptom:** Restoration fails with 404 or error

**Console shows:**
```
❌ Session not found on backend (HTTP 404), starting new session
```

**Check:**
1. Session ID in storage
2. Backend running: `docker logs backend --tail 20`
3. API endpoint: `curl http://localhost/api/v1/chat/public/status/[ID]`

**Solutions:**
- Backend may have restarted (sessions in memory)
- Session truly ended/abandoned
- Network connectivity issue

### Problem 3: "Messages restored but not visible"
**Symptom:** Console shows restoration but widget is empty

**Console shows:**
```
✅ Restored 2 messages to UI
```

**But widget shows only welcome message**

**Check:**
1. Inspect element on messages container
2. Look for `cc-message` divs
3. Check CSS is loading properly

**Solutions:**
- CSS styling issue (messages present but hidden)
- DOM manipulation error
- Check browser console for errors

### Problem 4: No console logs at all
**Symptom:** Widget loads but no logs appear

**Check:**
1. Console filter settings (clear all filters)
2. Console not cleared (enable "Preserve log")
3. Widget JavaScript loaded: Check Network tab for `/chat-widget.js`

**Solutions:**
- Clear cache and reload (Ctrl+Shift+R)
- Check if widget initialized: `window.CallCenterChat`
- Verify nginx proxy working

## Expected Flow Diagram

```
Page Load
    ↓
User clicks "Open Chat"
    ↓
toggleChat() called
    ↓
Check: state.sessionId exists?
    ├─ YES → Use existing session (no restoration needed)
    └─ NO  → Check localStorage
              ↓
              loadSessionFromStorage()
              ↓
              Session found?
              ├─ NO  → startSession() (create new)
              └─ YES → restoreSession()
                        ↓
                        Call /status/:id API
                        ↓
                        Status active/queued?
                        ├─ NO  → startSession() (create new)
                        └─ YES → Restore state
                                  ↓
                                  Restore messages to UI
                                  ↓
                                  Connect WebSocket
                                  ↓
                                  Show "restored" message
```

## Manual Verification Steps

### Test A: Basic Restoration
- [ ] Start chat, send message
- [ ] Close widget
- [ ] Reload page
- [ ] Open widget
- [ ] ✅ Message should be visible

### Test B: Multiple Messages
- [ ] Start chat
- [ ] Send 3 different messages
- [ ] Close widget
- [ ] Reload page
- [ ] Open widget
- [ ] ✅ All 3 messages should be visible

### Test C: Expiration
- [ ] Start chat, send message
- [ ] Change localStorage timestamp to 31 min ago*
- [ ] Reload page
- [ ] Open widget
- [ ] ✅ New session started (old one expired)

*Use browser console:
```javascript
let data = JSON.parse(localStorage.getItem('cc_chat_session'));
data.timestamp = Date.now() - (31 * 60 * 1000);
localStorage.setItem('cc_chat_session', JSON.stringify(data));
```

### Test D: Backend Validation
- [ ] Start chat, send message
- [ ] Close widget
- [ ] Manually end session via agent UI
- [ ] Reload page
- [ ] Open widget
- [ ] ✅ New session started (backend returned "ended")

## Debug Checklist

If restoration fails, check console for:

1. **Session Creation Log:**
   - ✅ `🆕 New session created`
   - ✅ `✅ Session saved to localStorage`

2. **Storage Check Log:**
   - ✅ `📦 Found saved session`
   - ❌ `🆕 No saved session` → Problem: Not saved

3. **Restoration Attempt Log:**
   - ✅ `🔄 Attempting to restore session`
   - ✅ `📊 Session data:` → Verify data looks correct

4. **Backend Response Log:**
   - ✅ `📡 Backend response: {success: true, data: {status: "active"}}`
   - ❌ `❌ Session not found on backend` → Problem: API error

5. **Message Restoration Log:**
   - ✅ `💾 Restoring X messages from localStorage`
   - ✅ `📝 Restoring message 1: ...`
   - ✅ `✅ Restored X messages to UI`
   - ❌ `⚠️ No messages to restore` → Problem: Messages not saved

6. **Success Confirmation:**
   - ✅ `✅ Session restored successfully`
   - ✅ Widget shows "Your chat has been restored."

## Common Issues & Solutions

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| No logs appear | Console cleared/filtered | Preserve log, clear filters |
| "No saved session" | localStorage empty | Check if session was saved |
| "Session not found" | Backend restarted | Normal, start new session |
| Messages not visible | CSS/DOM issue | Inspect element, check styles |
| Restoration loops | State not updating | Check sessionRestored flag |
| Old session restored | Timestamp not updating | Check heartbeat/saveSession calls |

## Success Criteria

✅ **Restoration Working:**
- Console shows full restoration flow
- Messages appear in widget UI
- "Your chat has been restored" message visible
- Can continue conversation seamlessly
- WebSocket reconnected

❌ **Restoration Failing:**
- Console shows errors
- Widget starts new session
- Previous messages not visible
- localStorage cleared unexpectedly

---

**Last Updated:** November 2, 2025
**Enhanced Logging:** Added comprehensive console debugging
