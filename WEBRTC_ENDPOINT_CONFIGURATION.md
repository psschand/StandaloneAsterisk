# WebRTC Endpoint Configuration - Complete Guide

## Problem Summary

**Issue**: Extension 1001 was created with incomplete WebRTC configuration, causing WebSocket code 1006 failures during SIP/SDP media negotiation, while extension 1000 worked perfectly.

**Root Cause**: Extension 1001 was missing critical PJSIP configuration fields:
- `direct_media` was NULL (should be 'no')
- `force_rport` was NULL (should be 'yes')
- `rewrite_contact` was NULL (should be 'yes')
- `rtp_symmetric` was NULL (should be 'yes')
- `dtls_verify` was NULL (should be 'no')
- `dtls_setup` was NULL (should be 'actpass')
- `use_avpf` was NULL (should be 'yes')
- `identify_by` was NULL (should be 'username')

**Impact**: WebSocket connected successfully but Asterisk immediately closed the connection (code 1006) during media negotiation because it couldn't establish a proper WebRTC session.

## Critical WebRTC Configuration Fields

### Required PJSIP Endpoint Fields for WebRTC

```sql
-- All fields below are MANDATORY for WebRTC endpoints
direct_media = 'no'         -- Force media through Asterisk (required for WebRTC)
force_rport = 'yes'         -- NAT traversal - force responses to source port
rewrite_contact = 'yes'     -- Rewrite Contact header for correct routing through proxy
rtp_symmetric = 'yes'       -- Symmetric RTP for NAT traversal
dtls_verify = 'no'          -- Don't verify DTLS certificates (allows self-signed certs)
dtls_setup = 'actpass'      -- DTLS role negotiation (allows client/server role)
ice_support = 'yes'         -- Enable ICE for WebRTC connection establishment
media_encryption = 'dtls'   -- Use DTLS encryption for WebRTC
use_avpf = 'yes'           -- RTP/AVPF for WebRTC (required for proper media flow)
webrtc = 'yes'             -- Enable WebRTC optimizations in Asterisk
identify_by = 'username'    -- Identify endpoint by username for registration matching
```

### Why Each Field Matters

| Field | Value | Why It's Critical |
|-------|-------|-------------------|
| `direct_media` | `no` | Forces all media through Asterisk. Without this, Asterisk tries to connect endpoints directly, which breaks WebRTC media flow. |
| `force_rport` | `yes` | Essential for NAT traversal. Forces SIP responses to the source port, allowing bidirectional communication through NAT/firewall. |
| `rewrite_contact` | `yes` | Rewrites Contact headers to use the address Asterisk sees. Critical when behind proxy (Caddy) or NAT. |
| `rtp_symmetric` | `yes` | Sends RTP to the source address/port of received RTP. Essential for NAT traversal and WebRTC. |
| `dtls_verify` | `no` | Disables DTLS certificate verification. Required when using self-signed certificates (development/internal use). |
| `dtls_setup` | `actpass` | Allows endpoint to be either DTLS client or server. Required for WebRTC negotiation flexibility. |
| `ice_support` | `yes` | Enables ICE (Interactive Connectivity Establishment). Standard WebRTC requirement for connection establishment. |
| `media_encryption` | `dtls` | Specifies DTLS encryption. WebRTC mandates encrypted media (not optional). |
| `use_avpf` | `yes` | RTP/AVPF (Audio-Visual Profile with Feedback). Required for WebRTC media handling. |
| `webrtc` | `yes` | Enables Asterisk's WebRTC optimizations and compatibility mode. |
| `identify_by` | `username` | Tells Asterisk to identify endpoints by username field during registration, not just IP address. |

## Solution Implemented

### 1. Immediate Fix (Applied)

Updated extension 1001 with proper configuration:

```sql
UPDATE ps_endpoints 
SET direct_media = 'no',
    force_rport = 'yes',
    rewrite_contact = 'yes',
    rtp_symmetric = 'yes',
    dtls_verify = 'no',
    dtls_setup = 'actpass',
    use_avpf = 'yes',
    ice_support = 'yes',
    media_encryption = 'dtls',
    webrtc = 'yes',
    identify_by = 'username'
WHERE id = '1001';
```

### 2. Backend Code Updated

Modified `backend/internal/handler/endpoint_handler.go` to always set these fields when creating new endpoints:

```go
endpoint := &asterisk.PsEndpoint{
    ID:              req.ExtensionNumber,
    Callerid:        req.DisplayName,
    Transport:       &transport,
    Aors:            &req.ExtensionNumber,
    Auth:            &req.ExtensionNumber,
    Context:         &context,
    Disallow:        stringPtr("all"),
    Allow:           &codecs,
    DirectMedia:     stringPtr("no"),      // Force media through Asterisk
    ForceRport:      stringPtr("yes"),     // NAT traversal
    RewriteContact:  stringPtr("yes"),     // Correct routing
    RtpSymmetric:    stringPtr("yes"),     // NAT traversal
    DtlsVerify:      stringPtr("no"),      // Self-signed certs
    IceSupport:      stringPtr("yes"),     // WebRTC ICE
    MediaEncryption: stringPtr("dtls"),    // DTLS encryption
    DtlsSetup:       stringPtr("actpass"), // DTLS role negotiation
    UseAvpf:         stringPtr("yes"),     // RTP/AVPF
    Webrtc:          stringPtr("yes"),     // WebRTC mode
    IdentifyBy:      stringPtr("username"), // Username identification
}
```

### 3. Data Models Updated

Added missing fields to both model files:

**backend/internal/asterisk/sms_voicemail.go**:
```go
type PsEndpoint struct {
    // ... existing fields ...
    DtlsVerify      *string `gorm:"column:dtls_verify;type:varchar(10)"`
    DtlsSetup       *string `gorm:"column:dtls_setup;type:varchar(10)"`
    UseAvpf         *string `gorm:"column:use_avpf;type:varchar(10)"`
    IdentifyBy      *string `gorm:"column:identify_by;type:varchar(128)"`
}
```

**backend-models/asterisk/sms_voicemail.go**:
```go
type PsEndpoint struct {
    // ... existing fields ...
    DtlsVerify      *string `gorm:"column:dtls_verify;type:varchar(10)"`
    DtlsSetup       *string `gorm:"column:dtls_setup;type:varchar(10)"`
    UseAvpf         *string `gorm:"column:use_avpf;type:varchar(10)"`
    IdentifyBy      *string `gorm:"column:identify_by;type:varchar(128)"`
}
```

### 4. Maintenance Scripts Created

**scripts/validate_webrtc_endpoints.sh** - Check all endpoints:
```bash
./scripts/validate_webrtc_endpoints.sh
```
Validates that all WebRTC endpoints have proper configuration.

**scripts/fix_webrtc_endpoints.sh** - Apply fixes:
```bash
./scripts/fix_webrtc_endpoints.sh
```
Automatically fixes all WebRTC endpoints with incorrect/NULL values.

**scripts/fix_webrtc_endpoints.sql** - SQL migration:
```sql
-- Can be applied directly to database
UPDATE ps_endpoints 
SET direct_media = 'no', 
    force_rport = 'yes', 
    -- ... all required fields
WHERE webrtc = 'yes' AND (direct_media IS NULL OR /* ... */);
```

## Verification Steps

### 1. Check Current Configuration

```bash
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
SELECT id, webrtc, direct_media, force_rport, rewrite_contact, rtp_symmetric, 
       dtls_verify, dtls_setup, use_avpf, identify_by
FROM ps_endpoints 
WHERE webrtc = 'yes';
"
```

**Expected Output** (all fields should have values, no NULLs):
```
+------+--------+--------------+-------------+-----------------+---------------+-------------+-------------+----------+------------+
| id   | webrtc | direct_media | force_rport | rewrite_contact | rtp_symmetric | dtls_verify | dtls_setup  | use_avpf | identify_by|
+------+--------+--------------+-------------+-----------------+---------------+-------------+-------------+----------+------------+
| 1000 | yes    | no           | yes         | yes             | yes           | no          | actpass     | yes      | username   |
| 1001 | yes    | no           | yes         | yes             | yes           | no          | actpass     | yes      | username   |
+------+--------+--------------+-------------+-----------------+---------------+-------------+-------------+----------+------------+
```

### 2. Test WebSocket Connection

1. **Clear browser cache** and refresh the page
2. Open browser DevTools → Network tab → Filter by WS
3. Connect softphone
4. **Success indicators**:
   - WebSocket status: 101 Switching Protocols
   - Connection stays open (not code 1006)
   - SIP REGISTER succeeds (200 OK)
   - Extension shows as registered in Asterisk

### 3. Verify Registration in Asterisk

```bash
docker exec asterisk asterisk -rx "pjsip show endpoints"
```

**Expected**:
```
Endpoint:  <Endpoint/CID.....................................>  <State.....>  <Channels.>
 1000/1000                                                         Not in use          0
 1001/1001                                                         Not in use          0
```

```bash
docker exec asterisk asterisk -rx "pjsip show contacts"
```

**Expected** (showing active registrations):
```
Contact:  <Aor/ContactUri..............................> <Hash....> <Status> <RTT(ms)..>
 1000/sip:1000@192.168.x.x:xxxxx                         xxxxxxxx   Unknown         N/A
 1001/sip:1001@192.168.x.x:xxxxx                         xxxxxxxx   Unknown         N/A
```

## Future Endpoint Creation

### Via Backend API

The updated `CreateExtension` handler automatically includes all required fields:

```bash
curl -X POST https://138.2.68.107/api/extensions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "extension_number": "1002",
    "password": "secure123",
    "display_name": "Agent 2",
    "context": "internal"
  }'
```

All WebRTC fields will be set automatically.

### Via Database (Manual)

If creating endpoints directly in the database, **ALWAYS** include these fields:

```sql
-- Create endpoint with COMPLETE WebRTC configuration
INSERT INTO ps_endpoints (
    id, transport, aors, auth, context, 
    disallow, allow, webrtc,
    direct_media, force_rport, rewrite_contact, rtp_symmetric,
    dtls_verify, dtls_setup, ice_support, media_encryption,
    use_avpf, identify_by
) VALUES (
    '1002', 'transport-ws', '1002', '1002-auth', 'internal',
    'all', 'ulaw,alaw,g722', 'yes',
    'no', 'yes', 'yes', 'yes',
    'no', 'actpass', 'yes', 'dtls',
    'yes', 'username'
);

-- Create corresponding auth
INSERT INTO ps_auths (id, auth_type, username, password) 
VALUES ('1002-auth', 'userpass', '1002', 'password123');

-- Create corresponding AOR
INSERT INTO ps_aors (id, max_contacts, remove_existing, qualify_frequency) 
VALUES ('1002', 1, 'yes', 60);
```

## Troubleshooting

### WebSocket Code 1006 (Abnormal Closure)

**Symptoms**: WebSocket connects (101) but immediately closes with code 1006.

**Cause**: Missing or incorrect WebRTC configuration fields in ps_endpoints.

**Solution**:
```bash
# Check current configuration
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
SELECT * FROM ps_endpoints WHERE id='YOUR_EXTENSION' \\G
"

# Run validation script
./scripts/validate_webrtc_endpoints.sh

# Apply fixes if needed
./scripts/fix_webrtc_endpoints.sh
```

### SIP 401 Authentication Errors

**Symptoms**: WebSocket stays connected but gets repeated 401 Unauthorized responses.

**Causes**:
1. Wrong credentials in ps_auths
2. Realm mismatch (should be NULL)
3. SIP URI using auth username instead of endpoint ID

**Solution**:
```bash
# Check auth configuration
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
SELECT id, auth_type, username, realm FROM ps_auths WHERE id='YOUR_EXTENSION-auth';
"

# Fix realm if needed
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
UPDATE ps_auths SET realm = NULL WHERE id='YOUR_EXTENSION-auth';
"

# Ensure SIP URI uses extension number, not auth username
# Check frontend: sip:${credentials.extension}@domain (NOT credentials.username)
```

### Registration Not Showing in Asterisk

**Symptoms**: WebSocket connected, no errors, but `pjsip show contacts` shows nothing.

**Causes**:
1. Missing or incorrect `identify_by` field
2. Users table has wrong extension values

**Solution**:
```bash
# Check identify_by
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
SELECT id, identify_by FROM ps_endpoints WHERE id='YOUR_EXTENSION';
"

# Fix if NULL
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
UPDATE ps_endpoints SET identify_by='username' WHERE id='YOUR_EXTENSION';
"

# Verify users table has correct extension
docker exec mysql mysql -u root -pcallcenterpass -D callcenter -e "
SELECT id, email, extension FROM users WHERE extension='YOUR_EXTENSION';
"
```

## Best Practices

### ✅ DO

1. **Always use the backend API** to create new endpoints (it sets all fields correctly)
2. **Run validation script** after any manual database changes
3. **Test new endpoints** immediately after creation
4. **Document any custom configurations** for specific use cases
5. **Keep extensions 1000 and 1001** as reference configurations

### ❌ DON'T

1. **Don't create endpoints** with SQL INSERT without all WebRTC fields
2. **Don't copy configurations** from non-WebRTC endpoints
3. **Don't modify WebRTC fields** without understanding their purpose
4. **Don't skip testing** after configuration changes
5. **Don't assume default values** - Asterisk won't apply WebRTC defaults

## Reference Configuration

**Complete working WebRTC endpoint** (extension 1000):

```sql
-- Endpoint
id: 1000
transport: transport-ws
aors: 1000
auth: agent100-auth
context: from-internal
disallow: all
allow: ulaw,alaw,g722
webrtc: yes
direct_media: no
force_rport: yes
rewrite_contact: yes
rtp_symmetric: yes
dtls_verify: no
dtls_setup: actpass
ice_support: yes
media_encryption: dtls
use_avpf: yes
identify_by: username

-- Auth
id: agent100-auth
auth_type: userpass
username: agent100
password: agent100pass
realm: NULL

-- AOR
id: 1000
max_contacts: 1
remove_existing: yes
qualify_frequency: 60
```

## Summary

**Problem**: Inconsistent endpoint configuration caused one endpoint to work while another failed.

**Root Cause**: Missing WebRTC configuration fields in database.

**Solution**: 
1. ✅ Fixed extension 1001 immediately
2. ✅ Updated backend code to always set these fields
3. ✅ Updated data models with missing fields
4. ✅ Created validation and fix scripts

**Prevention**: All future endpoints created via the backend API will have proper WebRTC configuration by default.

**Maintenance**: Run validation script periodically or after any manual database changes.

---

**Last Updated**: Current Session  
**Status**: ✅ Complete - Extension 1001 fixed, backend code updated, scripts created  
**Next Step**: User should test extension 1001 (refresh browser and reconnect)
