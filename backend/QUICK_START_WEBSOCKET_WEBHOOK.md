# Quick Start: WebSocket + Webhooks

## 1. Start Redis (Optional but Recommended)
```bash
docker run -d --name callcenter-redis -p 6379:6379 redis:latest
```

## 2. Configure Environment
```bash
cd /home/ubuntu/wsp/call-center/standalone-asterix/backend

# Create .env file
cat > .env <<EOF
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=callcenter
DB_PASSWORD=your-password
DB_NAME=callcenter

# JWT
JWT_SECRET=your-secret-key-change-this-in-production

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
SERVER_ENV=development

# Redis (optional - enables multi-server mode)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
EOF
```

## 3. Run Migrations
```bash
# Ensure webhooks table exists
mysql -u root -p callcenter < migrations/030_create_webhooks_table.sql
mysql -u root -p callcenter < migrations/031_create_webhook_logs_table.sql
```

## 4. Start Server
```bash
go run ./cmd/api
```

**Expected Output:**
```
Database connected successfully
Repositories initialized
Redis connected successfully
WebSocket PubSubHub started (multi-server mode)
Webhook manager started with 10 workers
Event broadcaster initialized (WebSocket + Webhooks)
Services initialized
Handlers initialized
Starting server on 0.0.0.0:8000
```

## 5. Test WebSocket Connection

### Install wscat
```bash
npm install -g wscat
```

### Login and Get JWT Token
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.data.access_token')

echo $TOKEN
```

### Connect to WebSocket
```bash
wscat -c "ws://localhost:8000/ws" -H "Authorization: Bearer $TOKEN"

# You should see:
# Connected (press CTRL+C to quit)
```

## 6. Create a Test Webhook

### Using RequestBin (for testing)
1. Go to https://requestbin.com/
2. Click "Create a RequestBin"
3. Copy the bin URL (e.g., `https://xxxxxx.x.pipedream.net`)

### Create Webhook
```bash
curl -X POST http://localhost:8000/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://xxxxxx.x.pipedream.net",
    "events": ["agent.state.changed", "call.incoming", "chat.message"],
    "secret": "test-secret-123",
    "retry_count": 3,
    "timeout": 30
  }'
```

## 7. Test Webhook Delivery
```bash
# Get webhook ID from previous response (e.g., 1)
WEBHOOK_ID=1

# Send test webhook
curl -X POST http://localhost:8000/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $TOKEN"

# Check RequestBin - you should see the test payload
```

## 8. Check Webhook Logs
```bash
# View delivery logs
curl http://localhost:8000/api/v1/webhooks/$WEBHOOK_ID/logs \
  -H "Authorization: Bearer $TOKEN" | jq

# View stats
curl http://localhost:8000/api/v1/webhooks/$WEBHOOK_ID/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 9. Test Presence Tracking
```bash
# In one terminal - connect to WebSocket
wscat -c "ws://localhost:8000/ws" -H "Authorization: Bearer $TOKEN"

# In another terminal - check if user is online
USER_ID="your-user-id"  # Get from JWT token or /auth/me endpoint
curl http://localhost:8000/api/v1/ws/users/$USER_ID/online \
  -H "Authorization: Bearer $TOKEN" | jq

# Should return: {"success": true, "data": {"online": true}}
```

## 10. Check Redis Presence
```bash
# List all online users for a tenant
redis-cli SMEMBERS 'callcenter:online:tenant-123'

# Check specific user
redis-cli SISMEMBER 'callcenter:online:tenant-123' 'user-456'

# Check heartbeat
redis-cli GET 'callcenter:presence:tenant-123:user-456'
```

## 11. Test Hub Statistics
```bash
curl http://localhost:8000/api/v1/ws/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total_clients": 1,
    "total_tenants": 1,
    "clients_by_tenant": {
      "tenant-123": 1
    }
  }
}
```

## Common Issues

### Redis Connection Failed
If you see:
```
Warning: Redis connection failed: ... (WebSocket will work in local mode only)
WebSocket Hub started (single-server mode)
```

**Solution**: Start Redis or ignore if running single server
```bash
docker run -d --name callcenter-redis -p 6379:6379 redis:latest
```

### WebSocket Connection Refused
**Check**:
1. Server is running on correct port
2. JWT token is valid
3. Authorization header is correctly formatted

### Webhooks Not Firing
**Check**:
1. Webhook record exists in database
2. `is_active` = true
3. Event type matches what you're testing
4. Check webhook logs for errors

## Production Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `SERVER_ENV=production`
- [ ] Use strong database password
- [ ] Set Redis password (`REDIS_PASSWORD`)
- [ ] Configure SSL/TLS for WebSocket
- [ ] Set up Redis cluster for high availability
- [ ] Configure webhook retry limits
- [ ] Set up monitoring for webhook failures
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up log aggregation

## Next Steps

1. **Integrate with Services**: Update services to call broadcaster methods
2. **Add More Webhooks**: Create webhooks for different events
3. **Monitor**: Check webhook stats and logs regularly
4. **Scale**: Add more servers (they'll sync via Redis)
5. **Customize**: Modify event types or add new ones

---

## Full Example: Agent State Change Flow

```
1. Agent updates state via API
   POST /api/v1/agent-state/me
   {"state": "available"}

2. Service calls broadcaster
   broadcaster.BroadcastAgentStateChanged(tenantID, userID, "available", "")

3. WebSocket clients receive
   {
     "type": "agent.state.changed",
     "payload": {
       "user_id": "user-123",
       "state": "available",
       "tenant_id": "tenant-123"
     }
   }

4. Webhooks fired
   POST https://your-webhook-url.com
   X-Webhook-Signature: sha256=...
   {
     "type": "agent.state.changed",
     "payload": {...},
     "timestamp": 1729866000
   }

5. Check delivery
   GET /api/v1/webhooks/1/logs
   - See HTTP status
   - Response time
   - Number of retries
```

## Webhook Payload Format

All webhooks receive this format:
```json
{
  "event": "agent.state.changed",
  "tenant_id": "tenant-123",
  "timestamp": 1729866000,
  "data": {
    "user_id": "user-456",
    "state": "available",
    "previous_state": "away"
  }
}
```

Headers included:
- `Content-Type: application/json`
- `X-Webhook-Signature: sha256=<HMAC>`
- `X-Webhook-ID: <webhook-id>`
- `X-Tenant-ID: <tenant-id>`

## Verify Webhook Signature (Python Example)
```python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, f"sha256={expected}")

# In your webhook handler
signature = request.headers.get('X-Webhook-Signature')
payload = request.get_data(as_text=True)
secret = 'your-webhook-secret'

if verify_signature(payload, signature, secret):
    # Process webhook
    pass
else:
    # Invalid signature
    return 401
```

---

🎉 **You're all set!** WebSocket and webhooks are fully integrated and ready to use.
