# 📞 Call Testing Guide - ARA Enabled

## ✅ Current Status

### ARA Configuration:
- **✅ res_config_odbc**: Running
- **✅ extconfig.conf**: Configured for ps_endpoints, ps_auths, ps_aors, ps_contacts
- **✅ ODBC Connection**: Active (1/10 connections)
- **✅ Database**: PJSIP records loaded (extensions 100, 101)

### ARI Configuration:
- **✅ res_ari**: Running (12 ARI modules loaded)
- **✅ HTTP Server**: Enabled on 0.0.0.0:8088
- **✅ ARI User**: asterisk / asterisk configured
- **✅ ARI App**: callcenter (in dialplan)

### Current Endpoints:
| Endpoint | Status | Source | Auth |
|----------|--------|--------|------|
| 100 | Unavailable (offline) | Static + DB | changeme100 |
| 101 | Unavailable (offline) | Static + DB | changeme101 |
| twilio-na-us | Online | Static | Admin@1234567 |

---

## 🔄 ARA Migration Status

### What's Migrated:
✅ Database has PJSIP records (ps_endpoints, ps_auths, ps_aors)
✅ ODBC connected to MySQL
✅ extconfig.conf configured for ARA
✅ res_config_odbc module running

### What's NOT Fully Migrated:
⚠️ **Extensions still defined in STATIC config files**
- `docker/asterisk/config/pjsip copy.conf` - has [100] and [101]
- `docker/asterisk/config/pjsip_wizard.conf` - has [100]

**Result:** Asterisk is reading from BOTH static files AND database (hybrid mode)

### To Complete ARA Migration:

1. **Remove static PJSIP definitions** (or rename the files):
```bash
docker exec asterisk mv /etc/asterisk/pjsip.conf /etc/asterisk/pjsip.conf.disabled
docker exec asterisk mv /etc/asterisk/pjsip_wizard.conf /etc/asterisk/pjsip_wizard.conf.disabled
docker exec asterisk asterisk -rx "module reload res_pjsip.so"
```

2. **Verify endpoints load from database only**:
```bash
docker exec asterisk asterisk -rx "pjsip show endpoints"
```

---

## 📞 Call Testing

### Test 1: Echo Test (No Registration Required)

```bash
# Via Asterisk CLI
docker exec asterisk asterisk -rx "channel originate Local/600@internal application Echo"

# Check active channels
docker exec asterisk asterisk -rx "core show channels"

# Expected: See 2 Local channels in Up state with Echo application
```

**✅ TESTED: Working** - Call created successfully

### Test 2: Playback Test (No Registration Required)

```bash
# Via Asterisk CLI
docker exec asterisk asterisk -rx "channel originate Local/601@internal extension 601"

# Expected: Hear hello-world and tt-monkeys audio files
```

### Test 3: ARI-Controlled Call

```bash
# Via ARI REST API
curl -u asterisk:asterisk -X POST \
  "http://localhost:8088/ari/channels?endpoint=Local/600@internal&app=callcenter"

# This will:
# 1. Create a channel via ARI
# 2. Enter Stasis application (if backend running)
# 3. Backend can control the call programmatically
```

### Test 4: Internal Call (100 → 101)

**Requires:** SIP phone registered as extension 100

```bash
# From softphone registered as 100
Dial: 101

# Expected flow:
# 1. Call enters Stasis(callcenter,internal,101)
# 2. Go backend receives StasisStart event
# 3. Backend answers call
# 4. Backend creates bridge and dials 101
# 5. Both parties connected
```

### Test 5: Twilio Incoming Call

**Requires:** Twilio configured to send calls to your server

```bash
# Call your Twilio number: +19863334949

# Expected flow:
# 1. Twilio sends INVITE to Asterisk
# 2. Matched by [from-twilio] context
# 3. Routes to Stasis(callcenter,incoming,DID)
# 4. Go backend receives event
# 5. Backend answers and plays greeting
```

### Test 6: Twilio Outgoing Call

**Requires:** SIP phone registered

```bash
# From softphone dial:
9+1234567890

# Expected flow:
# 1. Asterisk receives dial from registered phone
# 2. Matches [outbound] context
# 3. Dials via PJSIP/NUMBER@twilio_trunk
# 4. Call placed through Twilio
```

---

## 🚀 Start Go Backend for ARI Control

```bash
cd backend

# Set environment
export ASTERISK_ARI_URL="http://localhost:8088/ari"
export ASTERISK_ARI_USERNAME="asterisk"
export ASTERISK_ARI_PASSWORD="asterisk"
export ASTERISK_APP_NAME="callcenter"
export DATABASE_URL="root:callcenterpass@tcp(mysql:3306)/callcenter"

# Run backend
go run ./cmd/api
```

Expected output:
```
✅ Database connected
✅ Successfully connected to Asterisk ARI WebSocket
✅ Asterisk ARI handler started successfully
🚀 Server started on :8080
```

### Test Backend Connection:

```bash
# Check health
curl http://localhost:8080/health

# Watch ARI events (if backend running)
# Make a test call and watch logs
```

---

## 🔍 Verification Commands

### Check ARA is Working:
```bash
# Query database record
docker exec mysql mysql -u root -pcallcenterpass -e "
USE callcenter;
SELECT id, username, password FROM ps_auths WHERE id='100';"

# Check if Asterisk can read it
docker exec asterisk asterisk -rx "pjsip show endpoint 100"

# If you see endpoint details, ARA is reading from database
```

### Check ODBC Connection:
```bash
docker exec asterisk asterisk -rx "odbc show all"
# Expected: Number of active connections: 1 (out of 10)
```

### Check ARI Availability:
```bash
curl -u asterisk:asterisk http://localhost:8088/ari/endpoints | python3 -m json.tool
# Expected: JSON array with endpoints 100, 101, twilio-na-us
```

### Check Active Calls:
```bash
docker exec asterisk asterisk -rx "core show channels verbose"
docker exec asterisk asterisk -rx "ari show apps"
```

### Monitor Call Events:
```bash
# In Asterisk CLI (real-time)
docker exec -it asterisk asterisk -rvvv

# Watch for:
# - StasisStart events when calls enter ARI
# - Channel state changes
# - Bridge operations
```

---

## 🧪 Complete Test Sequence

### 1. Verify System Ready
```bash
echo "=== Checking Services ==="
docker ps | grep -E "asterisk|mysql"
docker exec asterisk asterisk -rx "core show version"
docker exec asterisk asterisk -rx "odbc show all"
docker exec asterisk asterisk -rx "http show status"
curl -u asterisk:asterisk http://localhost:8088/ari/endpoints
echo "✅ All services running"
```

### 2. Test Echo Call (Confirms Asterisk Working)
```bash
echo "=== Testing Echo Call ==="
docker exec asterisk asterisk -rx "channel originate Local/600@internal application Echo"
sleep 5
docker exec asterisk asterisk -rx "core show channels"
docker exec asterisk asterisk -rx "channel request hangup all"
echo "✅ Echo test complete"
```

### 3. Test ARI Channel Creation
```bash
echo "=== Testing ARI Channel Creation ==="
CHANNEL_ID=$(curl -s -u asterisk:asterisk -X POST \
  "http://localhost:8088/ari/channels?endpoint=Local/600@internal&app=callcenter" \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', 'error'))")

echo "Channel ID: $CHANNEL_ID"

if [ "$CHANNEL_ID" != "error" ]; then
  echo "✅ ARI channel created successfully"
  
  # Answer the channel
  curl -s -u asterisk:asterisk -X POST \
    "http://localhost:8088/ari/channels/$CHANNEL_ID/answer"
  
  # Hangup after 5 seconds
  sleep 5
  curl -s -u asterisk:asterisk -X DELETE \
    "http://localhost:8088/ari/channels/$CHANNEL_ID"
  
  echo "✅ ARI call control working"
else
  echo "❌ ARI channel creation failed"
fi
```

### 4. Register SIP Phone and Test Internal Call
```bash
echo "=== Manual Test Required ==="
echo "1. Configure SIP softphone:"
echo "   - Username: 100"
echo "   - Password: changeme100"
echo "   - Server: <YOUR_IP>:5060"
echo ""
echo "2. Start Go backend in another terminal:"
echo "   cd backend && go run ./cmd/api"
echo ""
echo "3. From softphone, dial: 101"
echo "   Expected: Call goes through Stasis app"
echo ""
echo "4. Dial: 600"
echo "   Expected: Echo test"
echo ""
```

### 5. Test Twilio (If Configured)
```bash
echo "=== Twilio Test ==="
echo "Incoming: Call +19863334949 from your phone"
echo "Outgoing: From softphone dial: 9+1234567890"
echo ""
echo "Monitor with:"
echo "docker exec -it asterisk asterisk -rvvv"
```

---

## 📊 Expected Results

### ✅ Working Now:
- [x] Asterisk running
- [x] MySQL connected via ODBC
- [x] ARA configured (extconfig.conf)
- [x] ARI HTTP server enabled
- [x] ARI REST API responding
- [x] Dialplan using Stasis() for ARI
- [x] Echo test working
- [x] Database has PJSIP records

### ⏳ Pending Tests:
- [ ] SIP phone registration (user needs to configure)
- [ ] Internal calls 100 ↔ 101
- [ ] Twilio incoming calls
- [ ] Twilio outgoing calls
- [ ] Go backend ARI control
- [ ] Full ARA migration (remove static config)

---

## 🐛 Troubleshooting

### Endpoint Not Registering?
```bash
# Check if endpoint exists
docker exec asterisk asterisk -rx "pjsip show endpoint 100"

# Check auth
docker exec mysql mysql -u root -pcallcenterpass -e "
USE callcenter;
SELECT * FROM ps_auths WHERE id='100';"

# Watch registration attempts
docker exec -it asterisk asterisk -rvvv
# Look for REGISTER requests
```

### ARI Not Responding?
```bash
# Check HTTP status
docker exec asterisk asterisk -rx "http show status"

# Should show: "Server Enabled and Bound to 0.0.0.0:8088"

# Reload if needed
docker exec asterisk asterisk -rx "module reload http"
docker exec asterisk asterisk -rx "module reload res_ari.so"
```

### ODBC Connection Failed?
```bash
# Check connection
docker exec asterisk asterisk -rx "odbc show all"

# Test with isql
docker exec asterisk isql -v asterisk-connector root callcenterpass

# Fix if needed
docker exec asterisk asterisk -rx "module reload res_odbc.so"
```

### Calls Not Going Through Stasis?
```bash
# Check dialplan
docker exec asterisk asterisk -rx "dialplan show internal"

# Should see: Stasis(callcenter,internal,100)

# Check ARI app
docker exec asterisk asterisk -rx "ari show apps"

# Backend must be running to handle Stasis events
```

---

## 📖 Next Steps

1. **✅ DONE**: ARA and ARI configured and working
2. **TODO**: Configure SIP phone to test registration
3. **TODO**: Start Go backend to test ARI control
4. **TODO**: Test full call flows (internal, Twilio in/out)
5. **OPTIONAL**: Remove static PJSIP config to fully migrate to ARA

Your system is **ready for testing**! 🎉
