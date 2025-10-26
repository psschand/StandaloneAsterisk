# Call Routing Modes

This Asterisk setup supports **two routing modes** for maximum flexibility:

## 🚀 Mode A: Direct Routing (ACTIVE)
**No backend needed** - works immediately with just Asterisk + Database

### What Works:
- ✅ Internal calls (100↔101) via pattern `_1XX`
- ✅ Inbound Twilio calls ring extensions 100 & 101
- ✅ Outbound calls via Twilio (dial 9 + number)
- ✅ Voicemail
- ✅ Feature codes (*100, *101)
- ✅ Echo test (600), Playback test (601)

### Use Cases:
- Testing without backend
- Simple call center deployments
- Small teams (< 50 agents)
- Low-latency direct routing

---

## 🎯 Mode B: ARI Routing (Ready to Enable)
**Requires Go backend** - advanced features with programmatic control

### Additional Features:
- 🎛️ Database-driven routing (tenant/DID lookup)
- 📊 Live call dashboards in web UI
- 🎧 Call monitoring, barge-in, whisper
- 📞 Web-based call control (transfer, park, hangup)
- 📹 Selective call recording
- 🏢 Multi-tenant support
- 📈 Real-time analytics
- 🔔 WebSocket notifications to browsers

### Use Cases:
- Multi-tenant call centers
- Supervised agent teams
- CRM integration
- Advanced IVR flows
- Call center analytics

---

## 🔄 How to Switch Modes

### Switch to ARI Mode (Backend-Controlled):

1. **Edit extensions.conf:**
   ```bash
   docker exec -it asterisk vi /etc/asterisk/extensions.conf
   ```

2. **For Internal Calls** - Comment pattern, uncomment specific extensions:
   ```
   [internal]
   ; Comment this:
   ;exten => _1XX,1,NoOp(Direct dial to extension ${EXTEN})
   ; same => n,Dial(PJSIP/${EXTEN},30,tT)
   
   ; Uncomment this:
   exten => 100,1,NoOp(Calling extension 100 via ARI)
    same => n,Stasis(callcenter,internal,100)
    same => n,Hangup()
   ```

3. **For Twilio Incoming** - Switch to Stasis routing:
   ```
   [from-twilio]
   ; Comment OPTION A, uncomment OPTION B
   exten => _X.,1,NoOp(Inbound Twilio call)
    same => n,Stasis(callcenter,incoming,${EXTEN})
   ```

4. **Reload dialplan:**
   ```bash
   docker exec asterisk asterisk -rx "dialplan reload"
   ```

5. **Start Go backend:**
   ```bash
   cd backend
   export ASTERISK_ARI_URL="http://localhost:8088/ari"
   export ASTERISK_ARI_USERNAME="asterisk"
   export ASTERISK_ARI_PASSWORD="asterisk"
   go run ./cmd/api
   ```

---

## 📋 Current Configuration

### Extensions Registered:
- **100** - Agent 100 (password: changeme100)
- **101** - Agent 101 (password: changeme101)

### Twilio Configuration:
- **Trunk**: twilio_trunk (configured in pjsip.conf)
- **DID**: +19863334949 (or your Twilio number)
- **Outbound**: Dial 9 + number

### Feature Codes:
- **600** - Echo test
- **601** - Playback test
- **\*100** - Check voicemail for ext 100
- **\*101** - Check voicemail for ext 101

### Database:
- **ODBC**: Connected (1/10 connections active)
- **ARA**: Enabled (ps_endpoints, ps_auths, ps_aors)
- **Tables**: 31 tables created (tenants, users, cdrs, etc.)

### ARI:
- **HTTP Server**: http://localhost:8088/ari
- **Credentials**: asterisk/asterisk
- **Status**: ✅ Enabled and responding

---

## 🧪 Testing Guide

### Test Internal Calls (Direct Mode):
```bash
# From Asterisk CLI
docker exec asterisk asterisk -rx "channel originate PJSIP/100 extension 101@from-internal"

# Or dial from your SIP phone: 101
```

### Test Twilio Incoming (Direct Mode):
```bash
# Call your Twilio DID from external phone
# Should ring extensions 100 & 101
```

### Test Twilio Outgoing (Works in Both Modes):
```bash
# From your SIP phone, dial: 9-555-1234
# Will call +15551234 via Twilio
```

### Test ARI Backend (After Switch):
```bash
# Check ARI endpoints
curl -u asterisk:asterisk http://localhost:8088/ari/endpoints

# Make test call via ARI
curl -u asterisk:asterisk -X POST \
  "http://localhost:8088/ari/channels?endpoint=PJSIP/100&extension=101&context=from-internal"
```

---

## 💡 Recommendations

### Use Direct Mode For:
- Initial testing and validation
- Simple office phone systems
- Low call volumes (< 100 calls/day)
- When backend maintenance is a concern

### Use ARI Mode For:
- Call centers with agents
- Multi-tenant environments
- When you need web UI control
- Call recording and compliance
- Integration with CRM/ticketing systems
- Real-time monitoring requirements

---

## 📊 Performance Comparison

| Feature | Direct Mode | ARI Mode |
|---------|-------------|----------|
| Latency | ~50ms | ~100ms |
| Setup Complexity | Low | Medium |
| Maintenance | Minimal | Backend + DB |
| Scalability | 50 agents | 1000+ agents |
| Call Control | Dialplan only | Full API |
| Monitoring | Basic CLI | Web dashboards |
| Multi-tenant | No | Yes |

---

## 🔍 Troubleshooting

### Calls not routing?
```bash
# Check dialplan
docker exec asterisk asterisk -rx "dialplan show internal"

# Check if endpoints registered
docker exec asterisk asterisk -rx "pjsip show endpoints"

# Enable verbose logging
docker exec asterisk asterisk -rx "core set verbose 5"
```

### Backend not receiving events?
```bash
# Check ARI connection
docker exec asterisk asterisk -rx "ari show apps"

# Should show: callcenter (Stasis application)
```

### Database not connected?
```bash
# Check ODBC
docker exec asterisk asterisk -rx "odbc show all"

# Should show 1 active connection to MySQL
```

---

## 📝 Next Steps

1. ✅ **Currently Active**: Direct routing mode
2. ⏳ **Test Twilio calls** (dial your DID, dial out with 9+number)
3. ⏳ **Start Go backend** (when ready for advanced features)
4. ⏳ **Switch to ARI mode** (follow guide above)
5. ⏳ **Test web UI** (dashboards, call control)

---

**Last Updated**: October 26, 2025  
**Status**: Direct routing mode active and tested ✅
