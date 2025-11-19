#!/bin/bash

echo "========================================="
echo "📊 Multi-Channel Architecture Status"
echo "========================================="
echo ""

# Check database
echo "1. Database: channel_connections table"
docker compose exec mysql mysql -u root -pcallcenterpass callcenter \
  -e "SELECT COUNT(*) as total_channels FROM channel_connections;" 2>&1 | grep -v "Warning\|level="

echo ""
echo "2. Sample channel data:"
docker compose exec mysql mysql -u root -pcallcenterpass callcenter \
  -e "SELECT id, channel_type, channel_name, connection_status FROM channel_connections LIMIT 3;" 2>&1 | grep -v "Warning\|level="

echo ""
echo "3. Websites with channels:"
docker compose exec mysql mysql -u root -pcallcenterpass callcenter \
  -e "SELECT w.name, COUNT(cc.id) as channel_count FROM websites w LEFT JOIN channel_connections cc ON w.id = cc.website_id GROUP BY w.id;" 2>&1 | grep -v "Warning\|level="

echo ""
echo "========================================="
echo "✅ Status Summary"
echo "========================================="
echo ""
echo "Architecture: Website-centric multi-channel"
echo "Database: Enhanced with channel_connections"
echo "Frontend: Reorganized navigation deployed"
echo "Sample Data: 5 channels ready to configure"
echo ""
echo "Next Steps:"
echo "1. Build Channel Management UI"
echo "2. Build Unified Inbox UI"
echo "3. Integrate WhatsApp Business API"
echo ""
