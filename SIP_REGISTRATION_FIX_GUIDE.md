# SIP Registration Debugging & Fix Guide

**Date**: April 15, 2026  
**Symptom**: Zoiper / Linphone displayed "408 Request Timeout" or "IOError" when attempting to register  
**Resolution**: Four independent root causes identified and fixed  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Root Causes Diagnosed](#2-root-causes-diagnosed)
3. [Fix 1 — Firewall Rule Ordering](#3-fix-1--firewall-rule-ordering)
4. [Fix 2 — Endpoint deny/permit ACL Columns](#4-fix-2--endpoint-denypermit-acl-columns)
5. [Fix 3 — res_pjsip_acl.so BASELINE ACL](#5-fix-3--res_pjsip_aclso-baseline-acl)
6. [Fix 4 — Spurious pjsip copy.conf](#6-fix-4--spurious-pjsip-copyconf)
7. [ARA Database Tables — Current State](#7-ara-database-tables--current-state)
8. [Python SIP Registration Test Tool](#8-python-sip-registration-test-tool)
9. [Quick Validation Checklist](#9-quick-validation-checklist)
10. [Adding New Extensions](#10-adding-new-extensions)
11. [Files Changed Summary](#11-files-changed-summary)

---

## 1. Architecture Overview

This system uses **Asterisk Realtime Architecture (ARA)** — all softphone endpoint configuration (extensions, passwords, permissions) lives in MySQL, not in static `.conf` files. Asterisk loads endpoint config on-demand from the DB at registration time.

```
Zoiper/Linphone
    │
    │  REGISTER sip:1000@app.soham.top:5060
    ▼
[Host Firewall (iptables)]
    │
    ▼
[Asterisk PJSIP Engine]
    │
    ├─ 1. Transport lookup  (ps_transports or pjsip.conf)
    ├─ 2. Endpoint identify (ps_endpoint_id_ips — IP match for Twilio trunk)
    │      ↳ softphones: no identify record → matched by username in To: header
    ├─ 3. Endpoint load     (ps_endpoints)
    ├─ 4. ACL check         (ps_endpoints.deny / ps_endpoints.permit columns)
    ├─ 5. Auth challenge    → Asterisk sends 401 with WWW-Authenticate nonce
    ├─ 6. Auth verify       (ps_auths — checks MD5 digest against stored password)
    └─ 7. AOR registration  (ps_aors — stores Contact URI, expiry)
```

**Key config files:**

| File | Purpose |
|------|---------|
| `docker/asterisk/config/sorcery.conf` | Maps each object type (endpoint/auth/aor) to database or config file |
| `docker/asterisk/config/extconfig.conf` | Lists ODBC tables for realtime loading |
| `docker/asterisk/config/pjsip.conf` | Static config: transports + Twilio trunk |
| `docker/asterisk/config/modules.conf` | Module load/noload list |

---

## 2. Root Causes Diagnosed

Four separate issues **all had to be fixed** for registration to succeed. They were discovered by systematic debugging:

1. **Live log capture**: `docker exec asterisk tail -f /var/log/asterisk/messages`
2. **PJSIP debug**: `docker exec asterisk asterisk -rx "pjsip set logger on"`
3. **iptables inspection**: `sudo iptables -S INPUT | grep -E "5060|REJECT"`
4. **Database query**: direct MySQL queries on `ps_endpoints`
5. **Python SIP simulation**: a custom two-step digest auth test (see §8)

### Error Progression

| Step | Error in logs | Root cause |
|------|--------------|-----------|
| Initial | `408 Request Timeout` | Firewall REJECT rule before SIP ACCEPT |
| After firewall fix | `Not match Endpoint ACL` (BASELINE) | `res_pjsip_acl.so` BASELINE ACL active |
| After disabling ACL module | `Not match Endpoint ACL` (still) | `deny/permit` columns on `ps_endpoints` |
| After clearing deny/permit | `SIP/2.0 200 OK` | **Fixed** |

---

## 3. Fix 1 — Firewall Rule Ordering

### Problem

`iptables` had a `REJECT all` rule at **position 13** in the INPUT chain. SIP ACCEPT rules had been appended at the end (positions 31–32) — they were unreachable **dead code** because packets hit REJECT first.

```
# BROKEN state (position 13 = REJECT, positions 31-32 = ACCEPT — never reached)
num 12:  ACCEPT  tcp  dpt:22  state NEW          ← SSH
num 13:  REJECT  all  reject-with icmp-host-prohibited  ← ★ everything stops here
...
num 31:  ACCEPT  udp  dpt:5060                   ← never reached
num 32:  ACCEPT  tcp  dpt:5060                   ← never reached
```

Only Twilio source IPs had ACCEPT rules before REJECT (added earlier), which is why Twilio calls worked but softphone registrations timed out with 408.

### Fix Applied

Inserted four rules **before** the REJECT (inserting at position 13 pushes REJECT down):

```bash
sudo iptables -I INPUT 13 -p udp -m udp --dport 10000:10100 -j ACCEPT  # RTP media
sudo iptables -I INPUT 13 -p tcp -m tcp --dport 5061 -j ACCEPT          # SIP TLS
sudo iptables -I INPUT 13 -p tcp -m tcp --dport 5060 -j ACCEPT          # SIP TCP
sudo iptables -I INPUT 13 -p udp -m udp --dport 5060 -j ACCEPT          # SIP UDP
```

Persisted across reboots:
```bash
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### Verified State

```
# Correct state — SIP accepts are BEFORE REJECT
-A INPUT -p udp -m udp --dport 5060 -j ACCEPT      ← ★ SIP UDP ✅
-A INPUT -p tcp -m tcp --dport 5060 -j ACCEPT      ← ★ SIP TCP ✅
-A INPUT -p tcp -m tcp --dport 5061 -j ACCEPT      ← ★ SIP TLS ✅
-A INPUT -p udp -m udp --dport 10000:10100 -j ACCEPT ← RTP media ✅
-A INPUT -j REJECT --reject-with icmp-host-prohibited ← (now harmless for SIP)
```

---

## 4. Fix 2 — Endpoint deny/permit ACL Columns

### Problem

The `ps_endpoints` table has `deny` and `permit` columns that implement inline IP-based ACL — before any credential check. Extensions 1000 and 1001 had:

```sql
-- What was in the database (WRONG)
id    deny              permit
1000  0.0.0.0/0.0.0.0  172.25.0.0/255.255.0.0
1001  0.0.0.0/0.0.0.0  172.25.0.0/255.255.0.0
```

This means: **deny all IP addresses**, then **only re-permit** the `172.25.0.0/16` Docker-internal subnet. Any external softphone IP was permanently blocked — even if authentication credentials were correct.

Asterisk logs showed:
```
Request 'REGISTER' from '<sip:1000@app.soham.top>' - Not match Endpoint ACL
```

### Fix Applied

```sql
UPDATE ps_endpoints
SET deny = NULL, permit = NULL, acl = NULL,
    contact_deny = NULL, contact_permit = NULL, contact_acl = NULL
WHERE id NOT IN ('twilio_trunk');
```

This is persisted in migration `073_fix_pjsip_endpoint_acl.sql`.

After fix, verification:
```sql
SELECT id, deny, permit, acl FROM ps_endpoints;
-- Result:
-- 1000  NULL  NULL  NULL  ← ✅ no IP restriction
-- 1001  NULL  NULL  NULL  ← ✅ no IP restriction
```

Asterisk loaded the change after `module reload res_pjsip.so`:
```
-- Before: acl : deny/permit
-- After:  acl :             (empty — no restriction)
```

---

## 5. Fix 3 — res_pjsip_acl.so BASELINE ACL

### Problem

The Asterisk module `res_pjsip_acl.so` ("PJSIP ACL Resource") was loading and applying a global `BASELINE` ACL even when no ACL names were assigned to endpoints. The log entry was:

```
acl.c: SIP ACL: Rejecting '117.192.243.195' due to a failure to pass ACL '(BASELINE)'
```

This module is designed to allow blocking entire IP ranges globally. With no explicit ACL rules defined but the module loaded, Asterisk defaults to the BASELINE deny behavior.

### Fix Applied

Added to `docker/asterisk/config/modules.conf`:

```ini
[noload]
; PJSIP ACL module enforces BASELINE ACL denying all external IPs
; Credential-based auth (digest) is handled by res_pjsip.so
; External IP ACL restrictions are unnecessary when using SIP digest auth
res_pjsip_acl.so
```

> **Note**: If IP-based restrictions are needed in future, re-enable the module and add rules to `ps_acl` + `ps_endpoint_acl` tables.

---

## 6. Fix 4 — Spurious pjsip copy.conf

### Problem

A file named `docker/asterisk/config/pjsip copy.conf` existed in the config directory. Asterisk loads **all** `.conf` files from its config directory on startup. This file contained:

```ini
[twilio_trunk-identify]
type=identify
endpoint=twilio_trunk
match=138.2.68.107    ← ★ the SERVER'S OWN public IP mapped as Twilio
match=54.172.60.1
match=54.172.60.2
```

This caused the server's own loopback/test traffic (during the `sipsak` tests) to be misidentified as coming from the Twilio trunk — routing test registrations to the Twilio endpoint instead of the softphone endpoint.

### Fix Applied

```bash
git rm "docker/asterisk/config/pjsip copy.conf"
```

---

## 7. ARA Database Tables — Current State

All softphone extensions are managed exclusively through these MySQL tables. No static endpoint config in `.conf` files.

### 7.1 `ps_endpoints` — SIP Endpoint Configuration

The central table. One row per extension.

| Column | 1000 | 1001 | twilio_trunk | Notes |
|--------|------|------|-------------|-------|
| `id` | `1000` | `1001` | `twilio_trunk` | Primary key, used as endpoint name |
| `transport` | `transport-udp` | `transport-udp` | `transport-udp` | Must match pjsip.conf transport name |
| `context` | `from-internal` | `from-internal` | `from-twilio` | Dialplan context for inbound calls |
| `disallow` | `all` | `all` | `all` | Reject all codecs first, then allow specific |
| `allow` | `ulaw,alaw` | `ulaw,alaw` | `ulaw,alaw` | Codecs permitted |
| `aors` | `1000` | `1001` | `twilio_trunk` | References `ps_aors.id` |
| `auth` | `1000` | `1001` | `NULL` | References `ps_auths.id` (Twilio uses identify) |
| `deny` | `NULL` | `NULL` | `NULL` | **Was blocking all IPs — fixed to NULL** |
| `permit` | `NULL` | `NULL` | `NULL` | **Was Docker-only — fixed to NULL** |
| `acl` | `NULL` | `NULL` | `NULL` | Named ACL reference — NULL = no restriction |
| `webrtc` | `NULL` | `NULL` | `NULL` | Must be NULL/no for plain SIP clients |
| `media_encryption` | `NULL` | `NULL` | `NULL` | Must be NULL/no for plain SIP clients |
| `use_avpf` | `NULL` | `NULL` | `NULL` | Must be NULL/no for plain SIP clients |
| `ice_support` | `NULL` | `NULL` | `NULL` | Must be NULL/no for plain SIP clients |
| `direct_media` | `no` | `no` | `no` | Keeps Asterisk in media path (needed for recording) |
| `force_rport` | `yes` | `yes` | `yes` | Required for NAT traversal |
| `rtp_symmetric` | `yes` | `yes` | `yes` | Required for NAT traversal |

> **Critical**: If `webrtc`, `media_encryption`, `use_avpf`, or `ice_support` are set to `yes`/`dtls`/`passive`, native SIP clients (Zoiper, Linphone) **cannot register**. Those fields are for browser-based WebRTC only.

### 7.2 `ps_auths` — Authentication Credentials

| Column | 1000 | 1001 | Notes |
|--------|------|------|-------|
| `id` | `1000` | `1001` | Referenced by `ps_endpoints.auth` |
| `username` | `1000` | `1001` | Must match the extension number |
| `auth_type` | `userpass` | `userpass` | Use `userpass` for plaintext storage |
| `password` | `agent100pass` | `agent101pass` | Plain text password (12 chars) |
| `md5_cred` | `NULL` | `NULL` | Alternative: pre-computed MD5 of `user:realm:pass` |
| `realm` | `NULL` | `NULL` | NULL = use global realm (`asterisk`) |

> **How Asterisk verifies credentials**: When a softphone sends a REGISTER with `Authorization: Digest`, Asterisk computes `MD5(username:realm:password)` from the stored plaintext and compares it against the response hash in the SIP header. The realm used is the global one from `[global]` in `pjsip.conf` unless overridden per-auth row.

### 7.3 `ps_aors` — Address of Record (Registration Bindings)

| Column | 1000 | 1001 | Notes |
|--------|------|------|-------|
| `id` | `1000` | `1001` | Referenced by `ps_endpoints.aors` |
| `max_contacts` | `3` | `3` | Max simultaneous registrations (multiple devices) |
| `qualify_frequency` | `0` | `NULL` | `0` = disabled (no OPTIONS ping to softphone) |
| `default_expiration` | `NULL` | `NULL` | NULL = use Asterisk default (3600s) |
| `minimum_expiration` | `NULL` | `NULL` | |
| `maximum_expiration` | `NULL` | `NULL` | |

> When a softphone successfully registers, Asterisk writes the contact URI (e.g. `sip:1000@192.168.1.5:5060`) into the `ps_contacts` table. This is looked up when making outbound calls to the extension.

### 7.4 `ps_endpoint_id_ips` — IP-based Endpoint Identification

Used **only for the Twilio trunk** (IP auth, no credentials). Softphone extensions do not have identify records — they are matched by the `username` in the SIP `To:` header.

| id | endpoint | match (CIDR) |
|----|----------|-------------|
| `twilio-ashburn-60` | `twilio_trunk` | `54.172.60.0/24` |
| `twilio-ashburn-61` | `twilio_trunk` | `54.172.61.0/24` |
| `twilio-dublin` | `twilio_trunk` | `54.171.127.192/26` |
| `twilio-frankfurt` | `twilio_trunk` | `35.156.191.128/25` |
| `twilio-oregon` | `twilio_trunk` | `54.244.51.0/24` |
| `twilio-saopaulo` | `twilio_trunk` | `177.71.206.192/26` |

### 7.5 `ps_acl` and `ps_endpoint_acl` — Named ACL Rules

Both tables are **empty** (no rules = no restrictions). Created during this fix session because Asterisk expects them to exist when listed in `extconfig.conf`.

```sql
SELECT COUNT(*) FROM ps_acl;          -- 0 (no global ACL rules)
SELECT COUNT(*) FROM ps_endpoint_acl; -- 0 (no endpoint-to-ACL mappings)
```

> To add IP-based restrictions later (e.g. only allow office network):
> ```sql
> INSERT INTO ps_acl VALUES ('office-only', 'deny',  '0.0.0.0/0');
> INSERT INTO ps_acl VALUES ('office-only', 'permit', '203.0.113.0/24');
> INSERT INTO ps_endpoint_acl (endpoint_name, acl_name) VALUES ('1000', 'office-only');
> ```
> Then reload: `asterisk -rx "module reload res_pjsip.so"`

### 7.6 extconfig.conf — ODBC Table Mapping

```ini
[settings]
ps_endpoints    => odbc,asterisk,ps_endpoints
ps_auths        => odbc,asterisk,ps_auths
ps_aors         => odbc,asterisk,ps_aors
ps_endpoint_id_ips => odbc,asterisk,ps_endpoint_id_ips
ps_acl          => odbc,asterisk,ps_acl
ps_endpoint_acl => odbc,asterisk,ps_endpoint_acl
queues          => odbc,asterisk,queues
queue_members   => odbc,asterisk,queue_members
ps_transports   => odbc,asterisk,ps_transports
```

### 7.7 sorcery.conf — Object Resolution Order

```ini
[res_pjsip]
endpoint = realtime,ps_endpoints    ; try database first
endpoint = config,pjsip.conf,0      ; fallback to static config

auth     = realtime,ps_auths
auth     = config,pjsip.conf,0

aor      = realtime,ps_aors
aor      = config,pjsip.conf,0

[res_pjsip_endpoint_identifier_ip]
identify = realtime,ps_endpoint_id_ips
identify = config,pjsip.conf,0
```

The `0` suffix on config sources means "don't cache" — always re-read. Database sources are cached by default.

---

## 8. Python SIP Registration Test Tool

A Python script is used to simulate a full SIP REGISTER flow with proper digest authentication. This is the definitive way to validate the end-to-end stack **without needing a GUI softphone**.

### How SIP Digest Auth Works

```
Client                          Asterisk
  │                                │
  │── REGISTER (no auth) ─────────>│
  │                                │
  │<─ 401 Unauthorized ────────────│  (contains realm + nonce)
  │   WWW-Authenticate:            │
  │     Digest realm="asterisk"    │
  │     nonce="abc123..."          │
  │     qop="auth"                 │
  │                                │
  │  Client computes:              │
  │  A1 = MD5(user:realm:password) │
  │  A2 = MD5(method:uri)          │
  │  response = MD5(A1:nonce:nc:   │
  │             cnonce:qop:A2)     │
  │                                │
  │── REGISTER (with auth) ───────>│  (contains computed response)
  │   Authorization:               │
  │     Digest username="1000"     │
  │     response="computed_hash"   │
  │                                │
  │<─ 200 OK ──────────────────────│  (registration accepted)
```

### Complete Test Script

Save as `/tmp/test_sip_register.py`:

```python
#!/usr/bin/env python3
"""
SIP Registration Validator — End-to-End Digest Auth Test
Tests the full SIP REGISTER flow without a GUI softphone.

Usage:
  python3 test_sip_register.py
  python3 test_sip_register.py --server 138.2.68.107 --user 1000 --password agent100pass
"""

import socket
import hashlib
import random
import re
import argparse


def md5(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()


def compute_digest(method: str, uri: str, username: str, password: str,
                   realm: str, nonce: str, nc: str = '00000001',
                   cnonce: str = None, qop: str = None) -> str:
    """Compute SIP Digest Authorization header value (RFC 3261 §22.4)."""
    if not cnonce:
        cnonce = f"{random.randint(0x10000000, 0xffffffff):x}"
    A1 = md5(f"{username}:{realm}:{password}")
    A2 = md5(f"{method}:{uri}")
    if qop:
        response = md5(f"{A1}:{nonce}:{nc}:{cnonce}:{qop}:{A2}")
        return (f'Digest username="{username}", realm="{realm}", '
                f'nonce="{nonce}", uri="{uri}", algorithm=MD5, '
                f'qop={qop}, nc={nc}, cnonce="{cnonce}", response="{response}"')
    else:
        response = md5(f"{A1}:{nonce}:{A2}")
        return (f'Digest username="{username}", realm="{realm}", '
                f'nonce="{nonce}", uri="{uri}", algorithm=MD5, '
                f'response="{response}"')


def make_register(server: str, local_ip: str, local_port: int,
                  username: str, from_tag: str, call_id: str,
                  branch: str, seq: int, auth_header: str = '') -> str:
    """Build a SIP REGISTER message."""
    return (
        f"REGISTER sip:{server} SIP/2.0\r\n"
        f"Via: SIP/2.0/UDP {local_ip}:{local_port}"
        f";branch={branch};rport\r\n"
        f"Max-Forwards: 70\r\n"
        f"From: <sip:{username}@{server}>;tag={from_tag}\r\n"
        f"To: <sip:{username}@{server}>\r\n"
        f"Call-ID: {call_id}\r\n"
        f"CSeq: {seq} REGISTER\r\n"
        f"Contact: <sip:{username}@{local_ip}:{local_port}>\r\n"
        f"Expires: 60\r\n"
        f"Content-Length: 0\r\n"
        f"{auth_header}"
        f"\r\n"
    )


def test_registration(server: str, port: int, username: str,
                      password: str, local_port: int = 55060,
                      verbose: bool = True) -> bool:
    """
    Test SIP registration with full digest auth.
    
    Returns True on 200 OK, False on failure.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(5)
    sock.bind(('', local_port))
    
    # Try to detect our outbound IP
    try:
        tmp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        tmp.connect((server, port))
        local_ip = tmp.getsockname()[0]
        tmp.close()
    except Exception:
        local_ip = '127.0.0.1'
    
    call_id = f"{random.randint(100000, 999999)}@sip-test"
    from_tag = f"{random.randint(0x10000000, 0xffffffff):x}"
    branch1 = f"z9hG4bK.{random.randint(0x1000000, 0xfffffff):x}"
    
    try:
        # ── Step 1: Initial REGISTER (no auth) ────────────────────────────
        msg1 = make_register(server, local_ip, local_port, username,
                             from_tag, call_id, branch1, seq=1)
        sock.sendto(msg1.encode(), (server, port))
        
        resp1_bytes, _ = sock.recvfrom(4096)
        resp1 = resp1_bytes.decode(errors='replace')
        status1 = resp1.split('\r\n')[0]
        
        if verbose:
            print(f"  Step 1 → {status1}")
        
        if '401 Unauthorized' not in resp1 and '407 Proxy' not in resp1:
            print(f"  ✗ Expected 401, got: {status1}")
            return False
        
        # Parse challenge parameters
        realm_m = re.search(r'realm="([^"]+)"', resp1)
        nonce_m = re.search(r'nonce="([^"]+)"', resp1)
        qop_m   = re.search(r'qop="([^"]+)"', resp1)
        
        if not realm_m or not nonce_m:
            print("  ✗ Could not parse realm/nonce from 401 response")
            return False
        
        realm = realm_m.group(1)
        nonce = nonce_m.group(1)
        qop   = qop_m.group(1) if qop_m else None
        
        if verbose:
            print(f"  Challenge: realm={realm!r}, qop={qop!r}, "
                  f"nonce={nonce[:20]}...")
        
        # ── Step 2: REGISTER with digest auth ─────────────────────────────
        uri = f"sip:{server}"
        auth = compute_digest("REGISTER", uri, username, password,
                              realm, nonce, qop=qop)
        branch2 = f"z9hG4bK.{random.randint(0x1000000, 0xfffffff):x}"
        
        msg2 = make_register(server, local_ip, local_port, username,
                             from_tag, call_id, branch2, seq=2,
                             auth_header=f"Authorization: {auth}\r\n")
        sock.sendto(msg2.encode(), (server, port))
        
        resp2_bytes, _ = sock.recvfrom(4096)
        resp2 = resp2_bytes.decode(errors='replace')
        status2 = resp2.split('\r\n')[0]
        
        if verbose:
            print(f"  Step 2 → {status2}")
        
        return '200 OK' in status2
        
    except socket.timeout:
        print("  ✗ TIMEOUT — server did not respond (firewall or Asterisk down?)")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False
    finally:
        sock.close()


def main():
    parser = argparse.ArgumentParser(
        description='Test SIP REGISTER with digest auth')
    parser.add_argument('--server',   default='138.2.68.107')
    parser.add_argument('--port',     type=int, default=5060)
    parser.add_argument('--user',     default=None)
    parser.add_argument('--password', default=None)
    parser.add_argument('--quiet',    action='store_true')
    args = parser.parse_args()
    
    # Default: test all known extensions
    if args.user:
        test_cases = [(args.user, args.password or args.user)]
    else:
        test_cases = [
            ('1000', 'agent100pass'),
            ('1001', 'agent101pass'),
        ]
    
    print(f"\nSIP Registration Test — {args.server}:{args.port}")
    print("=" * 55)
    
    all_passed = True
    for username, password in test_cases:
        print(f"\nTesting ext {username} / {password!r}:")
        ok = test_registration(args.server, args.port, username, password,
                               local_port=55060 + int(username) % 100,
                               verbose=not args.quiet)
        status = "✅ PASS — 200 OK" if ok else "❌ FAIL"
        print(f"  Result: {status}")
        if not ok:
            all_passed = False
    
    print("\n" + "=" * 55)
    print("All tests PASSED ✅" if all_passed else "Some tests FAILED ❌")
    return 0 if all_passed else 1


if __name__ == '__main__':
    exit(main())
```

### Running the Test

```bash
# Test all default extensions
python3 /tmp/test_sip_register.py

# Test a specific extension
python3 /tmp/test_sip_register.py --server app.soham.top --user 1000 --password agent100pass

# Test against direct IP, quiet output (exit code 0=pass, 1=fail)
python3 /tmp/test_sip_register.py --server 138.2.68.107 --quiet
echo "Exit: $?"
```

### Expected Output (Healthy System)

```
SIP Registration Test — 138.2.68.107:5060
=======================================================

Testing ext 1000 / 'agent100pass':
  Step 1 → SIP/2.0 401 Unauthorized
  Challenge: realm='asterisk', qop='auth', nonce=1776270874/e850...
  Step 2 → SIP/2.0 200 OK
  Result: ✅ PASS — 200 OK

Testing ext 1001 / 'agent101pass':
  Step 1 → SIP/2.0 401 Unauthorized
  Challenge: realm='asterisk', qop='auth', nonce=1776271014/ef7e...
  Step 2 → SIP/2.0 200 OK
  Result: ✅ PASS — 200 OK

=======================================================
All tests PASSED ✅
```

### Failure Modes and What They Mean

| Step 1 Response | Step 2 Response | Diagnosis |
|----------------|-----------------|-----------|
| Timeout (no response) | — | Firewall blocking port 5060 |
| `408 Request Timeout` | — | Asterisk not running / not listening |
| `403 Forbidden` | — | Endpoint `deny/permit` ACL blocking IP |
| `401 Unauthorized` | `401 Unauthorized` | Wrong password, or `ps_auths` missing |
| `401 Unauthorized` | `404 Not Found` | Endpoint not in `ps_endpoints` |
| `401 Unauthorized` | `403 Forbidden` | ACL module BASELINE blocking |
| `401 Unauthorized` | `200 OK` | **Correct — registration succeeded** |

---

## 9. Quick Validation Checklist

Run these commands to verify the system is healthy:

```bash
# 1. Asterisk is running
docker exec asterisk asterisk -rx "core show version"
# Expected: Asterisk 22.x.x

# 2. Transports are loaded
docker exec asterisk asterisk -rx "pjsip show transports"
# Expected: transport-udp (5060), transport-tcp (5060), transport-tls (5061)

# 3. Extensions are loaded from database
docker exec asterisk asterisk -rx "pjsip show endpoints"
# Expected: 1000 (Unavailable), 1001 (Unavailable), twilio_trunk

# 4. Auth objects loaded
docker exec asterisk asterisk -rx "pjsip show auths"
# Expected: Auth: 1000/1000,  Auth: 1001/1001

# 5. ACL module is disabled
docker exec asterisk asterisk -rx "module show like res_pjsip_acl"
# Expected: "0 modules loaded" (not loaded)

# 6. Endpoint has no ACL restriction
docker exec asterisk asterisk -rx "pjsip show endpoint 1000" | grep acl
# Expected: "acl :" (blank — no restriction)

# 7. Database has no deny/permit
docker exec mysql mysql -u callcenter -pcallcenterpass callcenter \
  -e "SELECT id, deny, permit, acl FROM ps_endpoints WHERE id='1000';"
# Expected: 1000  NULL  NULL  NULL

# 8. Firewall allows SIP before REJECT
sudo iptables -S INPUT | grep -E "5060|REJECT" | head -8
# Expected: ACCEPT 5060 rules appear BEFORE the REJECT rule

# 9. Python end-to-end test
python3 /tmp/test_sip_register.py
# Expected: All tests PASSED ✅

# 10. Live log check during Zoiper registration
docker exec asterisk tail -f /var/log/asterisk/messages 2>/dev/null | grep -i register
# Expected after Zoiper connects: "... - Successfully authenticated" or "200 OK"
```

---

## 10. Adding New Extensions

To add extension `1004` with password `newagentpass`:

```sql
-- 1. Create endpoint
INSERT INTO ps_endpoints (id, transport, context, disallow, allow, aors, auth,
    deny, permit, acl, webrtc, media_encryption, use_avpf, ice_support,
    direct_media, force_rport, rtp_symmetric)
VALUES ('1004', 'transport-udp', 'from-internal', 'all', 'ulaw,alaw',
    '1004', '1004',
    NULL, NULL, NULL,   -- no ACL restrictions
    NULL, NULL, NULL, NULL,  -- no WebRTC
    'no', 'yes', 'yes');

-- 2. Create auth credentials
INSERT INTO ps_auths (id, username, password, auth_type)
VALUES ('1004', '1004', 'newagentpass', 'userpass');

-- 3. Create AOR (registration binding)
INSERT INTO ps_aors (id, max_contacts, qualify_frequency)
VALUES ('1004', 3, 0);
```

Then reload (no restart needed):
```bash
docker exec asterisk asterisk -rx "module reload res_pjsip.so"
```

Validate immediately:
```bash
python3 /tmp/test_sip_register.py --user 1004 --password newagentpass
```

---

## 11. Files Changed Summary

| File | Change | Reason |
|------|--------|--------|
| `docker/asterisk/config/modules.conf` | Added `res_pjsip_acl.so` to `[noload]` | Module was applying BASELINE ACL denying external IPs |
| `docker/asterisk/config/extconfig.conf` | Added `ps_acl` and `ps_endpoint_acl` table mappings | Asterisk needed these tables registered for ARA |
| `docker/asterisk/config/pjsip copy.conf` | **Deleted** | Had `match=138.2.68.107` mapping server IP as Twilio |
| `backend/migrations/073_fix_pjsip_endpoint_acl.sql` | New migration | Clears `deny/permit` columns for all softphone endpoints |
| `/etc/iptables/rules.v4` | Added SIP/RTP ACCEPT rules before REJECT | Firewall was silently dropping all SIP traffic |
| MySQL `ps_endpoints` (live) | `deny=NULL, permit=NULL` for 1000, 1001 | Removed Docker-only IP whitelist |
| MySQL `ps_acl` (live) | Created empty table | Missing table needed by Asterisk |
| MySQL `ps_endpoint_acl` (live) | Created empty table | Missing table needed by Asterisk |

### Git Commits During This Fix Session

```
5c93c70 Fix: Clear PJSIP endpoint deny/permit ACL blocking external SIP clients
e94889d Fix: Complete PJSIP ACL configuration and add testing guide
06c56cc Document: ACL issue diagnosis and fix
8a49c7d Fix: Add missing ps_acl and ps_endpoint_acl tables for PJSIP ACL support
febad78 Document Linphone native SIP fix: endpoint profile + firewall
ad397ae Add Linphone SIP configuration guide
0e0a976 Fix SIP credentials API to return public IP for direct SIP transports
760810e Enable all SIP transport protocols (UDP/TCP/TLS/WebSocket)
```

---

## Softphone Configuration Reference

### Zoiper / Linphone / Any SIP Client

```
Account type:    SIP
Server/Domain:   app.soham.top   (or 138.2.68.107 for direct IP)
Port:            5060
Transport:       UDP
Username:        1000
Password:        agent100pass
Realm:           asterisk   (or leave blank — auto-detected from 401 challenge)
```

| Extension | Username | Password | Context |
|-----------|----------|----------|---------|
| 1000 | `1000` | `agent100pass` | from-internal |
| 1001 | `1001` | `agent101pass` | from-internal |
| 1002 | `1002` | `agent105pass` | internal |
| 1003 | `1003` | *(see ps_auths)* | internal |
| 1013 | `1013` | *(see ps_auths)* | internal |
| 2500 | `2500` | *(see ps_auths)* | from-internal |
