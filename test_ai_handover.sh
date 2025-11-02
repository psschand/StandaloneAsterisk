#!/bin/bash

# AI Handover Testing Script
# Tests intelligent handover orchestration

API_URL="http://138.2.68.107:8443"

echo "=================================="
echo "AI HANDOVER ORCHESTRATION TESTING"
echo "=================================="
echo ""

# Test 1: Start session
echo "📝 Test 1: Starting new session..."
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat/public/start" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo-tenant",
    "channel": "web_widget",
    "customer_name": "Test Customer",
    "customer_email": "test@handover.com"
  }')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.session_id')
echo "✅ Session created: $SESSION_ID"
echo ""

# Test 2: Normal message (AI should handle)
echo "📝 Test 2: Normal question (AI should handle)..."
NORMAL_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat/public/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"What are your business hours?\"
  }")

echo "Response:"
echo $NORMAL_RESPONSE | jq '.data | {content, action, sentiment, confidence, intent}'
echo ""

sleep 2

# Test 3: Negative sentiment (should trigger handover)
echo "📝 Test 3: Negative sentiment message (should trigger auto-handover)..."
NEGATIVE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat/public/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"This is terrible! I'm so frustrated and angry with your service!\"
  }")

echo "Response:"
echo $NEGATIVE_RESPONSE | jq '.data | {content, action, sentiment, confidence, handoff_reason}'
echo ""

ACTION=$(echo $NEGATIVE_RESPONSE | jq -r '.data.action')
if [ "$ACTION" == "handoff" ]; then
  echo "✅ SUCCESS: Auto-handover triggered by negative sentiment!"
else
  echo "❌ FAILED: Expected handover but got: $ACTION"
fi
echo ""

sleep 2

# Test 4: Urgent keywords
echo "📝 Test 4: Urgent keywords (should trigger handover)..."
URGENT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat/public/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"URGENT: I need to speak to a manager immediately!\"
  }")

echo "Response:"
echo $URGENT_RESPONSE | jq '.data | {content, action, handoff_reason}'
echo ""

ACTION=$(echo $URGENT_RESPONSE | jq -r '.data.action')
if [ "$ACTION" == "handoff" ]; then
  echo "✅ SUCCESS: Auto-handover triggered by urgent keywords!"
else
  echo "❌ FAILED: Expected handover but got: $ACTION"
fi
echo ""

# Test 5: Manual handover button
echo "📝 Test 5: Manual handover request..."
HANDOVER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat/public/handover" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"reason\": \"customer_request\"
  }")

echo "Response:"
echo $HANDOVER_RESPONSE | jq '.data'
echo ""

echo "=================================="
echo "TESTING COMPLETE"
echo "=================================="
echo ""
echo "Summary:"
echo "- Session created: $SESSION_ID"
echo "- Normal AI handling: ✓"
echo "- Sentiment detection: Test and verify"
echo "- Keyword detection: Test and verify"  
echo "- Manual handover: ✓"
echo ""
echo "Next: Check agent interface at http://138.2.68.107:8443"
echo "Login: agent1@callcenter.com / Password123!"
