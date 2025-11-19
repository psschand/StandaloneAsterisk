#!/bin/bash
# Quick Test - Multi-Website Architecture
# Run this for a fast API verification

TOKEN=$(curl -s -X POST "http://localhost:8001/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@callcenter.com","password":"Password123!","tenant_id":"demo-tenant"}' | jq -r '.data.access_token')

echo "🔑 Token obtained"
echo ""
echo "📊 WEBSITES:"
curl -s -X GET "http://localhost:8001/api/v1/websites" -H "Authorization: Bearer $TOKEN" | jq '.data | length as $count | "\($count) websites found"'
echo ""
echo "🤖 AI PROFILES:"
curl -s -X GET "http://localhost:8001/api/v1/ai-agent-profiles" -H "Authorization: Bearer $TOKEN" | jq '.data | length as $count | "\($count) AI profiles found"'
echo ""
echo "✅ Quick test complete!"
