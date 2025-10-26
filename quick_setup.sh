#!/bin/bash
# quick_setup.sh - Fast ARA + ARI setup

set -e

echo "🚀 Quick ARA + ARI Setup"
echo ""

# Find MySQL container
MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
[ -z "$MYSQL_CONTAINER" ] && echo "❌ MySQL not running" && exit 1

echo "✅ MySQL: $MYSQL_CONTAINER"

# Combine all migrations into one file
echo "📦 Running migrations..."
cat backend/migrations/0[0-4]*.sql > /tmp/all_migrations.sql 2>/dev/null || true
docker exec -i $MYSQL_CONTAINER mysql -u root -pcallcenterpass callcenter < /tmp/all_migrations.sql 2>&1 | grep -v "Warning" | grep -v "^$" || echo "   Done"

# Load seed data
echo "📦 Loading PJSIP seed data..."
docker exec -i $MYSQL_CONTAINER mysql -u root -pcallcenterpass callcenter < backend/migrations/050_seed_pjsip_only.sql 2>&1 | grep -v "Warning" | grep -v "^$" || echo "   Done"

# Create ARA configs
echo "📝 Creating ARA configs..."
docker exec asterisk sh -c 'cat > /etc/asterisk/res_odbc.conf << EOF
[asterisk]
enabled => yes
dsn => asterisk-connector
username => callcenter
password => callcenter123
pre-connect => yes
max_connections => 10
EOF'

docker exec asterisk sh -c 'cat > /etc/asterisk/extconfig.conf << EOF
[settings]
ps_endpoints => odbc,asterisk,ps_endpoints
ps_auths => odbc,asterisk,ps_auths
ps_aors => odbc,asterisk,ps_aors
ps_contacts => odbc,asterisk,ps_contacts
queues => odbc,asterisk,queues
queue_members => odbc,asterisk,queue_members
EOF'

# Update dialplan
echo "📝 Updating dialplan..."
docker exec asterisk cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.conf.backup 2>/dev/null || true
docker cp extensions.conf.ari asterisk:/etc/asterisk/extensions.conf

# Reload Asterisk
echo "🔄 Reloading Asterisk..."
docker exec asterisk asterisk -rx "module load res_odbc.so" 2>&1 | grep -v "is already" || true
docker exec asterisk asterisk -rx "module load res_config_odbc.so" 2>&1 | grep -v "is already" || true
docker exec asterisk asterisk -rx "module reload res_pjsip.so" 2>&1 > /dev/null
docker exec asterisk asterisk -rx "dialplan reload" 2>&1 > /dev/null

echo ""
echo "✅ DONE!"
echo ""
echo "📞 Test with:"
echo "   Extension 100: password=changeme100"
echo "   Extension 101: password=changeme101"
echo ""
docker exec asterisk asterisk -rx "pjsip show endpoints" 2>&1 | head -15
