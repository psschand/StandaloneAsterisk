#!/bin/bash

# AI Agent + Knowledge Base Integration Test
# Tests the complete flow: Chat Widget → AI Agent → Knowledge Base → Gemini

set -e

API_URL="http://localhost:8001/api/v1"
TENANT_ID="demo-tenant"

echo "========================================="
echo "AI AGENT + KNOWLEDGE BASE INTEGRATION TEST"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Login to get token
echo -e "${BLUE}Step 1: Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@callcenter.com",
    "password": "Password123!",
    "tenant_id": "demo-tenant"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token // empty')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed!${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Check KB entries
echo -e "${BLUE}Step 2: Checking Knowledge Base...${NC}"
KB_COUNT=$(curl -s -X GET "$API_URL/knowledge-base" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.data | length')

echo -e "${GREEN}✓ Found $KB_COUNT knowledge base entries${NC}"

if [ "$KB_COUNT" -eq "0" ]; then
  echo -e "${YELLOW}⚠ No KB entries found. Creating sample entries...${NC}"
  
  # Create sample KB entry
  curl -s -X POST "$API_URL/knowledge-base" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "category": "Shipping",
      "question": "How long does shipping take?",
      "answer": "Standard shipping takes 3-5 business days. Express shipping is available for an additional fee and takes 1-2 business days.",
      "keywords": "shipping, delivery, time, how long",
      "priority": 8,
      "is_active": true
    }' > /dev/null
  
  echo -e "${GREEN}✓ Sample KB entry created${NC}"
fi
echo ""

# Step 3: Test KB Search (RAG)
echo -e "${BLUE}Step 3: Testing Knowledge Base Search (RAG)...${NC}"
echo "Query: 'shipping time'"

SEARCH_RESULT=$(curl -s -X GET "$API_URL/knowledge-base/search?q=shipping+time" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

SEARCH_COUNT=$(echo "$SEARCH_RESULT" | jq '.data | length')
echo -e "${GREEN}✓ Found $SEARCH_COUNT matching KB entries${NC}"

if [ "$SEARCH_COUNT" -gt "0" ]; then
  echo "$SEARCH_RESULT" | jq -r '.data[0] | "  - " + .question + "\n    Answer: " + (.answer | .[0:100]) + "..."'
fi
echo ""

# Step 4: Check AI Agent Config
echo -e "${BLUE}Step 4: Checking AI Agent Configuration...${NC}"
AI_CONFIG=$(curl -s -X GET "$API_URL/ai/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" 2>/dev/null || echo '{}')

if [ "$(echo "$AI_CONFIG" | jq -r '.data.is_enabled // false')" == "true" ]; then
  echo -e "${GREEN}✓ AI Agent is enabled${NC}"
  echo "  Model: $(echo "$AI_CONFIG" | jq -r '.data.model')"
  echo "  RAG Enabled: $(echo "$AI_CONFIG" | jq -r '.data.rag_enabled')"
  echo "  Confidence Threshold: $(echo "$AI_CONFIG" | jq -r '.data.handoff_confidence_threshold')"
else
  echo -e "${YELLOW}⚠ AI Agent config not found (using defaults)${NC}"
fi
echo ""

# Step 5: Test AI Agent with KB Integration
echo -e "${BLUE}Step 5: Testing AI Agent + KB Integration...${NC}"
echo "Creating test chat session..."

# Create a chat session
SESSION_RESPONSE=$(curl -s -X POST "$API_URL/chat/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "visitor_name": "Test Customer",
    "visitor_email": "test@example.com",
    "channel": "web",
    "source": "test"
  }')

SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.data.id // empty')

if [ -z "$SESSION_ID" ]; then
  echo -e "${RED}✗ Failed to create session${NC}"
  echo "$SESSION_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Session created: $SESSION_ID${NC}"
echo ""

# Send customer message
echo -e "${YELLOW}Customer: \"How long does shipping take?\"${NC}"
MESSAGE_RESPONSE=$(curl -s -X POST "$API_URL/chat/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "How long does shipping take?",
    "sender_type": "visitor"
  }')

echo -e "${GREEN}✓ Message sent${NC}"
echo ""

# Wait for AI processing
echo -e "${BLUE}Waiting for AI Agent to process (with KB lookup)...${NC}"
sleep 3

# Get AI response
MESSAGES=$(curl -s -X GET "$API_URL/chat/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

AI_RESPONSE=$(echo "$MESSAGES" | jq -r '.data[] | select(.sender_type == "bot") | .body' | tail -1)

if [ ! -z "$AI_RESPONSE" ]; then
  echo -e "${GREEN}✓ AI Response received:${NC}"
  echo ""
  echo -e "${BLUE}🤖 AI Agent:${NC} $AI_RESPONSE"
  echo ""
  
  # Check if response contains KB content
  if echo "$AI_RESPONSE" | grep -qi "3-5.*business.*days\|shipping.*takes"; then
    echo -e "${GREEN}✅ SUCCESS: AI used Knowledge Base content!${NC}"
    echo "   (Response contains KB information about shipping time)"
  else
    echo -e "${YELLOW}⚠ AI responded but may not have used KB${NC}"
  fi
else
  echo -e "${YELLOW}⚠ No AI response yet (might still be processing)${NC}"
  echo "Check logs: docker logs backend --tail=20"
fi
echo ""

# Step 6: Check session metadata
echo -e "${BLUE}Step 6: Checking Session Metadata...${NC}"
SESSION_DETAILS=$(curl -s -X GET "$API_URL/chat/sessions/$SESSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID")

echo "$SESSION_DETAILS" | jq '{
  id: .data.id,
  status: .data.status,
  message_count: .data.message_count,
  assigned_agent: .data.assigned_agent_id
}'
echo ""

# Step 7: Test with different query
echo -e "${BLUE}Step 7: Testing with different query...${NC}"
echo -e "${YELLOW}Customer: \"What is your return policy?\"${NC}"

curl -s -X POST "$API_URL/chat/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "What is your return policy?",
    "sender_type": "visitor"
  }' > /dev/null

sleep 3

AI_RESPONSE2=$(curl -s -X GET "$API_URL/chat/sessions/$SESSION_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" | jq -r '.data[] | select(.sender_type == "bot") | .body' | tail -1)

if [ ! -z "$AI_RESPONSE2" ] && [ "$AI_RESPONSE2" != "$AI_RESPONSE" ]; then
  echo -e "${GREEN}✓ AI Response:${NC}"
  echo -e "${BLUE}🤖 AI Agent:${NC} $AI_RESPONSE2"
else
  echo -e "${YELLOW}⚠ No new response or KB entry not found${NC}"
  echo "   (AI may handover to human if no KB match)"
fi
echo ""

# Step 8: Summary
echo "========================================="
echo -e "${GREEN}TEST SUMMARY${NC}"
echo "========================================="
echo ""
echo "Architecture Flow:"
echo ""
echo "  Chat Widget (Web/WhatsApp/etc)"
echo "         ↓"
echo "  POST /api/v1/chat/sessions/{id}/messages"
echo "         ↓"
echo "  ChatService.SendMessage()"
echo "         ↓ (if sender_type=customer)"
echo "  ChatService.processCustomerMessage()"
echo "         ↓"
echo "  AIAgentService.ProcessMessage()"
echo "         ↓"
echo "  1. Get AI Config (tenant-specific)"
echo "  2. Get Message History (last 20)"
echo "  3. Search Knowledge Base (RAG) ← MYSQL FULLTEXT"
echo "         ↓"
echo "  4. Build Gemini Prompt + KB Context"
echo "  5. Call Gemini API"
echo "  6. Calculate Confidence (0-1)"
echo "         ↓"
echo "  7. Decision:"
echo "     ├─ High Confidence (≥0.7) → Bot Response"
echo "     └─ Low Confidence (<0.7) → Handover to Human"
echo ""
echo "Key Files:"
echo "  Backend:"
echo "    - internal/chat/chat_service.go (line 102-166)"
echo "    - internal/chat/ai_agent_service.go (line 48-180)"
echo "    - internal/chat/knowledge_base_service.go"
echo ""
echo "  Database:"
echo "    - chat_sessions (conversations)"
echo "    - chat_messages (messages)"
echo "    - knowledge_base_articles (RAG data)"
echo "    - ai_agent_config (per-tenant AI settings)"
echo ""
echo "  Frontend:"
echo "    - pages/ChatWidgetDesigner.tsx (widget config)"
echo "    - pages/admin/KnowledgeBase.tsx (KB management)"
echo ""
echo -e "${GREEN}✅ Integration test complete!${NC}"
echo ""
echo "To see AI processing in real-time:"
echo "  docker logs -f backend | grep -E 'AI|RAG|Gemini|KB'"
echo ""
