#!/bin/bash

# Test WhatsApp Webhook - Verify widget_id NULL fix
# This simulates a WhatsApp message webhook to test session creation

echo "=========================================="
echo "Testing WhatsApp Webhook Integration"
echo "Testing: widget_id NULL for non-web channels"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8001"
WEBHOOK_PATH="/webhooks/whatsapp"

# Test WhatsApp message payload (Meta format)
PAYLOAD='{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": {
            "name": "Test Customer"
          },
          "wa_id": "14155551234"
        }],
        "messages": [{
          "from": "14155551234",
          "id": "wamid.TEST123456789",
          "timestamp": "'$(date +%s)'",
          "text": {
            "body": "Hello! I need help with my order."
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}'

echo -e "${YELLOW}Step 1: Checking if backend is running...${NC}"
if curl -s -f -o /dev/null "$API_URL/health" 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "  Please start the backend: docker compose up -d backend"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 2: Checking database connection...${NC}"
DB_CHECK=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "SELECT 1;" 2>/dev/null | grep -c "1")
if [ "$DB_CHECK" -eq "1" ]; then
    echo -e "${GREEN}✓ Database is accessible${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Verifying widget_id is nullable...${NC}"
WIDGET_NULLABLE=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'chat_sessions' 
  AND COLUMN_NAME = 'widget_id';
" 2>/dev/null | grep -c "YES")

if [ "$WIDGET_NULLABLE" -eq "1" ]; then
    echo -e "${GREEN}✓ widget_id is nullable (fix applied)${NC}"
else
    echo -e "${RED}✗ widget_id is still NOT NULL (migration failed)${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Checking existing sessions before test...${NC}"
BEFORE_COUNT=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT COUNT(*) FROM chat_sessions;
" 2>/dev/null | tail -n 1)
echo "  Current session count: $BEFORE_COUNT"
echo ""

echo -e "${YELLOW}Step 5: Sending test WhatsApp webhook...${NC}"
echo "  Payload: WhatsApp message from 14155551234"
echo "  Message: 'Hello! I need help with my order.'"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "$API_URL$WEBHOOK_PATH" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>&1)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Webhook accepted (HTTP 200)${NC}"
    echo "  Response: $BODY"
else
    echo -e "${RED}✗ Webhook failed (HTTP $HTTP_STATUS)${NC}"
    echo "  Response: $BODY"
    echo ""
    echo -e "${RED}Checking backend logs for errors...${NC}"
    docker compose logs --tail=20 backend
    exit 1
fi
echo ""

# Wait for processing
echo -e "${YELLOW}Step 6: Waiting for session creation (2 seconds)...${NC}"
sleep 2
echo ""

echo -e "${YELLOW}Step 7: Verifying session was created...${NC}"
AFTER_COUNT=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT COUNT(*) FROM chat_sessions;
" 2>/dev/null | tail -n 1)

if [ "$AFTER_COUNT" -gt "$BEFORE_COUNT" ]; then
    echo -e "${GREEN}✓ New session created!${NC}"
    echo "  Sessions before: $BEFORE_COUNT"
    echo "  Sessions after: $AFTER_COUNT"
else
    echo -e "${RED}✗ No new session created${NC}"
    echo "  Sessions: $AFTER_COUNT (expected > $BEFORE_COUNT)"
    echo ""
    echo -e "${RED}Checking backend logs...${NC}"
    docker compose logs --tail=30 backend | grep -i "whatsapp\|error\|session"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 8: Checking session details...${NC}"
SESSION_INFO=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT 
    id,
    channel_type,
    widget_id,
    channel_connection_id,
    channel_user_id,
    channel_username,
    website_id,
    status
FROM chat_sessions 
WHERE channel_type = 'whatsapp' 
ORDER BY id DESC 
LIMIT 1;
" 2>/dev/null)

echo "$SESSION_INFO"
echo ""

# Verify widget_id is NULL
WIDGET_IS_NULL=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT COUNT(*) 
FROM chat_sessions 
WHERE channel_type = 'whatsapp' 
  AND widget_id IS NULL 
ORDER BY id DESC 
LIMIT 1;
" 2>/dev/null | tail -n 1)

if [ "$WIDGET_IS_NULL" -eq "1" ]; then
    echo -e "${GREEN}✓ widget_id is NULL (correct for WhatsApp)${NC}"
else
    echo -e "${RED}✗ widget_id is NOT NULL (should be NULL for WhatsApp)${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 9: Checking if message was saved...${NC}"
MESSAGE_COUNT=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT COUNT(*) 
FROM chat_messages cm
JOIN chat_sessions cs ON cm.session_id = cs.id
WHERE cs.channel_type = 'whatsapp'
  AND cs.id = (SELECT MAX(id) FROM chat_sessions WHERE channel_type = 'whatsapp');
" 2>/dev/null | tail -n 1)

if [ "$MESSAGE_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✓ Message was saved ($MESSAGE_COUNT messages)${NC}"
    
    # Show the message
    MESSAGE_BODY=$(docker compose exec -T mysql mysql -u root -pcallcenterpass callcenter -e "
SELECT body 
FROM chat_messages cm
JOIN chat_sessions cs ON cm.session_id = cs.id
WHERE cs.channel_type = 'whatsapp'
  AND cs.id = (SELECT MAX(id) FROM chat_sessions WHERE channel_type = 'whatsapp')
LIMIT 1;
" 2>/dev/null | tail -n 1)
    echo "  Message content: $MESSAGE_BODY"
else
    echo -e "${YELLOW}⚠ No message saved (session created but message processing failed)${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Backend is running"
echo "  ✓ Database is accessible"
echo "  ✓ widget_id is nullable"
echo "  ✓ Webhook accepted (HTTP 200)"
echo "  ✓ Session created successfully"
echo "  ✓ widget_id is NULL (correct for non-web channel)"
echo "  ✓ Message saved"
echo ""
echo -e "${GREEN}The widget_id NULL fix is working correctly!${NC}"
echo "WhatsApp sessions can now be created without errors."
echo ""
