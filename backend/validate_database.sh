#!/bin/bash

# Database Validation Script
# Validates all tables exist and checks seed data

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database credentials
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="callcenter"
DB_USER="callcenter"
DB_PASS="callcenterpass"

# MySQL command
MYSQL_CMD="docker exec -i mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Database Validation Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if MySQL container is running
if ! docker ps | grep -q mysql; then
    echo -e "${RED}✗ MySQL container is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MySQL container is running${NC}"

# Check database connection
if ! docker exec mysql mysql -u${DB_USER} -p${DB_PASS} -e "SELECT 1" &>/dev/null; then
    echo -e "${RED}✗ Cannot connect to database${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Expected tables
EXPECTED_TABLES=(
    "tenants"
    "users"
    "user_roles"
    "dids"
    "queues"
    "queue_members"
    "cdrs"
    "agent_states"
    "contacts"
    "tickets"
    "ticket_messages"
    "chat_widgets"
    "chat_sessions"
    "chat_messages"
    "chat_agents"
    "chat_transfers"
    "voicemail_messages"
    "sms_messages"
    "recordings"
    "conversations"
    "messages"
    "knowledge_base"
    "handoff_rules"
    "channel_integrations"
    "ai_agent_config"
    "conversation_tags"
    "quick_replies"
    "call_tags"
    "audit_logs"
    "notifications"
    "ivr_menus"
    "ivr_options"
    "call_surveys"
    "survey_responses"
    "schedules"
    "blacklist"
    "speed_dials"
)

# AI Chat specific tables
AI_CHAT_TABLES=(
    "conversations"
    "messages"
    "knowledge_base"
    "handoff_rules"
    "channel_integrations"
    "ai_agent_config"
    "conversation_tags"
    "quick_replies"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Table Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

MISSING_TABLES=()
EXISTING_TABLES=()

for table in "${EXPECTED_TABLES[@]}"; do
    if docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SHOW TABLES LIKE '${table}'" 2>/dev/null | grep -q "${table}"; then
        echo -e "${GREEN}✓${NC} Table: ${table}"
        EXISTING_TABLES+=("$table")
    else
        echo -e "${RED}✗${NC} Table: ${table} ${RED}(MISSING)${NC}"
        MISSING_TABLES+=("$table")
    fi
done

echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}Existing tables: ${#EXISTING_TABLES[@]}${NC}"
echo -e "  ${RED}Missing tables: ${#MISSING_TABLES[@]}${NC}"
echo ""

# AI Chat Tables Detailed Check
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AI Chat Tables Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for table in "${AI_CHAT_TABLES[@]}"; do
    if docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SHOW TABLES LIKE '${table}'" 2>/dev/null | grep -q "${table}"; then
        # Get row count
        ROW_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM ${table}" 2>/dev/null || echo "0")
        
        # Get column count
        COL_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='${table}'" 2>/dev/null || echo "0")
        
        echo -e "${GREEN}✓${NC} ${table}"
        echo -e "    Columns: ${COL_COUNT}, Rows: ${ROW_COUNT}"
    else
        echo -e "${RED}✗${NC} ${table} ${RED}(MISSING)${NC}"
    fi
done
echo ""

# Check seed data
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Seed Data Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check tenants
TENANT_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM tenants" 2>/dev/null || echo "0")
echo -e "Tenants: ${TENANT_COUNT}"
if [ "$TENANT_COUNT" -gt 0 ]; then
    docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SELECT id, name, status FROM tenants LIMIT 5" 2>/dev/null | grep -v "^id" | while read line; do
        echo -e "  ${GREEN}✓${NC} $line"
    done
else
    echo -e "  ${RED}✗ No tenants found${NC}"
fi
echo ""

# Check users
USER_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
echo -e "Users: ${USER_COUNT}"
if [ "$USER_COUNT" -gt 0 ]; then
    docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SELECT id, email, username, status FROM users LIMIT 5" 2>/dev/null | grep -v "^id" | while read line; do
        echo -e "  ${GREEN}✓${NC} $line"
    done
else
    echo -e "  ${RED}✗ No users found${NC}"
fi
echo ""

# Check knowledge base
KB_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM knowledge_base" 2>/dev/null || echo "0")
echo -e "Knowledge Base Entries: ${KB_COUNT}"
if [ "$KB_COUNT" -gt 0 ]; then
    docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SELECT id, category, title, usage_count FROM knowledge_base LIMIT 5" 2>/dev/null | grep -v "^id" | while read line; do
        echo -e "  ${GREEN}✓${NC} $line"
    done
    
    # Check categories
    echo ""
    echo -e "Knowledge Base Categories:"
    docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT category, COUNT(*) as count FROM knowledge_base GROUP BY category" 2>/dev/null | while read line; do
        echo -e "  ${GREEN}✓${NC} $line"
    done
else
    echo -e "  ${RED}✗ No knowledge base entries found${NC}"
fi
echo ""

# Check AI agent config
AI_CONFIG_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM ai_agent_config" 2>/dev/null || echo "0")
echo -e "AI Agent Configs: ${AI_CONFIG_COUNT}"
if [ "$AI_CONFIG_COUNT" -gt 0 ]; then
    docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SELECT tenant_id, is_enabled, model, rag_enabled FROM ai_agent_config LIMIT 5" 2>/dev/null | grep -v "^tenant_id" | while read line; do
        echo -e "  ${GREEN}✓${NC} $line"
    done
else
    echo -e "  ${RED}✗ No AI agent configs found${NC}"
fi
echo ""

# Check handoff rules
HANDOFF_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM handoff_rules" 2>/dev/null || echo "0")
echo -e "Handoff Rules: ${HANDOFF_COUNT}"
if [ "$HANDOFF_COUNT" -gt 0 ]; then
    docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SELECT id, name, trigger_type, is_active FROM handoff_rules LIMIT 5" 2>/dev/null | grep -v "^id" | while read line; do
        echo -e "  ${GREEN}✓${NC} $line"
    done
else
    echo -e "  ${RED}✗ No handoff rules found${NC}"
fi
echo ""

# Check conversations
CONV_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM conversations" 2>/dev/null || echo "0")
echo -e "Conversations: ${CONV_COUNT}"

# Check messages
MSG_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM messages" 2>/dev/null || echo "0")
echo -e "Messages: ${MSG_COUNT}"
echo ""

# Check foreign key constraints
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Foreign Key Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

FK_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} information_schema -sN -e "SELECT COUNT(*) FROM KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DB_NAME}' AND REFERENCED_TABLE_NAME IS NOT NULL" 2>/dev/null || echo "0")
echo -e "Total Foreign Keys: ${FK_COUNT}"
echo ""

# Check indexes
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Index Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

for table in "${AI_CHAT_TABLES[@]}"; do
    if docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -e "SHOW TABLES LIKE '${table}'" 2>/dev/null | grep -q "${table}"; then
        INDEX_COUNT=$(docker exec mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='${table}'" 2>/dev/null || echo "0")
        echo -e "${GREEN}✓${NC} ${table}: ${INDEX_COUNT} indexes"
    fi
done
echo ""

# Final Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Final Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All expected tables exist!${NC}"
else
    echo -e "${RED}✗ Missing ${#MISSING_TABLES[@]} tables:${NC}"
    for table in "${MISSING_TABLES[@]}"; do
        echo -e "  ${RED}✗${NC} $table"
    done
fi
echo ""

# Check if migrations have run
MIGRATION_FILE="/home/ubuntu/wsp/call-center/standalone-asterix/backend/migrations/020_create_ai_chat_tables.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo -e "${GREEN}✓ Migration file exists: 020_create_ai_chat_tables.sql${NC}"
else
    echo -e "${RED}✗ Migration file not found${NC}"
fi
echo ""

# Recommendations
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Recommendations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠ Missing tables detected. Run migrations:${NC}"
    echo -e "  cd /home/ubuntu/wsp/call-center/standalone-asterix/backend"
    echo -e "  docker compose restart backend"
    echo ""
fi

if [ "$KB_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ No knowledge base entries. Seed data:${NC}"
    echo -e "  docker exec -i mysql mysql -ucallcenter -pcallcenterpass callcenter < backend/seed_knowledge_base.sql"
    echo ""
fi

if [ "$TENANT_COUNT" -eq 0 ]; then
    echo -e "${RED}⚠ No tenants found. Create a test tenant:${NC}"
    echo -e "  docker exec -i mysql mysql -ucallcenter -pcallcenterpass callcenter << EOF"
    echo -e "  INSERT INTO tenants (id, name, status, plan) VALUES ('test-tenant-001', 'Test Tenant', 'active', 'enterprise');"
    echo -e "  EOF"
    echo ""
fi

if [ "$USER_COUNT" -eq 0 ]; then
    echo -e "${RED}⚠ No users found. Create a test user:${NC}"
    echo -e "  Use Adminer at http://138.2.68.107:8443/adminer to create users"
    echo ""
fi

echo -e "${GREEN}Validation Complete!${NC}"
