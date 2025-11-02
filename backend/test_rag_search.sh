#!/bin/bash

# Direct AI Agent Test - No Authentication Required
# Tests the RAG (Knowledge Base Search) functionality

echo "========================================="
echo "🤖 AI AGENT - RAG KNOWLEDGE BASE TEST"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}📊 Knowledge Base Statistics:${NC}"
echo "-----------------------------------"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    COUNT(*) as total_entries,
    COUNT(DISTINCT category) as categories,
    SUM(usage_count) as total_usage
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001';
" 2>/dev/null | tail -2

echo ""
echo -e "${BLUE}📂 Categories:${NC}"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    category, 
    COUNT(*) as entries
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001'
GROUP BY category;
" 2>/dev/null | tail -7

echo ""
echo "========================================="
echo ""

# Test 1: Shipping Question
echo -e "${YELLOW}🎯 Test 1: Shipping Question${NC}"
echo -e "${GREEN}Customer Query:${NC} \"How long does shipping take?\""
echo ""
echo -e "${CYAN}🔍 RAG Search Results:${NC}"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    title,
    category,
    SUBSTRING(answer, 1, 100) as answer_preview,
    MATCH(question, answer, keywords) AGAINST ('shipping time delivery' IN NATURAL LANGUAGE MODE) as relevance_score
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001'
  AND MATCH(question, answer, keywords) AGAINST ('shipping time delivery' IN NATURAL LANGUAGE MODE)
ORDER BY relevance_score DESC
LIMIT 2;
" 2>/dev/null | tail -5

echo ""
echo "-----------------------------------"
echo ""

# Test 2: Returns Question  
echo -e "${YELLOW}🎯 Test 2: Returns Question${NC}"
echo -e "${GREEN}Customer Query:${NC} \"What is your return policy?\""
echo ""
echo -e "${CYAN}🔍 RAG Search Results:${NC}"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    title,
    category,
    SUBSTRING(answer, 1, 100) as answer_preview,
    MATCH(question, answer, keywords) AGAINST ('return policy refund' IN NATURAL LANGUAGE MODE) as relevance_score
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001'
  AND MATCH(question, answer, keywords) AGAINST ('return policy refund' IN NATURAL LANGUAGE MODE)
ORDER BY relevance_score DESC
LIMIT 2;
" 2>/dev/null | tail -5

echo ""
echo "-----------------------------------"
echo ""

# Test 3: Support Hours
echo -e "${YELLOW}🎯 Test 3: Support Hours Question${NC}"
echo -e "${GREEN}Customer Query:${NC} \"What are your business hours?\""
echo ""
echo -e "${CYAN}🔍 RAG Search Results:${NC}"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    title,
    category,
    SUBSTRING(answer, 1, 100) as answer_preview,
    MATCH(question, answer, keywords) AGAINST ('business hours open time' IN NATURAL LANGUAGE MODE) as relevance_score
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001'
  AND MATCH(question, answer, keywords) AGAINST ('business hours open time' IN NATURAL LANGUAGE MODE)
ORDER BY relevance_score DESC
LIMIT 2;
" 2>/dev/null | tail -5

echo ""
echo "-----------------------------------"
echo ""

# Test 4: Track Order
echo -e "${YELLOW}🎯 Test 4: Order Tracking Question${NC}"
echo -e "${GREEN}Customer Query:${NC} \"Can I track my order?\""
echo ""
echo -e "${CYAN}🔍 RAG Search Results:${NC}"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    title,
    category,
    answer as full_answer,
    MATCH(question, answer, keywords) AGAINST ('track order tracking shipment' IN NATURAL LANGUAGE MODE) as relevance_score
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001'
  AND MATCH(question, answer, keywords) AGAINST ('track order tracking shipment' IN NATURAL LANGUAGE MODE)
ORDER BY relevance_score DESC
LIMIT 1;
" 2>/dev/null | tail -6

echo ""
echo "-----------------------------------"
echo ""

# Test 5: Payment Methods
echo -e "${YELLOW}🎯 Test 5: Payment Question${NC}"
echo -e "${GREEN}Customer Query:${NC} \"What payment methods do you accept?\""
echo ""
echo -e "${CYAN}🔍 RAG Search Results:${NC}"
docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter -e "
SELECT 
    title,
    category,
    answer as full_answer,
    MATCH(question, answer, keywords) AGAINST ('payment methods credit card paypal' IN NATURAL LANGUAGE MODE) as relevance_score
FROM knowledge_base
WHERE tenant_id = 'test-tenant-001'
  AND MATCH(question, answer, keywords) AGAINST ('payment methods credit card paypal' IN NATURAL LANGUAGE MODE)
ORDER BY relevance_score DESC
LIMIT 1;
" 2>/dev/null | tail -6

echo ""
echo "========================================="
echo ""

echo -e "${GREEN}✅ RAG Knowledge Base Testing Complete!${NC}"
echo ""
echo -e "${BLUE}📈 How it works:${NC}"
echo "  1. Customer asks a question"
echo "  2. AI Agent searches knowledge base using MySQL FULLTEXT"
echo "  3. Top matching entries are found (RAG retrieval)"
echo "  4. Gemini AI uses these entries as context"
echo "  5. AI generates personalized response"
echo "  6. Response sent to customer"
echo ""
echo -e "${YELLOW}💡 Key Benefits:${NC}"
echo "  ✓ Accurate answers from your knowledge base"
echo "  ✓ Consistent responses across all channels"
echo "  ✓ No hallucinations (answers grounded in facts)"
echo "  ✓ Fast search using MySQL FULLTEXT index"
echo "  ✓ Tenant-specific knowledge isolation"
echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo "  1. Create test user with proper password hash"
echo "  2. Test full AI agent with Gemini API"
echo "  3. Test handoff rules (sentiment, confidence)"
echo "  4. Build frontend Knowledge Base UI"
echo "  5. Build Chat Page for agent inbox"
echo ""
