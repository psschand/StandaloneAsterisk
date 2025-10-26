#!/bin/bash
# rollback_to_static.sh - Revert to static config files (disable ARA/ARI)

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║          Rolling Back to Static Configuration (No ARI)           ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Restore original dialplan
echo "📄 Step 1: Restoring original dialplan..."
if [ -f "docker/asterisk/config/extensions.conf" ]; then
    docker cp docker/asterisk/config/extensions.conf asterisk:/etc/asterisk/extensions.conf
    echo "✅ Original dialplan restored"
else
    echo "⚠️  Original extensions.conf not found in docker/asterisk/config/"
fi
echo ""

# Step 2: Remove ARA config files
echo "🗑️  Step 2: Removing ARA configuration..."
docker exec asterisk rm -f /etc/asterisk/extconfig.conf
docker exec asterisk rm -f /etc/asterisk/res_odbc.conf
echo "✅ ARA config files removed"
echo ""

# Step 3: Reload Asterisk
echo "🔄 Step 3: Reloading Asterisk configuration..."
docker exec asterisk asterisk -rx "module reload res_odbc.so"
docker exec asterisk asterisk -rx "module reload res_pjsip.so"
docker exec asterisk asterisk -rx "dialplan reload"
echo "✅ Asterisk reloaded"
echo ""

# Step 4: Verify endpoints
echo "🔍 Step 4: Verifying PJSIP endpoints (from static config)..."
docker exec asterisk asterisk -rx "pjsip show endpoints"
echo ""

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║              ✅ ROLLED BACK TO STATIC CONFIG                      ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What Changed:"
echo "  ✅ PJSIP endpoints now from static files (pjsip.conf)"
echo "  ✅ Dialplan using traditional Dial() commands"
echo "  ✅ ODBC/ARA disabled"
echo "  ✅ No ARI programmatic control"
echo ""
echo "ℹ️  Your system is back to the original static configuration."
echo ""
