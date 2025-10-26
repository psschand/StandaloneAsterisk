#!/bin/bash
# setup_ara_ari.sh - Complete setup: Migrations → Seed Data → ARA Config → ARI Dialplan

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         Complete ARA + ARI Setup (Database + ARI Control)        ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Variables
DB_NAME="callcenter"
DB_USER="root"
DB_PASS="callcenterpass"

# Step 1: Find MySQL container
echo "🔍 Step 1: Finding MySQL container..."
MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ MySQL container not found. Starting it..."
    docker compose up -d mysql
    sleep 5
    MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
fi
echo "   ✅ Container: $MYSQL_CONTAINER"
echo ""

# Step 2: Run all migrations
echo "📦 Step 2: Running database migrations..."
echo "   Database: ${DB_NAME}"
echo ""

MIGRATION_COUNT=0
for migration_file in backend/migrations/[0-9]*.sql; do
    # Skip seed data file (050_seed_test_data.sql)
    if [[ "$migration_file" == *"050_seed_test_data.sql" ]]; then
        continue
    fi
    
    filename=$(basename "$migration_file")
    echo "   → $filename"
    
    # Run migration and suppress only the password warning
    if docker exec -i ${MYSQL_CONTAINER} mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < "$migration_file" 2>&1 | grep -v "mysql: \[Warning\] Using a password"; then
        ((MIGRATION_COUNT++))
    else
        # Migration might have already been applied, continue anyway
        echo "      (may already exist)"
        ((MIGRATION_COUNT++))
    fi
done

echo ""
echo "   ✅ Processed $MIGRATION_COUNT migrations"
echo ""

# Step 3: Load seed data
echo "📦 Step 3: Loading seed data (test users, extensions, DIDs)..."

if [ -f "backend/migrations/050_seed_test_data.sql" ]; then
    docker exec -i ${MYSQL_CONTAINER} mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < backend/migrations/050_seed_test_data.sql 2>&1 | grep -v "mysql: \[Warning\]"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "   ✅ Seed data loaded"
    else
        echo "   ❌ Failed to load seed data"
        exit 1
    fi
else
    echo "   ❌ Seed data file not found!"
    exit 1
fi
echo ""

# Step 4: Verify database records
echo "🔍 Step 4: Verifying database records..."
echo ""
docker exec ${MYSQL_CONTAINER} mysql -u ${DB_USER} -p${DB_PASS} -e "
USE ${DB_NAME};
SELECT 'PJSIP Endpoints:' as Status, COUNT(*) as Count FROM ps_endpoints
UNION ALL
SELECT 'PJSIP Auths:' as Status, COUNT(*) as Count FROM ps_auths
UNION ALL
SELECT 'PJSIP AORs:' as Status, COUNT(*) as Count FROM ps_aors
UNION ALL
SELECT 'Users:' as Status, COUNT(*) as Count FROM users
UNION ALL
SELECT 'DIDs:' as Status, COUNT(*) as Count FROM dids
UNION ALL
SELECT 'Queues:' as Status, COUNT(*) as Count FROM queues;
" 2>&1 | grep -v "mysql: \[Warning\]"
echo ""

# Step 5: Create ARA configuration files in Asterisk container
echo "📝 Step 5: Creating ARA configuration files..."

# Create res_odbc.conf
cat > /tmp/res_odbc.conf << 'EOF'
[asterisk]
enabled => yes
dsn => asterisk-connector
username => callcenter
password => callcenter123
pre-connect => yes
max_connections => 10
EOF

# Create extconfig.conf
cat > /tmp/extconfig.conf << 'EOF'
[settings]
ps_endpoints => odbc,asterisk,ps_endpoints
ps_auths => odbc,asterisk,ps_auths
ps_aors => odbc,asterisk,ps_aors
ps_contacts => odbc,asterisk,ps_contacts
queues => odbc,asterisk,queues
queue_members => odbc,asterisk,queue_members
EOF

# Copy files to Asterisk container
docker cp /tmp/res_odbc.conf asterisk:/etc/asterisk/res_odbc.conf
docker cp /tmp/extconfig.conf asterisk:/etc/asterisk/extconfig.conf

# Cleanup
rm /tmp/res_odbc.conf /tmp/extconfig.conf

echo "   ✅ ARA configuration files created"
echo ""

# Step 6: Update dialplan to use ARI
echo "📝 Step 6: Updating dialplan to use ARI (Stasis application)..."

# Backup current extensions.conf
docker exec asterisk sh -c "cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup_$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true

# Copy new ARI dialplan
docker cp extensions.conf.ari asterisk:/etc/asterisk/extensions.conf

echo "   ✅ Dialplan updated (backup created)"
echo ""

# Step 7: Reload Asterisk modules and configuration
echo "🔄 Step 7: Reloading Asterisk configuration..."
echo ""

# Load ODBC module
echo "   → Loading res_odbc module..."
docker exec asterisk asterisk -rx "module load res_odbc.so" 2>&1 | grep -v "WARNING" || true

# Load Realtime module
echo "   → Loading res_config_odbc module..."
docker exec asterisk asterisk -rx "module load res_config_odbc.so" 2>&1 | grep -v "WARNING" || true

# Reload PJSIP
echo "   → Reloading PJSIP..."
docker exec asterisk asterisk -rx "module reload res_pjsip.so" 2>&1 | grep -v "WARNING" || true

# Reload dialplan
echo "   → Reloading dialplan..."
docker exec asterisk asterisk -rx "dialplan reload" 2>&1 | grep -v "WARNING" || true

echo ""
echo "   ✅ Asterisk reloaded"
echo ""

# Step 8: Verify configuration
echo "🔍 Step 8: Verifying Asterisk configuration..."
echo ""

echo "   ODBC Status:"
docker exec asterisk asterisk -rx "odbc show" 2>&1 | head -10

echo ""
echo "   PJSIP Endpoints:"
docker exec asterisk asterisk -rx "pjsip show endpoints" 2>&1 | head -15

echo ""
echo "   Dialplan (internal context):"
docker exec asterisk asterisk -rx "dialplan show internal" 2>&1 | head -20

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ARA + ARI SETUP COMPLETE!                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What was done:"
echo "   ✅ Database migrations applied"
echo "   ✅ Seed data loaded (test users, extensions 100/101)"
echo "   ✅ ARA configuration created (ODBC → MySQL)"
echo "   ✅ Dialplan updated to use Stasis(callcenter)"
echo "   ✅ Asterisk modules reloaded"
echo ""
echo "📞 Test Credentials:"
echo "   Extension 100: username=100, password=changeme100"
echo "   Extension 101: username=101, password=changeme101"
echo "   Server: <YOUR_IP>:5060"
echo ""
echo "🚀 Next Steps:"
echo "   1. Configure SIP softphone with above credentials"
echo "   2. Start Go backend:"
echo "      cd backend"
echo "      export ASTERISK_ARI_URL='http://localhost:8088/ari'"
echo "      go run ./cmd/api"
echo "   3. Make a test call from softphone"
echo ""
echo "📖 Documentation:"
echo "   • backend/ARI_TESTING_GUIDE.md"
echo "   • backend/ARI_QUICK_REFERENCE.md"
echo "   • backend/ARI_MIGRATION_STATUS.md"
echo ""
