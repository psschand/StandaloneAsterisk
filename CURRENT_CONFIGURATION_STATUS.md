# Current Asterisk Configuration Status
**Date**: November 7, 2025

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Internal Users** | ✅ Configured | 1 extension (agent100) |
| **Inbound DID** | ⚠️ Partial | Configured in extensions.conf, missing in database |
| **SIP Trunk** | ✅ Configured | Twilio trunk active in pjsip.conf |
| **Echo Trunk** | ❌ Missing | No echo test trunk configured |

---

## 1. Internal Users (Extensions) ✅

### Database Configuration
**Table**: `ps_endpoints`

| Extension ID | Context | Transport | Codecs | Status |
|-------------|---------|-----------|--------|--------|
| agent100 | from-internal | transport-udp | ulaw,alaw | Configured |

**Authentication**:
- Table: `ps_auths`
- ID: `agent100-auth`
- Username: `agent100`
- Password: (encrypted)
- Type: userpass

**Address of Record**:
- Table: `ps_aors`
- ID: `agent100`
- Max Contacts: 1

### Asterisk Status
```
Endpoint: agent100
State: Unavailable
Channels: 0 of inf
Auth: agent100-auth/agent100
Transport: transport-udp (UDP)
```

### ⚠️ **Issue**: Only 1 Internal Extension
**Recommendation**: Add more extensions for agents/users

**To Add More Extensions**:
```sql
-- Extension agent101
INSERT INTO ps_endpoints (id, transport, aors, auth, context, disallow, allow, direct_media)
VALUES ('agent101', 'transport-udp', 'agent101', 'agent101-auth', 'from-internal', 'all', 'ulaw,alaw', 'no');

INSERT INTO ps_auths (id, auth_type, username, password)
VALUES ('agent101-auth', 'userpass', 'agent101', '$2a$10$...');  -- bcrypt hash

INSERT INTO ps_aors (id, max_contacts)
VALUES ('agent101', 1);
```

---

## 2. Inbound Calling (DID) ⚠️

### Extensions.conf Configuration ✅
**File**: `/etc/asterisk/extensions.conf`

**Context**: `[from-twilio]`
```
exten => +19863334949,1,NoOp(Inbound Twilio call)
 same => n,Goto(internal,100,1)

exten => 9863334949,1,NoOp(Inbound Twilio 10-digit match)
 same => n,Goto(internal,100,1)
```

**Routing**:
- DID Number: `+19863334949`
- Routes to: Extension 100 (agent100)
- Context: `from-twilio` → `internal`

### Database Configuration ❌
**Table**: `dids`

**Status**: **EMPTY** - No DIDs in database

**⚠️ Issue**: DID routing is hardcoded in extensions.conf but not in database

**Recommendation**: Add DID to database for dynamic routing

```sql
INSERT INTO dids (tenant_id, number, friendly_name, route_type, route_extension, status)
VALUES (1, '+19863334949', 'Twilio Main Line', 'endpoint', 'agent100', 'active');
```

**Available Route Types**:
- `endpoint` - Route to extension
- `queue` - Route to call queue
- `ivr` - Route to IVR menu
- `webhook` - HTTP callback
- `external` - Forward to external number
- `voicemail` - Direct to voicemail

---

## 3. SIP Trunk for Outbound Calling ✅

### Twilio Trunk Configuration
**File**: `/etc/asterisk/pjsip.conf`

**Trunk ID**: `twilio_trunk`

#### Endpoint Configuration
```ini
[twilio_trunk]
type=endpoint
transport=transport-udp
context=from-twilio
disallow=all
allow=ulaw,alaw
aors=twilio_trunk
outbound_auth=twilio_auth
from_domain=nlpbay.pstn.ashburn.twilio.com
from_user=+19863334949
rewrite_contact=yes
force_rport=yes
rtp_symmetric=yes
direct_media=no
dtmf_mode=rfc4733
```

#### AOR Configuration
```ini
[twilio_trunk]
type=aor
contact=sip:nlpbay.pstn.ashburn.twilio.com:5060
qualify_frequency=60
```

#### Authentication
```ini
[twilio_auth]
type=auth
auth_type=userpass
username=Admin
password=Admin@1234567
```

#### IP ACL
```ini
[twilio_trunk]
type=identify
endpoint=twilio_trunk
match=54.172.60.0/24
match=54.244.51.0/24
```

### Outbound Routing (extensions.conf)
**Context**: `[outbound]`

**Pattern 1**: 9-prefix dialing
```
exten => _9.,1,NoOp(Outbound via Twilio)
 same => n,Set(NUM=${EXTEN:1})
 same => n,Set(CALLERID(num)=+19863334949)
 same => n,Dial(PJSIP/${NUM}@twilio_trunk,30)
```
- Dial: `9` + phone number
- Example: `915551234567` calls `+15551234567`

**Pattern 2**: Direct E.164 dialing
```
exten => _+1XXXXXXXXXX,1,NoOp(Direct E.164 Outbound)
 same => n,Set(CALLERID(num)=+19863334949)
 same => n,Dial(PJSIP/${EXTEN}@twilio_trunk,30)
```
- Dial: `+1XXXXXXXXXX` directly
- Example: `+15551234567`

### ⚠️ **Issue**: Trunk Not in Database
The Twilio trunk is configured in `pjsip.conf` (static) but not in database tables.

**Recommendation**: Migrate to database for dynamic management via UI

```sql
-- Twilio trunk endpoint
INSERT INTO ps_endpoints (id, transport, aors, auth, context, disallow, allow, from_domain, from_user, direct_media)
VALUES ('twilio_trunk', 'transport-udp', 'twilio_trunk', 'twilio_auth', 'from-twilio', 'all', 'ulaw,alaw', 'nlpbay.pstn.ashburn.twilio.com', '+19863334949', 'no');

-- Twilio auth
INSERT INTO ps_auths (id, auth_type, username, password)
VALUES ('twilio_auth', 'userpass', 'Admin', 'Admin@1234567');

-- Twilio AOR
INSERT INTO ps_aors (id, contact, qualify_frequency)
VALUES ('twilio_trunk', 'sip:nlpbay.pstn.ashburn.twilio.com:5060', 60);
```

---

## 4. Echo Trunk ❌

### Status: **NOT CONFIGURED**

No echo test trunk or extension found in:
- ❌ Database (ps_endpoints)
- ❌ pjsip.conf
- ❌ extensions.conf

### What is an Echo Trunk?
An echo trunk/extension allows users to test audio by calling a number that plays back their voice with a delay. Useful for:
- Testing microphone/speaker
- Checking audio quality
- Verifying connectivity
- Troubleshooting latency

### Recommendation: Add Echo Test Extension

#### Option 1: Simple Echo Extension (Built-in Asterisk App)
Add to `/etc/asterisk/extensions.conf`:

```ini
[internal]
; Echo test - dial 600 to hear yourself
exten => 600,1,NoOp(Echo Test)
 same => n,Answer()
 same => n,Playback(demo-echotest)
 same => n,Echo()
 same => n,Hangup()
```

#### Option 2: Echo Test with Menu (Better UX)
```ini
[internal]
exten => 600,1,NoOp(Echo Test)
 same => n,Answer()
 same => n,Playback(beep)
 same => n,Echo()
 same => n,Hangup()

; Music on hold test
exten => 601,1,NoOp(Music On Hold Test)
 same => n,Answer()
 same => n,MusicOnHold()
 same => n,Hangup()

; Milliwatt tone test (1000 Hz reference)
exten => 602,1,NoOp(Milliwatt Test)
 same => n,Answer()
 same => n,Milliwatt()
 same => n,Hangup()
```

#### Option 3: External Echo Service
Configure trunk to public echo test service:

```sql
-- Echo test trunk to echo.example.com
INSERT INTO ps_endpoints (id, transport, aors, context, disallow, allow, direct_media)
VALUES ('echo_trunk', 'transport-udp', 'echo_trunk', 'from-trunk', 'all', 'ulaw,alaw', 'no');

INSERT INTO ps_aors (id, contact, max_contacts)
VALUES ('echo_trunk', 'sip:echo.example.com:5060', 1);
```

Then add extension:
```ini
[internal]
exten => 700,1,NoOp(External Echo Test)
 same => n,Dial(PJSIP/echo@echo_trunk)
 same => n,Hangup()
```

---

## Configuration Files Summary

### Active Configuration Files

1. **pjsip.conf** (`/etc/asterisk/pjsip.conf`)
   - ✅ Twilio trunk configured
   - ✅ Transport configured (UDP on 0.0.0.0)
   - ✅ External addresses set (138.2.68.107)
   - ⚠️ Extensions loaded from database (ARA)

2. **extensions.conf** (`/etc/asterisk/extensions.conf`)
   - ✅ Inbound routing: `[from-twilio]` → extension 100
   - ✅ Outbound routing: `[outbound]` → Twilio trunk
   - ✅ Internal routing: `[internal]` extensions 100, 101
   - ❌ No echo test extension

3. **Database Tables** (MySQL)
   - ✅ `ps_endpoints`: 1 extension (agent100)
   - ✅ `ps_auths`: 1 auth (agent100-auth)
   - ✅ `ps_aors`: 1 aor (agent100)
   - ❌ `dids`: Empty
   - ❌ Twilio trunk not in database

---

## Recommended Actions

### Priority 1: Add Echo Test Extension
```bash
docker exec -it asterisk bash
cat >> /etc/asterisk/extensions.conf << 'EOF'

; Echo test extension
[internal]
exten => 600,1,NoOp(Echo Test Started)
 same => n,Answer()
 same => n,Playback(beep)
 same => n,Echo()
 same => n,Hangup()
EOF

asterisk -rx "dialplan reload"
```

### Priority 2: Add DID to Database
```sql
INSERT INTO dids (tenant_id, number, friendly_name, route_type, route_extension, status, created_at, updated_at)
VALUES (1, '+19863334949', 'Twilio Main Line', 'endpoint', 'agent100', 'active', NOW(), NOW());
```

### Priority 3: Add More Internal Extensions
```bash
# Use the SIP Trunk Management UI at:
# http://138.2.68.107/admin/extensions
# or insert via SQL (see section 1)
```

### Priority 4: Migrate Twilio Trunk to Database
```bash
# Use the SIP Trunk Management UI at:
# http://138.2.68.107/sip-trunks
# Click "Add Trunk" and configure Twilio
```

---

## Testing Procedures

### Test 1: Internal Extension Registration
```bash
# Check if agent100 can register
docker exec asterisk asterisk -rx "pjsip show endpoint agent100"
```

### Test 2: Inbound Call Routing
```bash
# Call +19863334949 from external phone
# Should ring extension 100 (agent100)
```

### Test 3: Outbound Calling
```bash
# From agent100, dial: 9 + phone number
# Example: 915551234567
# Should place call via Twilio trunk
```

### Test 4: Echo Test (After Configuration)
```bash
# From agent100, dial: 600
# Should hear echo of your voice
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         External PSTN / Twilio                  │
│         +19863334949 (DID)                      │
└────────────────┬────────────────────────────────┘
                 │
                 │ SIP/UDP (Inbound)
                 ▼
┌─────────────────────────────────────────────────┐
│         Asterisk PJSIP                          │
│  ┌──────────────────────────────────────────┐   │
│  │  [from-twilio] Context                   │   │
│  │  Routes to: extension 100                │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  [internal] Context                      │   │
│  │  - Extension 100 (agent100)              │   │
│  │  - Extension 101 (agent101)              │   │
│  │  - (Echo test: NOT configured)           │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  [outbound] Context                      │   │
│  │  Routes to: twilio_trunk                 │   │
│  │  Dial: 9 + number or +1XXXXXXXXXX        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────┬────────────────────────────────┘
                  │
                  │ SIP/UDP (Outbound)
                  ▼
┌─────────────────────────────────────────────────┐
│     Twilio SIP Trunk                            │
│     nlpbay.pstn.ashburn.twilio.com:5060         │
│     Auth: Admin / Admin@1234567                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         MySQL Database (ARA)                    │
│  ┌──────────────────────────────────────────┐   │
│  │ ps_endpoints: agent100                   │   │
│  │ ps_auths: agent100-auth                  │   │
│  │ ps_aors: agent100                        │   │
│  │ dids: (EMPTY - needs configuration)      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         Softphones / WebRTC Clients             │
│  - agent100 (Zoiper/WebRTC)                     │
│  - agent101 (Not configured)                    │
└─────────────────────────────────────────────────┘
```

---

## Quick Status Check Commands

```bash
# Check all PJSIP endpoints
docker exec asterisk asterisk -rx "pjsip show endpoints"

# Check Twilio trunk status
docker exec asterisk asterisk -rx "pjsip show endpoint twilio_trunk"

# Check active calls
docker exec asterisk asterisk -rx "core show channels"

# Check dial plan
docker exec asterisk asterisk -rx "dialplan show from-twilio"

# Check internal extensions
docker exec asterisk asterisk -rx "dialplan show internal"

# Reload configurations
docker exec asterisk asterisk -rx "pjsip reload"
docker exec asterisk asterisk -rx "dialplan reload"

# Check database extensions
docker exec mysql mysql -uroot -pcallcenterpass callcenter \
  -e "SELECT id, context FROM ps_endpoints"
```

---

## Summary

✅ **Working**:
- 1 internal extension (agent100)
- Twilio trunk for outbound calling
- Inbound DID routing (+19863334949 → agent100)
- Outbound dialing (9-prefix or +1XXXXXXXXXX)

⚠️ **Needs Attention**:
- Only 1 extension configured (add more agents)
- DID not in database (hardcoded in extensions.conf)
- Twilio trunk not in database (hardcoded in pjsip.conf)

❌ **Missing**:
- Echo test trunk/extension
- Additional internal extensions
- Database-driven DID routing
- Database-driven trunk management

**Recommendation**: Add echo test extension and migrate static configuration to database for dynamic management via the new SIP Trunk Management UI.
