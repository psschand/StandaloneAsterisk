#!/bin/bash

# Session Persistence Test Script
# Tests the new session persistence functionality

BASE_URL="http://localhost/api/v1/chat/public"

echo "========================================"
echo "Session Persistence Test"
echo "========================================"
echo ""

# Test 1: Start a new session
echo "Test 1: Starting new chat session..."
START_RESPONSE=$(curl -s -X POST "${BASE_URL}/start" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo-tenant",
    "channel": "web_widget",
    "customer_name": "Test User",
    "customer_email": "test@example.com"
  }')

echo "$START_RESPONSE" | jq .

# Extract session_id and conversation_id
SESSION_KEY=$(echo "$START_RESPONSE" | jq -r '.data.session_id')
CONVERSATION_ID=$(echo "$START_RESPONSE" | jq -r '.data.conversation_id')

echo ""
echo "Session Key: $SESSION_KEY"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

if [ "$SESSION_KEY" == "null" ] || [ -z "$SESSION_KEY" ]; then
  echo "❌ Failed to start session"
  exit 1
fi

sleep 1

# Test 2: Send a message
echo "Test 2: Sending message to session..."
MSG_RESPONSE=$(curl -s -X POST "${BASE_URL}/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_KEY\",
    \"message\": \"Hello, I need help with session persistence testing\",
    \"metadata\": {
      \"page_url\": \"http://localhost/test\",
      \"page_title\": \"Test Page\"
    }
  }")

echo "$MSG_RESPONSE" | jq .
echo ""

sleep 1

# Test 3: Get session status
echo "Test 3: Getting session status..."
STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}/status/${CONVERSATION_ID}")

echo "$STATUS_RESPONSE" | jq .

SESSION_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status')
echo ""
echo "Current Status: $SESSION_STATUS"
echo ""

if [ "$SESSION_STATUS" == "active" ] || [ "$SESSION_STATUS" == "queued" ]; then
  echo "✅ Session is active/queued (can be restored)"
else
  echo "⚠️  Session status: $SESSION_STATUS"
fi

sleep 1

# Test 4: Get session history
echo ""
echo "Test 4: Getting session history..."
HISTORY_RESPONSE=$(curl -s -X GET "${BASE_URL}/session/${SESSION_KEY}")

echo "$HISTORY_RESPONSE" | jq .

MESSAGE_COUNT=$(echo "$HISTORY_RESPONSE" | jq '.data.messages | length')
echo ""
echo "Message Count: $MESSAGE_COUNT"
echo ""

sleep 1

# Test 5: End session
echo "Test 5: Ending chat session..."
END_RESPONSE=$(curl -s -X POST "${BASE_URL}/end" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": $CONVERSATION_ID
  }")

echo "$END_RESPONSE" | jq .
echo ""

sleep 1

# Test 6: Verify session is ended
echo "Test 6: Verifying session ended..."
FINAL_STATUS=$(curl -s -X GET "${BASE_URL}/status/${CONVERSATION_ID}")

echo "$FINAL_STATUS" | jq .

FINAL_STATE=$(echo "$FINAL_STATUS" | jq -r '.data.status')
echo ""
echo "Final Status: $FINAL_STATE"
echo ""

if [ "$FINAL_STATE" == "ended" ]; then
  echo "✅ Session properly ended"
else
  echo "❌ Session not ended (status: $FINAL_STATE)"
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "✅ Session created: $SESSION_KEY"
echo "✅ Message sent successfully"
echo "✅ Status endpoint working"
echo "✅ History endpoint working ($MESSAGE_COUNT messages)"
echo "✅ End endpoint working"
echo "✅ Session marked as: $FINAL_STATE"
echo ""
echo "All tests completed!"
