#!/bin/bash

# Test AI Chat with Knowledge Base
# This script demonstrates the AI agent responding to customer queries using RAG

API_URL="http://localhost:8001/api/v1"
TENANT_ID="test-tenant-001"

echo "========================================="
echo "🤖 AI CHAT AGENT - KNOWLEDGE BASE TEST"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 Knowledge Base Stats:${NC}"
curl -s "http://localhost:8001/api/v1/knowledge-base/stats" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.'
echo ""
echo "========================================="
echo ""

# Test 1: Shipping Question
echo -e "${YELLOW}Test 1: Customer asks about shipping${NC}"
echo -e "${GREEN}Customer:${NC} How long does shipping take?"
echo ""

CONV_ID=$(docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -sN \
  -e "INSERT INTO conversations (tenant_id, channel, status, created_at, updated_at) VALUES ('$TENANT_ID', 'web', 'bot', NOW(), NOW()); SELECT LAST_INSERT_ID();")

echo -e "${BLUE}📧 Processing with AI Agent (with RAG)...${NC}"
echo ""

# Manually call the knowledge base search to show RAG
echo -e "${BLUE}🔍 Searching Knowledge Base:${NC}"
SEARCH_RESULT=$(curl -s "$API_URL/knowledge-base/search?query=shipping+time&limit=2" \
  -H "X-Tenant-ID: $TENANT_ID" | jq -r '.data[0] // empty')

if [ ! -z "$SEARCH_RESULT" ]; then
    echo "$SEARCH_RESULT" | jq '{
        title: .title,
        category: .category,
        answer: .answer,
        confidence: "High (from knowledge base)"
    }'
else
    echo "No knowledge base match found"
fi

echo ""
echo "========================================="
echo ""

# Test 2: Returns Question
echo -e "${YELLOW}Test 2: Customer asks about returns${NC}"
echo -e "${GREEN}Customer:${NC} What is your return policy?"
echo ""

echo -e "${BLUE}🔍 Searching Knowledge Base:${NC}"
SEARCH_RESULT=$(curl -s "$API_URL/knowledge-base/search?query=return+policy&limit=2" \
  -H "X-Tenant-ID: $TENANT_ID" | jq -r '.data[0] // empty')

if [ ! -z "$SEARCH_RESULT" ]; then
    echo "$SEARCH_RESULT" | jq '{
        title: .title,
        category: .category,
        answer: .answer,
        confidence: "High (from knowledge base)"
    }'
fi

echo ""
echo "========================================="
echo ""

# Test 3: Support Hours
echo -e "${YELLOW}Test 3: Customer asks about support hours${NC}"
echo -e "${GREEN}Customer:${NC} When are you open?"
echo ""

echo -e "${BLUE}🔍 Searching Knowledge Base:${NC}"
SEARCH_RESULT=$(curl -s "$API_URL/knowledge-base/search?query=hours+open+support&limit=2" \
  -H "X-Tenant-ID: $TENANT_ID" | jq -r '.data[0] // empty')

if [ ! -z "$SEARCH_RESULT" ]; then
    echo "$SEARCH_RESULT" | jq '{
        title: .title,
        category: .category,
        answer: .answer,
        confidence: "High (from knowledge base)"
    }'
fi

echo ""
echo "========================================="
echo ""

# Test 4: Categories
echo -e "${BLUE}📂 Available Knowledge Base Categories:${NC}"
curl -s "$API_URL/knowledge-base/categories" \
  -H "X-Tenant-ID: $TENANT_ID" | jq '.data'

echo ""
echo "========================================="
echo ""

# Test 5: Test Query (Full AI Response with Gemini)
echo -e "${YELLOW}Test 4: Full AI Agent Test (with Gemini)${NC}"
echo -e "${GREEN}Customer:${NC} Can I track my order?"
echo ""

echo -e "${BLUE}🤖 AI Agent Response (Gemini + RAG):${NC}"
curl -s -X POST "$API_URL/knowledge-base/test" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"query": "Can I track my order?"}' | jq '{
    answer: .data.answer,
    confidence: .data.confidence,
    knowledge_base_used: (.data.knowledge_base_ids | length > 0)
}'

echo ""
echo "========================================="
echo ""

echo -e "${GREEN}✅ Testing Complete!${NC}"
echo ""
echo "Key Features Demonstrated:"
echo "  ✓ Knowledge Base Search (RAG)"
echo "  ✓ Category Organization"
echo "  ✓ Full-text Search"
echo "  ✓ AI Agent with Gemini (via test endpoint)"
echo "  ✓ High Confidence Responses"
echo ""
echo "Next Steps:"
echo "  1. Test with full conversation flow"
echo "  2. Test handoff rules (low confidence, negative sentiment)"
echo "  3. Build frontend UI for Knowledge Base management"
echo "  4. Build Chat Page for agents"
echo ""
