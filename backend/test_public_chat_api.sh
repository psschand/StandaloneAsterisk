#!/bin/bash
# Test the public chat API endpoints

API_URL="http://138.2.68.107:8443/api/v1/chat/public"

echo "================================================"
echo "Testing Public Chat API"
echo "================================================"
echo ""

# Test 1: Start a new session
echo "1. Starting new chat session..."
SESSION_RESPONSE=$(curl -s -X POST "${API_URL}/start" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo-tenant",
    "channel": "web_widget",
    "customer_name": "Test User",
    "customer_email": "test@example.com"
  }')

echo "Response:"
echo "$SESSION_RESPONSE" | jq '.'
echo ""

# Extract session_id
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.session_id // empty')

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

# Test 2: Send a message
echo "2. Sending message..."
MESSAGE_RESPONSE=$(curl -s -X POST "${API_URL}/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"What are your business hours?\",
    \"metadata\": {
      \"page_url\": \"http://example.com/test\",
      \"user_agent\": \"Test Script\"
    }
  }")

echo "Response:"
echo "$MESSAGE_RESPONSE" | jq '.'
echo ""

# Check if we got a response
AI_RESPONSE=$(echo "$MESSAGE_RESPONSE" | jq -r '.data.content // empty')
if [ -n "$AI_RESPONSE" ]; then
  echo "✅ AI Response: $AI_RESPONSE"
else
  echo "❌ No AI response received"
fi
echo ""

# Test 3: Get session history
echo "3. Getting session history..."
HISTORY_RESPONSE=$(curl -s -X GET "${API_URL}/session/$SESSION_ID")

echo "Response:"
echo "$HISTORY_RESPONSE" | jq '.'
echo ""

MESSAGE_COUNT=$(echo "$HISTORY_RESPONSE" | jq '.data.messages | length')
echo "✅ Total messages in history: $MESSAGE_COUNT"
echo ""

echo "================================================"
echo "All tests completed!"
echo "================================================"
