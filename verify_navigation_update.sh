#!/bin/bash

# Quick Verification Script for New Navigation
# Run this to verify the deployment is successful

echo "========================================="
echo "🔍 Verifying Omnichannel Navigation Update"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Frontend container running
echo -n "1. Checking frontend container... "
if docker ps | grep -q "frontend"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    exit 1
fi

# Check 2: Frontend serving content
echo -n "2. Checking frontend is accessible... "
if curl -s http://localhost/ > /dev/null; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
    exit 1
fi

# Check 3: New bundle deployed
echo -n "3. Checking bundle version... "
BUNDLE=$(curl -s http://localhost/ | grep -o "index-[^.]*\.js" | head -1)
if [ "$BUNDLE" == "index-HKnSoQL9.js" ]; then
    echo -e "${GREEN}✓ Latest bundle: $BUNDLE${NC}"
else
    echo -e "${YELLOW}⚠ Different bundle: $BUNDLE${NC}"
fi

# Check 4: Navigation items in bundle
echo -n "4. Checking 'Omnichannel Chat'... "
if docker exec frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js" | grep -q "Omnichannel Chat"; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

echo -n "5. Checking 'Channel AI Settings'... "
if docker exec frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js" | grep -q "Channel AI Settings"; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

echo -n "6. Checking 'Websites & Properties'... "
if docker exec frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js" | grep -q "Websites & Properties"; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

echo -n "7. Checking 'WhatsApp Business'... "
if docker exec frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js" | grep -q "WhatsApp Business"; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

echo -n "8. Checking 'Facebook Messenger'... "
if docker exec frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js" | grep -q "Facebook Messenger"; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

echo -n "9. Checking 'Instagram DM'... "
if docker exec frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js" | grep -q "Instagram DM"; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

# Check 10: Backend API accessible
echo -n "10. Checking backend API... "
if curl -s http://localhost:8001/health | grep -q "ok"; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Not healthy${NC}"
fi

# Check 11: Dev server (optional)
echo -n "11. Checking dev server... "
if curl -s http://localhost:5174/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running on port 5174${NC}"
elif curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running on port 5173${NC}"
else
    echo -e "${YELLOW}⚠ Not running (optional)${NC}"
fi

echo ""
echo "========================================="
echo "📊 Summary"
echo "========================================="
echo ""
echo "Production Frontend: http://localhost/"
echo "Dev Server: http://localhost:5174/ (or 5173)"
echo "Backend API: http://localhost:8001/"
echo ""
echo "Test Credentials:"
echo "  Email:    admin@callcenter.com"
echo "  Password: Password123!"
echo "  Tenant:   demo-tenant"
echo ""
echo "========================================="
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Open http://localhost/ in your browser"
echo "2. Login with the credentials above"
echo "3. Check the 'Omnichannel Chat' module"
echo "4. Verify 'Websites & Properties' and 'Channel AI Settings' are there"
echo "5. Test creating websites and AI profiles"
echo ""
