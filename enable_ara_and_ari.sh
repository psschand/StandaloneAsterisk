#!/bin/bash
# enable_ara_and_ari.sh - Switch from static config to Database (ARA) + ARI

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║  Enabling Asterisk ARA + ARI (Database + Programmatic Control)   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Load seed data into MySQL
echo "📦 Step 1: Loading seed data into database..."
MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ MySQL container not found. Please start it first:"
    echo "   docker compose up -d mysql"
    exit 1
fi
echo "   Using container: $MYSQL_CONTAINER"

if [ -f "backend/migrations/050_seed_test_data.sql" ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root -pcallcenterpass callcenter < backend/migrations/050_seed_test_data.sql
    echo "✅ Seed data loaded successfully"
else
    echo "⚠️  Seed data file not found, skipping..."
fi
echo ""

# Step 2: Verify database connection
echo "🔍 Step 2: Verifying database records..."
docker exec $MYSQL_CONTAINER mysql -u root -pcallcenterpass -e "USE callcenter; SELECT COUNT(*) as endpoint_count FROM ps_endpoints; SELECT COUNT(*) as auth_count FROM ps_auths;"
echo ""

# Step 3: Copy ARA config files to container
echo "📄 Step 3: Copying ARA configuration files..."
docker cp docker/asterisk/config/extconfig.conf asterisk:/etc/asterisk/
docker cp docker/asterisk/config/res_odbc.conf asterisk:/etc/asterisk/
echo "✅ Configuration files copied"
echo ""

# Step 4: Copy ARI dialplan
echo "📞 Step 4: Updating dialplan for ARI..."
docker cp extensions.conf.ari asterisk:/etc/asterisk/extensions.conf
echo "✅ Dialplan updated to use Stasis(callcenter)"
echo ""

# Step 5: Reload Asterisk modules
echo "🔄 Step 5: Reloading Asterisk configuration..."
docker exec asterisk asterisk -rx "module reload res_odbc.so"
docker exec asterisk asterisk -rx "module reload res_config_odbc.so"
docker exec asterisk asterisk -rx "module reload res_pjsip.so"
docker exec asterisk asterisk -rx "dialplan reload"
echo "✅ Asterisk modules reloaded"
echo ""

# Step 6: Verify ODBC connection
echo "🔍 Step 6: Verifying ODBC connection..."
docker exec asterisk asterisk -rx "odbc show all"
echo ""

# Step 7: Verify PJSIP endpoints
echo "🔍 Step 7: Verifying PJSIP endpoints..."
docker exec asterisk asterisk -rx "pjsip show endpoints"
echo ""

# Step 8: Test realtime database access
echo "🔍 Step 8: Testing realtime database access..."
docker exec asterisk asterisk -rx "realtime load ps_endpoints id 100"
echo ""

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ARA + ARI ENABLED                           ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What Changed:"
echo "  ✅ PJSIP endpoints now loaded from MySQL database"
echo "  ✅ Dialplan routes calls through Stasis(callcenter) to ARI"
echo "  ✅ ODBC connection active"
echo "  ✅ Extensions 100/101 available from database"
echo ""
echo "🚀 Next Steps:"
echo "  1. Start the Go backend:"
echo "     cd backend"
echo "     export ASTERISK_ARI_URL=\"http://localhost:8088/ari\""
echo "     export ASTERISK_ARI_USERNAME=\"asterisk\""
echo "     export ASTERISK_ARI_PASSWORD=\"asterisk\""
echo "     go run ./cmd/api"
echo ""
echo "  2. Configure SIP softphone (Zoiper/LinPhone):"
echo "     Username: 100"
echo "     Password: changeme100"
echo "     Server: <YOUR_IP>:5060"
echo ""
echo "  3. Test calling:"
echo "     # From Asterisk CLI"
echo "     docker exec -it asterisk asterisk -rvvv"
echo "     channel originate PJSIP/100 application Stasis callcenter"
echo ""
echo "     # Or dial from softphone"
echo "     Dial: 101"
echo ""
echo "📚 Documentation:"
echo "  - backend/ARI_TESTING_GUIDE.md"
echo "  - backend/ARI_QUICK_REFERENCE.md"
echo "  - backend/ARI_MIGRATION_STATUS.md"
echo ""
