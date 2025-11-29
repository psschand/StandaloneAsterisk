#!/bin/bash
# Database Migration Synchronization Script
# Syncs existing Docker MySQL database with migration system

set -e

echo "=========================================="
echo "Database Migration Synchronization"
echo "=========================================="
echo ""

# Configuration
DB_CONTAINER="mysql"
DB_USER="callcenter"
DB_PASS="callcenterpass"
DB_NAME="callcenter"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to execute SQL
exec_sql() {
    docker compose exec -T $DB_CONTAINER mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "$1" 2>/dev/null
}

# Function to check if migrations table exists
check_migrations_table() {
    result=$(exec_sql "SHOW TABLES LIKE 'migrations';" | grep migrations || echo "")
    if [ -z "$result" ]; then
        echo -e "${YELLOW}Creating migrations table...${NC}"
        exec_sql "
        CREATE TABLE IF NOT EXISTS migrations (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );"
        echo -e "${GREEN}✓ Migrations table created${NC}"
    else
        echo -e "${GREEN}✓ Migrations table exists${NC}"
    fi
}

# Function to list applied migrations
list_applied() {
    echo ""
    echo "Applied migrations:"
    exec_sql "SELECT id, name FROM migrations ORDER BY id;"
    echo ""
}

# Function to list all migration files
list_files() {
    echo "Available migration files:"
    ls -1 backend/migrations/*.sql | wc -l
    echo ""
}

# Function to sync existing tables to migrations table
sync_migrations() {
    echo -e "${YELLOW}Synchronizing existing tables with migrations...${NC}"
    
    # Get list of all tables except migrations
    tables=$(exec_sql "SHOW TABLES;" | grep -v "Tables_in" | grep -v "migrations")
    
    # Mark migrations 001-019 as applied (already in database)
    for i in {1..19}; do
        migration_id=$(printf "%03d" $i)
        migration_name=$(ls backend/migrations/${migration_id}_*.sql 2>/dev/null | head -1 | xargs basename | sed 's/.sql$//' | cut -d'_' -f2-)
        
        if [ ! -z "$migration_name" ]; then
            exists=$(exec_sql "SELECT id FROM migrations WHERE id=$i;" | grep -v "id" || echo "")
            if [ -z "$exists" ]; then
                echo "  Marking migration $i ($migration_name) as applied..."
                exec_sql "INSERT IGNORE INTO migrations (id, name) VALUES ($i, '$migration_name');"
            fi
        fi
    done
    
    echo -e "${GREEN}✓ Sync complete${NC}"
}

# Function to clear failed migration
clear_failed() {
    echo -e "${YELLOW}Checking for failed migration 020...${NC}"
    exists=$(exec_sql "SELECT id FROM migrations WHERE id=20;" | grep -v "id" || echo "")
    if [ ! -z "$exists" ]; then
        echo "  Removing failed migration 020..."
        exec_sql "DELETE FROM migrations WHERE id=20;"
        echo -e "${GREEN}✓ Cleared migration 020${NC}"
    else
        echo -e "${GREEN}✓ Migration 020 not in table${NC}"
    fi
}

# Main execution
main() {
    echo "Step 1: Check migrations table"
    check_migrations_table
    
    echo ""
    echo "Step 2: List currently applied migrations"
    list_applied
    
    echo "Step 3: Sync existing tables"
    sync_migrations
    
    echo ""
    echo "Step 4: Clear failed migrations"
    clear_failed
    
    echo ""
    echo "Step 5: Final migration status"
    list_applied
    
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "Synchronization Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Restart backend: docker compose restart backend"
    echo "2. Check logs: docker compose logs backend | grep -i migration"
    echo "3. Verify all migrations applied successfully"
    echo ""
}

# Run main function
main
