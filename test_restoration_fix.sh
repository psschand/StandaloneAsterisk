#!/bin/bash

# Quick test for session restoration bug fix

echo "========================================="
echo "Session Restoration Debug Test"
echo "========================================="
echo ""

BASE_URL="http://localhost/api/v1/chat/public"

# Step 1: Create session
echo "Step 1: Creating new session..."
START=$(curl -s -X POST "${BASE_URL}/start" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo-tenant",
    "channel": "web_widget",
    "customer_name": "Restore Test",
    "customer_email": null
  }')

echo "$START" | jq .

SESSION_KEY=$(echo "$START" | jq -r '.data.session_id')
CONV_ID=$(echo "$START" | jq -r '.data.conversation_id')

echo ""
echo "📝 Session Key: $SESSION_KEY"
echo "📝 Conversation ID: $CONV_ID"
echo ""

# Step 2: Send a message
echo "Step 2: Sending test message..."
MSG=$(curl -s -X POST "${BASE_URL}/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_KEY\",
    \"message\": \"Test message for restoration\"
  }")

echo "$MSG" | jq -r '.data.content'
echo ""

# Step 3: Check status (this is what restore function calls)
echo "Step 3: Checking session status (what widget restoration calls)..."
STATUS=$(curl -s -X GET "${BASE_URL}/status/${CONV_ID}")

echo "$STATUS" | jq .

SESSION_STATUS=$(echo "$STATUS" | jq -r '.data.status')
SESSION_KEY_CHECK=$(echo "$STATUS" | jq -r '.data.session_id')

echo ""
echo "✅ Status endpoint returns:"
echo "   - Status: $SESSION_STATUS"
echo "   - Session Key: $SESSION_KEY_CHECK"
echo "   - Matches original: $([ "$SESSION_KEY_CHECK" = "$SESSION_KEY" ] && echo 'YES ✓' || echo 'NO ✗')"
echo ""

# Step 4: Verify history
echo "Step 4: Getting session history..."
HISTORY=$(curl -s -X GET "${BASE_URL}/session/${SESSION_KEY}")

MSG_COUNT=$(echo "$HISTORY" | jq '.data.messages | length')
HIST_STATUS=$(echo "$HISTORY" | jq -r '.data.status')

echo "   - Messages: $MSG_COUNT"
echo "   - Status: $HIST_STATUS"
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="

if [ "$SESSION_STATUS" = "active" ] || [ "$SESSION_STATUS" = "queued" ]; then
  echo "✅ Session is $SESSION_STATUS (can be restored)"
else
  echo "❌ Session is $SESSION_STATUS (cannot be restored)"
fi

if [ "$SESSION_KEY_CHECK" = "$SESSION_KEY" ]; then
  echo "✅ Session key matches in status response"
else
  echo "❌ Session key mismatch!"
fi

if [ "$MSG_COUNT" -gt 0 ]; then
  echo "✅ Message history available ($MSG_COUNT messages)"
else
  echo "❌ No messages in history"
fi

echo ""
echo "🔍 Widget should use these values:"
echo "   - conversationId: $CONV_ID (for /status endpoint)"
echo "   - sessionKey: $SESSION_KEY (for /message and /session endpoints)"
echo ""
echo "Widget localStorage should store:"
echo "   {"
echo "     \"conversationId\": $CONV_ID,"
echo "     \"sessionKey\": \"$SESSION_KEY\","
echo "     \"sessionId\": $CONV_ID,"
echo "     \"messages\": [...],"
echo "     \"timestamp\": $(date +%s)000"
echo "   }"
echo ""
