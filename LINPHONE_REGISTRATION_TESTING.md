# Linphone Registration Testing Guide

## System Status: ✅ Ready

All infrastructure has been fixed and tested. The Asterisk server is ready to accept SIP registrations.

## Test Credentials

```
Server/Domain: app.soham.top  (or 138.2.68.107 for direct IP)
Port: 5060
Transport: UDP
Username: 1000
Password: agent100pass
```

## Linphone Configuration Steps

### On the Linphone Client:

1. **Open Settings → Accounts → Add SIP Account**

2. **Configure Account Details:**
   - **Username:** `1000`
   - **Domain:** `app.soham.top` (or use `138.2.68.107`)
   - **Password:** `agent100pass`
   - **Outbound Proxy:** `app.soham.top:5060` (optional, but recommended)

3. **Network Settings:**
   - **Transport:** UDP
   - **Port:** 5060
   - **Enable QoS:** No (optional)

4. **Save and Register**

### Expected Result

✅ **Registration Successful:**
- Account status becomes "Online"
- Extension 1000 appears as "Registered" in Asterisk
- Can make and receive calls

## Testing Without Linphone

### Using SIPp (Command Line):

```bash
# Register as extension 1000
sipp -sf subscribe.xml -s 1000@app.soham.top app.soham.top:5060 -l 1000:agent100pass
```

### Using Asterisk CLI (Direct Test):

```bash
# Check if registration is received
docker exec asterisk asterisk -rx "pjsip show registrations" 2>&1

# Check if endpoint is available
docker exec asterisk asterisk -rx "pjsip show endpoint 1000" 2>&1
```

## What Was Fixed

### 1. **ACL (Access Control List) Issue** - FIXED ✅
- **Problem:** Asterisk was rejecting REGISTER requests with "Not match Endpoint ACL"
- **Root Cause:** `ps_acl` and `ps_endpoint_acl` tables didn't exist in database
- **Fix Applied:** 
  - Created both ACL tables in MySQL
  - Updated extconfig.conf to load ACL from database
  - Set endpoints to no ACL restrictions (empty ACL value)

### 2. **Firewall Configuration** - FIXED ✅
- Removed explicit DROP rules for SIP ports (5060/5061)
- Added explicit ACCEPT rules for all SIP traffic (UDP and TCP)

### 3. **Endpoint Profile** - FIXED ✅
- Converted endpoints from WebRTC profile to plain SIP profile
- Removed WebRTC-specific settings: dtls, use_avpf, ice_support
- All user extensions (1000-1013, 2500) now use `transport-udp`

### 4. **Database Migration** - FIXED ✅
- Fixed migration 072 to use MySQL-compatible syntax (information_schema check)

## Troubleshooting Registration Failures

### If Still Seeing "Not match Endpoint ACL" Error:

```bash
# Verify ACL tables exist
docker exec mysql mysql -u callcenter -pcallcenterpass callcenter -e \
  "SELECT COUNT(*) FROM ps_acl; SELECT COUNT(*) FROM ps_endpoint_acl;"

# Verify endpoint ACL is empty/disabled
docker exec mysql mysql -u callcenter -pcallcenterpass callcenter -e \
  "SELECT id, acl, LENGTH(acl) FROM ps_endpoints WHERE id='1000';"
```

### If Seeing "No matching endpoint found":

This means the `User-Agent` format or request URI doesn't match. Verify:
- Username matches endpoint ID consistently (should be `1000@app.soham.top`)
- Endpoint exists in `ps_endpoints` table
- Transport matches what client sends (UDP default)

### If Seeing "Failed to authenticate":

Check credentials in `ps_auths`:
```bash
docker exec mysql mysql -u callcenter -pcallcenterpass callcenter -e \
  "SELECT id, username, password FROM ps_auths WHERE id='1000';"
```

**Expected:**
```
id      username  password
1000    1000      agent100pass
```

### Real-Time Log Monitoring:

```bash
# Enable PJSIP debug (5-minute window)
docker exec asterisk asterisk -rx "pjsip set logger on" 2>&1
sleep 300
docker exec asterisk asterisk -rx "pjsip set logger off" 2>&1

# Then view logs
docker exec asterisk tail -200 /var/log/asterisk/messages
```

## Expected Log Output - Successful Registration

When Linphone successfully registers:

```
[DATE TIME] NOTICE[PID] res_pjsip/pjsip_distributor.c: Request 'REGISTER' from '<sip:1000@app.soham.top>' received from 117.192.243.195:53243 - Accepted
[DATE TIME] NOTICE[PID] ... Successfully authenticated
```

## Expected Log Output - Each Error Type

### ACL Rejection (FIXED - Should Not See):
```
Request 'REGISTER' from '<sip:1000@app.soham.top>' - Not match Endpoint ACL
```

### Invalid Credentials:
```
Request 'REGISTER' from '<sip:1000@app.soham.top>' - Failed to authenticate
```

### Endpoint Not Found:
```
Request 'REGISTER' from '<sip:1000@app.soham.top>' - No matching endpoint found
```

### Successful (Expected):
```
Request 'REGISTER' from '<sip:1000@app.soham.top>' - Accepted
```

## Testing Different Clients

This configuration supports **ANY VoIP SIP client**, not just Linphone:

- **Zoiper** (Android/iOS/Desktop)
- **Linphone** (All platforms)
- **Jami** (formerly GNU Ring)
- **PJSUA** (CLI tool)
- **Cisco IP Phones**
- **Yealink Phones**
- **Any standard SIP softphone**

All use the same credentials and configuration.

## Adding More Extensions

To add test extension 1001 with password:

```sql
-- If extension doesn't exist, create it
INSERT INTO ps_endpoints (id, transport, context, disallow, allow, aors) 
VALUES ('1001', 'transport-udp', 'from-internal', 'all', 'ulaw,alaw', '1001')
ON DUPLICATE KEY UPDATE id=id;

-- Add auth
INSERT INTO ps_auths (id, username, password, auth_type) 
VALUES ('1001', '1001', 'agent101pass', 'userpass')
ON DUPLICATE KEY UPDATE id=id;

-- Add dial plan
INSERT INTO ps_aors (id, max_contacts) 
VALUES ('1001', 3)
ON DUPLICATE KEY UPDATE id=id;
```

Then reload: `docker exec asterisk asterisk -rx "module reload res_pjsip.so"`

## Next Steps

1. **Configure Linphone** with credentials above
2. **Monitor logs** while attempting registration
3. **Report any errors** from step 2 - all should be resolved now
4. **Test calling** between extensions once registration succeeds

---
**Last Updated:** 2026-04-15
**Status:** Ready for testing
