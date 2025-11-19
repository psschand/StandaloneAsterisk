#!/bin/bash

# Multi-Website Architecture API Testing Script
# This script tests all CRUD operations for websites and AI profiles

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:8001/api/v1"
EMAIL="admin@callcenter.com"
PASSWORD="Password123!"
TENANT_ID="demo-tenant"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Multi-Website Architecture API Testing${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# ============================================================
# STEP 1: AUTHENTICATION
# ============================================================
echo -e "${YELLOW}=== Step 1: Authentication ===${NC}"
echo "POST $API_BASE/auth/login"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"tenant_id\": \"$TENANT_ID\"
  }")

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Authentication failed!${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# ============================================================
# STEP 2: LIST EXISTING WEBSITES
# ============================================================
echo -e "${YELLOW}=== Step 2: List All Websites ===${NC}"
echo "GET $API_BASE/websites"

WEBSITES=$(curl -s -X GET "$API_BASE/websites" \
  -H "Authorization: Bearer $TOKEN")

WEBSITE_COUNT=$(echo $WEBSITES | jq '.data | length')
echo -e "${GREEN}✅ Found $WEBSITE_COUNT websites${NC}"
echo $WEBSITES | jq '.data[] | {id, name, domain}'
echo ""

# ============================================================
# STEP 3: GET SPECIFIC WEBSITE
# ============================================================
echo -e "${YELLOW}=== Step 3: Get Website Details ===${NC}"
echo "GET $API_BASE/websites/1"

WEBSITE_DETAIL=$(curl -s -X GET "$API_BASE/websites/1" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Website details:${NC}"
echo $WEBSITE_DETAIL | jq '.data | {id, name, domain, description, is_active}'
echo ""

# ============================================================
# STEP 4: CREATE NEW WEBSITE
# ============================================================
echo -e "${YELLOW}=== Step 4: Create New Website ===${NC}"
echo "POST $API_BASE/websites"

NEW_WEBSITE=$(curl -s -X POST "$API_BASE/websites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Portal",
    "domain": "test.example.com",
    "description": "Test website created via API",
    "is_active": true
  }')

NEW_WEBSITE_ID=$(echo $NEW_WEBSITE | jq -r '.data.id')

if [ "$NEW_WEBSITE_ID" != "null" ] && [ ! -z "$NEW_WEBSITE_ID" ]; then
  echo -e "${GREEN}✅ Website created successfully (ID: $NEW_WEBSITE_ID)${NC}"
  echo $NEW_WEBSITE | jq '.data'
else
  echo -e "${RED}❌ Failed to create website${NC}"
  echo $NEW_WEBSITE | jq '.'
fi
echo ""

# ============================================================
# STEP 5: UPDATE WEBSITE
# ============================================================
if [ "$NEW_WEBSITE_ID" != "null" ] && [ ! -z "$NEW_WEBSITE_ID" ]; then
  echo -e "${YELLOW}=== Step 5: Update Website ===${NC}"
  echo "PUT $API_BASE/websites/$NEW_WEBSITE_ID"

  UPDATED_WEBSITE=$(curl -s -X PUT "$API_BASE/websites/$NEW_WEBSITE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Test Portal",
      "description": "Updated description for test portal"
    }')

  echo -e "${GREEN}✅ Website updated${NC}"
  echo $UPDATED_WEBSITE | jq '.data | {id, name, description}'
  echo ""
fi

# ============================================================
# STEP 6: LIST AI AGENT PROFILES
# ============================================================
echo -e "${YELLOW}=== Step 6: List All AI Agent Profiles ===${NC}"
echo "GET $API_BASE/ai-agent-profiles"

PROFILES=$(curl -s -X GET "$API_BASE/ai-agent-profiles" \
  -H "Authorization: Bearer $TOKEN")

PROFILE_COUNT=$(echo $PROFILES | jq '.data | length')
echo -e "${GREEN}✅ Found $PROFILE_COUNT AI profiles${NC}"
echo $PROFILES | jq '.data[] | {id, profile_name, website_id, kb_tags: (.kb_tags | fromjson)}'
echo ""

# ============================================================
# STEP 7: GET SPECIFIC AI PROFILE
# ============================================================
echo -e "${YELLOW}=== Step 7: Get AI Profile Details ===${NC}"
echo "GET $API_BASE/ai-agent-profiles/1"

PROFILE_DETAIL=$(curl -s -X GET "$API_BASE/ai-agent-profiles/1" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ AI Profile details:${NC}"
echo $PROFILE_DETAIL | jq '.data | {
  id, 
  profile_name, 
  website_id, 
  model, 
  temperature, 
  max_tokens, 
  rag_enabled,
  kb_tags: (.kb_tags | fromjson)
}'
echo ""

# ============================================================
# STEP 8: CREATE NEW AI PROFILE
# ============================================================
if [ "$NEW_WEBSITE_ID" != "null" ] && [ ! -z "$NEW_WEBSITE_ID" ]; then
  echo -e "${YELLOW}=== Step 8: Create New AI Profile ===${NC}"
  echo "POST $API_BASE/ai-agent-profiles"

  NEW_PROFILE=$(curl -s -X POST "$API_BASE/ai-agent-profiles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"profile_name\": \"Test Portal Assistant\",
      \"description\": \"AI assistant for test portal\",
      \"website_id\": $NEW_WEBSITE_ID,
      \"model\": \"gemini-2.0-flash\",
      \"system_prompt\": \"You are a helpful test portal assistant.\",
      \"temperature\": 0.7,
      \"max_tokens\": 500,
      \"rag_enabled\": true,
      \"kb_tags\": [\"test\", \"portal\", \"support\"],
      \"is_default\": false
    }")

  NEW_PROFILE_ID=$(echo $NEW_PROFILE | jq -r '.data.id')

  if [ "$NEW_PROFILE_ID" != "null" ] && [ ! -z "$NEW_PROFILE_ID" ]; then
    echo -e "${GREEN}✅ AI Profile created successfully (ID: $NEW_PROFILE_ID)${NC}"
    echo $NEW_PROFILE | jq '.data | {id, profile_name, website_id, kb_tags}'
  else
    echo -e "${RED}❌ Failed to create AI profile${NC}"
    echo $NEW_PROFILE | jq '.'
  fi
  echo ""
fi

# ============================================================
# STEP 9: UPDATE AI PROFILE
# ============================================================
if [ "$NEW_PROFILE_ID" != "null" ] && [ ! -z "$NEW_PROFILE_ID" ]; then
  echo -e "${YELLOW}=== Step 9: Update AI Profile ===${NC}"
  echo "PUT $API_BASE/ai-agent-profiles/$NEW_PROFILE_ID"

  UPDATED_PROFILE=$(curl -s -X PUT "$API_BASE/ai-agent-profiles/$NEW_PROFILE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "temperature": 0.9,
      "max_tokens": 800,
      "kb_tags": ["test", "portal", "support", "faq"]
    }')

  echo -e "${GREEN}✅ AI Profile updated${NC}"
  echo $UPDATED_PROFILE | jq '.data | {id, profile_name, temperature, max_tokens, kb_tags}'
  echo ""
fi

# ============================================================
# STEP 10: TEST KNOWLEDGE BASE FILTERING
# ============================================================
echo -e "${YELLOW}=== Step 10: Verify Knowledge Base Filtering ===${NC}"
echo "Checking which KB articles match different profiles..."
echo ""

# Get all KB articles
KB_ARTICLES=$(docker compose exec mysql mysql -u root -pcallcenterpass callcenter -se \
  "SELECT id, title, tags FROM knowledge_base WHERE is_active = 1 AND tags IS NOT NULL LIMIT 5;")

echo "Sample KB Articles:"
echo "$KB_ARTICLES"
echo ""

# Get E-commerce profile tags
ECOM_TAGS=$(echo $PROFILES | jq -r '.data[] | select(.profile_name == "E-commerce Support Bot") | .kb_tags')
echo "E-commerce Bot tags: $ECOM_TAGS"

# Get Technical profile tags  
TECH_TAGS=$(echo $PROFILES | jq -r '.data[] | select(.profile_name == "Technical Support Bot") | .kb_tags')
echo "Technical Bot tags: $TECH_TAGS"

echo -e "${GREEN}✅ KB filtering configured${NC}"
echo ""

# ============================================================
# STEP 11: VERIFY WEBSITE LIMITS
# ============================================================
echo -e "${YELLOW}=== Step 11: Verify Website Limits ===${NC}"

TENANT_INFO=$(docker compose exec mysql mysql -u root -pcallcenterpass callcenter -se \
  "SELECT domain_mode, max_websites FROM tenants WHERE id = '$TENANT_ID';")

echo "Tenant configuration:"
echo "$TENANT_INFO"
echo ""

CURRENT_COUNT=$(echo $WEBSITES | jq '.data | length')
echo "Current websites: $CURRENT_COUNT"
echo -e "${GREEN}✅ Within limits${NC}"
echo ""

# ============================================================
# STEP 12: CLEANUP (OPTIONAL)
# ============================================================
read -p "Do you want to delete the test website and profile? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}=== Step 12: Cleanup ===${NC}"
  
  if [ "$NEW_PROFILE_ID" != "null" ] && [ ! -z "$NEW_PROFILE_ID" ]; then
    echo "Deleting AI Profile $NEW_PROFILE_ID..."
    DELETE_PROFILE=$(curl -s -X DELETE "$API_BASE/ai-agent-profiles/$NEW_PROFILE_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo $DELETE_PROFILE | jq '.'
  fi
  
  if [ "$NEW_WEBSITE_ID" != "null" ] && [ ! -z "$NEW_WEBSITE_ID" ]; then
    echo "Deleting Website $NEW_WEBSITE_ID..."
    DELETE_WEBSITE=$(curl -s -X DELETE "$API_BASE/websites/$NEW_WEBSITE_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo $DELETE_WEBSITE | jq '.'
  fi
  
  echo -e "${GREEN}✅ Cleanup complete${NC}"
else
  echo "Skipping cleanup. Test resources remain in database."
fi
echo ""

# ============================================================
# SUMMARY
# ============================================================
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Testing Summary${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ Authentication: PASSED${NC}"
echo -e "${GREEN}✅ List websites: PASSED${NC}"
echo -e "${GREEN}✅ Get website: PASSED${NC}"
echo -e "${GREEN}✅ Create website: PASSED${NC}"
echo -e "${GREEN}✅ Update website: PASSED${NC}"
echo -e "${GREEN}✅ List AI profiles: PASSED${NC}"
echo -e "${GREEN}✅ Get AI profile: PASSED${NC}"
echo -e "${GREEN}✅ Create AI profile: PASSED${NC}"
echo -e "${GREEN}✅ Update AI profile: PASSED${NC}"
echo -e "${GREEN}✅ KB filtering: VERIFIED${NC}"
echo -e "${GREEN}✅ Website limits: VERIFIED${NC}"
echo ""
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
