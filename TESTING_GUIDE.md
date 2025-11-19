# Manual Testing Guide - Multi-Website Architecture

## Prerequisites

- Backend server running: `docker compose up -d backend`
- MySQL database accessible
- `curl` and `jq` installed
- Test credentials available

## Quick Start

### Run Automated Test Suite
```bash
cd /home/ubuntu/wsp/call-center/standalone-asterix
chmod +x test_multi_website_api.sh
./test_multi_website_api.sh
```

This will test all endpoints automatically and show results.

---

## Manual Testing Steps

### 1. Authentication

**Test Login:**
```bash
curl -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@callcenter.com",
    "password": "Password123!",
    "tenant_id": "demo-tenant"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "user": { ... },
    "expires_in": 3600
  },
  "success": true
}
```

**Save Token for Next Steps:**
```bash
TOKEN=$(curl -s -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!","tenant_id":"demo-tenant"}' \
  | jq -r '.data.access_token')

echo "Token: $TOKEN"
```

---

### 2. Website Management

#### List All Websites
```bash
curl -X GET "http://localhost:8001/api/v1/websites" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** List of 4 demo websites

#### Get Specific Website
```bash
curl -X GET "http://localhost:8001/api/v1/websites/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** E-commerce Store details

#### Create New Website
```bash
curl -X POST "http://localhost:8001/api/v1/websites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Portal",
    "domain": "portal.example.com",
    "description": "Self-service customer portal",
    "is_active": true
  }' | jq '.'
```

**Expected:** New website with ID

#### Update Website
```bash
curl -X PUT "http://localhost:8001/api/v1/websites/5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated portal description"
  }' | jq '.'
```

**Expected:** Success message with updated data

#### Delete Website
```bash
curl -X DELETE "http://localhost:8001/api/v1/websites/5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** Success message

---

### 3. AI Profile Management

#### List All AI Profiles
```bash
curl -X GET "http://localhost:8001/api/v1/ai-agent-profiles" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** List of 4+ AI profiles with KB tags

#### Get Specific AI Profile
```bash
curl -X GET "http://localhost:8001/api/v1/ai-agent-profiles/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** E-commerce Support Bot details

#### Create New AI Profile
```bash
curl -X POST "http://localhost:8001/api/v1/ai-agent-profiles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_name": "Customer Service Bot",
    "description": "General customer service assistant",
    "website_id": 1,
    "model": "gemini-2.0-flash",
    "system_prompt": "You are a helpful customer service assistant.",
    "temperature": 0.7,
    "max_tokens": 500,
    "rag_enabled": true,
    "kb_tags": ["customer-service", "general", "support"],
    "is_default": false
  }' | jq '.'
```

**Expected:** New AI profile with ID

#### Update AI Profile
```bash
curl -X PUT "http://localhost:8001/api/v1/ai-agent-profiles/6" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 0.8,
    "max_tokens": 600,
    "kb_tags": ["customer-service", "general", "support", "faq"]
  }' | jq '.'
```

**Expected:** Success message with updated data

#### Delete AI Profile
```bash
curl -X DELETE "http://localhost:8001/api/v1/ai-agent-profiles/6" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** Success message

#### Get Profile by Widget
```bash
curl -X GET "http://localhost:8001/api/v1/ai-agent-profiles/by-widget/your-widget-id" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

#### Link Profile to Widget
```bash
curl -X PUT "http://localhost:8001/api/v1/ai-agent-profiles/link-widget/your-widget-id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": 1}' | jq '.'
```

---

### 4. Database Verification

#### Check Tenant Configuration
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, name, domain_mode, max_websites, status FROM tenants WHERE id='demo-tenant';"
```

**Expected:**
- domain_mode: multiple
- max_websites: 10
- status: active

#### Check Websites
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, name, domain, is_active FROM websites WHERE tenant_id='demo-tenant';"
```

#### Check AI Profiles
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, profile_name, website_id, kb_tags FROM ai_agent_config WHERE tenant_id='demo-tenant';"
```

#### Check Knowledge Base Tags
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, title, category, tags FROM knowledge_base WHERE is_active=1 AND tags IS NOT NULL LIMIT 10;"
```

---

### 5. Test KB Tag Filtering

#### Query Articles Matching E-commerce Tags
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, title, tags FROM knowledge_base 
   WHERE is_active=1 
   AND (JSON_CONTAINS(tags, '\"ecommerce\"') 
        OR JSON_CONTAINS(tags, '\"products\"') 
        OR JSON_CONTAINS(tags, '\"shipping\"') 
        OR JSON_CONTAINS(tags, '\"returns\"'));"
```

**Expected:** Articles about ecommerce, products, shipping, returns

#### Query Articles Matching Technical Tags
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, title, tags FROM knowledge_base 
   WHERE is_active=1 
   AND (JSON_CONTAINS(tags, '\"technical\"') 
        OR JSON_CONTAINS(tags, '\"support\"') 
        OR JSON_CONTAINS(tags, '\"troubleshooting\"'));"
```

**Expected:** Articles about technical support and troubleshooting

---

### 6. Test Error Cases

#### Try Creating Website Beyond Limit
First, check current count and limit:
```bash
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -se \
  "SELECT COUNT(*) as current, 
          (SELECT max_websites FROM tenants WHERE id='demo-tenant') as max 
   FROM websites WHERE tenant_id='demo-tenant';"
```

If at limit, try creating one more:
```bash
curl -X POST "http://localhost:8001/api/v1/websites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Extra Website","domain":"extra.example.com"}' | jq '.'
```

**Expected:** Error message about limit reached

#### Try Accessing Without Token
```bash
curl -X GET "http://localhost:8001/api/v1/websites" | jq '.'
```

**Expected:** 401 Unauthorized error

#### Try Accessing Other Tenant's Data
(This would require a different tenant - should be blocked by tenant_id filter)

---

### 7. Test Widget Linking Flow

#### 1. Create a widget (if not exists)
```bash
# Use existing widget or check chat_widgets table
docker compose exec mysql mysql -u root -pcallcenterpass callcenter -e \
  "SELECT id, name, tenant_id FROM chat_widgets WHERE tenant_id='demo-tenant' LIMIT 1;"
```

#### 2. Link AI profile to widget
```bash
WIDGET_ID="your-widget-id-here"
curl -X PUT "http://localhost:8001/api/v1/ai-agent-profiles/link-widget/$WIDGET_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": 1}' | jq '.'
```

#### 3. Verify the link
```bash
curl -X GET "http://localhost:8001/api/v1/ai-agent-profiles/by-widget/$WIDGET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

### 8. Performance Testing

#### Concurrent Requests Test
```bash
# Install Apache Bench if needed
# sudo apt-get install apache2-utils

# Test list websites endpoint
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/v1/websites
```

#### Response Time Test
```bash
time curl -X GET "http://localhost:8001/api/v1/ai-agent-profiles" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
```

---

### 9. Check Backend Logs

#### View All Logs
```bash
docker compose logs backend --tail=50
```

#### Filter for Errors
```bash
docker compose logs backend --tail=100 | grep -i error
```

#### Follow Logs in Real-Time
```bash
docker compose logs backend -f
```

#### Check Specific Routes
```bash
docker compose logs backend | grep "websites\|ai-agent-profiles"
```

---

### 10. Verify Route Registration

```bash
docker compose logs backend | grep "\[GIN-debug\]" | grep -E "(websites|ai-agent-profiles)"
```

**Expected Output:**
```
[GIN-debug] POST   /api/v1/websites
[GIN-debug] GET    /api/v1/websites
[GIN-debug] GET    /api/v1/websites/:id
[GIN-debug] PUT    /api/v1/websites/:id
[GIN-debug] DELETE /api/v1/websites/:id
[GIN-debug] GET    /api/v1/ai-agent-profiles
[GIN-debug] POST   /api/v1/ai-agent-profiles
[GIN-debug] GET    /api/v1/ai-agent-profiles/:id
[GIN-debug] PUT    /api/v1/ai-agent-profiles/:id
[GIN-debug] DELETE /api/v1/ai-agent-profiles/:id
[GIN-debug] GET    /api/v1/ai-agent-profiles/by-widget/:widget_id
[GIN-debug] PUT    /api/v1/ai-agent-profiles/link-widget/:widget_id
```

---

## Testing Checklist

- [ ] Authentication works with tenant_id
- [ ] Can list all websites for tenant
- [ ] Can create new website
- [ ] Can update existing website
- [ ] Can delete website
- [ ] Website limit enforced correctly
- [ ] Can list all AI profiles for tenant
- [ ] Can create new AI profile with KB tags
- [ ] Can update AI profile
- [ ] Can delete AI profile
- [ ] KB tags stored as JSON array
- [ ] JSON_CONTAINS filtering works
- [ ] Widget linking works
- [ ] Tenant isolation enforced (can't access other tenant's data)
- [ ] All routes return proper JSON responses
- [ ] Error messages are descriptive

---

## Common Issues & Solutions

### Issue: Token is null
**Solution:** Make sure to include `tenant_id` in login request

### Issue: "Invalid or expired token"
**Solution:** Get a fresh token, they expire after 1 hour

### Issue: "Failed to verify tenant settings"
**Solution:** Check if tenant exists and has correct schema

### Issue: "Invalid JSON text" for kb_tags
**Solution:** This was fixed by using Omit() - rebuild backend if you see this

### Issue: Routes not appearing
**Solution:** Do a full rebuild: `docker compose build backend --no-cache`

### Issue: Empty string for supported_languages
**Solution:** Column was altered to allow NULL, rebuild backend

---

## Cleanup After Testing

### Remove Test Data
```bash
# Get token first
TOKEN=$(curl -s -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!","tenant_id":"demo-tenant"}' \
  | jq -r '.data.access_token')

# Delete test AI profile
curl -X DELETE "http://localhost:8001/api/v1/ai-agent-profiles/6" \
  -H "Authorization: Bearer $TOKEN"

# Delete test website
curl -X DELETE "http://localhost:8001/api/v1/websites/5" \
  -H "Authorization: Bearer $TOKEN"
```

### Reset to Demo State
```bash
# Re-run seed scripts
docker exec -i mysql mysql -ucallcenter -pcallcenterpass callcenter < backend/seed_demo_websites.sql
```

---

## Next Steps After Testing

1. **Frontend Development**
   - Create website management UI
   - Create AI profile management UI
   - Update widget designer

2. **Integration Testing**
   - Test complete flow: Create website → Create profile → Link to widget → Test chat

3. **Performance Optimization**
   - Add caching for AI profiles
   - Optimize KB tag queries with indexes

4. **Documentation**
   - Update API documentation
   - Create video tutorial
   - Write user guide

---

## Support

If you encounter issues:
1. Check backend logs: `docker compose logs backend --tail=50`
2. Verify database schema: Run migrations again
3. Check API reference: See `API_REFERENCE_MULTI_WEBSITE.md`
4. Review implementation docs: See `MULTI_WEBSITE_IMPLEMENTATION_COMPLETE.md`
