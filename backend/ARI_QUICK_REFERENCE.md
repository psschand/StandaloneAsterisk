# ARI Integration - Quick Reference

## 🚀 Quick Start

```bash
# 1. Load seed data
mysql -u root -p callcenter < backend/migrations/050_seed_test_data.sql

# 2. Update extensions.conf
cp extensions.conf.ari extensions.conf
asterisk -rx "dialplan reload"

# 3. Start backend
cd backend
export ASTERISK_ARI_URL="http://localhost:8088/ari"
go run ./cmd/api
```

## 📞 Test Credentials

### Web Login
- Email: `agent100@test.com` / `agent101@test.com`
- Password: `password123`

### SIP Extensions
- Extension: `100` / `101`
- SIP Password: `changeme100` / `changeme101`
- Server: `<YOUR_IP>:5060`

## 🎯 Test Calls

| Dial | Action |
|------|--------|
| `100` | Call extension 100 (via ARI) |
| `101` | Call extension 101 (via ARI) |
| `600` | Echo test |
| `601` | Playback test |
| `9 + number` | Outbound via Twilio |

## 🔍 Verify ARI

```bash
# Check ARI app
asterisk -rx "ari show apps"

# Check endpoints
asterisk -rx "pjsip show endpoints"

# Test REST API
curl -u asterisk:asterisk http://localhost:8088/ari/channels
```

## 📊 ARI Events

Key events handled:
- `StasisStart` → Call enters ARI
- `StasisEnd` → Call leaves ARI
- `ChannelDtmfReceived` → DTMF pressed
- `ChannelStateChange` → State updated

## 🛠️ Files Created

1. `internal/asterisk/ari_client.go` - ARI HTTP/WebSocket client
2. `internal/asterisk/ari_models.go` - Event/channel structs
3. `internal/asterisk/ari_handler.go` - Call handler
4. `migrations/050_seed_test_data.sql` - Test data
5. `extensions.conf.ari` - Stasis dialplan
6. `ARI_TESTING_GUIDE.md` - Full guide

## 🎬 Call Flow

```
Incoming Call
    ↓
Stasis(callcenter)
    ↓
ARI WebSocket Event
    ↓
Go Backend Handler
    ↓
Answer + Play Audio
    ↓
DTMF Menu / Transfer
    ↓
Hangup
```

## 📝 Next Steps

- [ ] Test incoming call
- [ ] Test extension dialing
- [ ] Test DTMF menu
- [ ] Integrate with WebSocket for real-time UI
- [ ] Add queue routing logic
- [ ] Enable call recording
- [ ] Build IVR menus

🎉 **You're ready to test ARI calls!**
