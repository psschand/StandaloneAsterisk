#!/bin/bash

# Fix WebRTC Endpoints Configuration Script
# Applies the SQL fix to ensure all WebRTC endpoints have proper configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/fix_webrtc_endpoints.sql"

echo "========================================"
echo "Fixing WebRTC Endpoint Configurations"
echo "========================================"
echo ""

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL file not found: $SQL_FILE"
    exit 1
fi

echo "Applying fixes from: $SQL_FILE"
echo ""

# Apply the SQL fixes
docker exec -i mysql mysql -uroot -pcallcenterpass -Dcallcenter < "$SQL_FILE"

echo ""
echo "✅ WebRTC endpoint configurations updated!"
echo ""

# Reload Asterisk PJSIP to apply changes
echo "Reloading Asterisk PJSIP module..."
docker exec asterisk asterisk -rx "module reload res_pjsip"

echo ""
echo "✅ Complete! All WebRTC endpoints now have consistent configuration."
echo ""
echo "Run validation script to verify:"
echo "  ./scripts/validate_webrtc_endpoints.sh"
echo ""
