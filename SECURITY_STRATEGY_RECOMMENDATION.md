# Security Strategy - Recommendation & Decision

## Current Situation

You have **TWO security systems running simultaneously**:

1. **fail2ban** (automatic) - Installed, configured, but catching 0 IPs
2. **iptables SIP-BLACKLIST** (manual) - 8 IPs blocked, millions of packets dropped ✅

## Strategy Options

### **Option A: Use fail2ban (Automatic + Manual Override)** ⭐ RECOMMENDED

**How it works:**
- fail2ban monitors Asterisk logs and auto-bans attackers
- You can also manually ban IPs via fail2ban
- All bans go into fail2ban's iptables chain (`ASTERISK`)
- UI integrates with fail2ban commands

**Backend Implementation:**
```go
// Block IP
exec.Command("sudo", "fail2ban-client", "set", "asterisk", "banip", ip)

// Unblock IP  
exec.Command("sudo", "fail2ban-client", "set", "asterisk", "unbanip", ip)

// List blocked IPs
exec.Command("sudo", "fail2ban-client", "status", "asterisk")
```

**Pros:**
- ✅ Automatic detection of attacks
- ✅ Temporary bans (auto-expire after 1 hour)
- ✅ Manual override via UI
- ✅ Unified system (one source of truth)
- ✅ Industry standard solution

**Cons:**
- ⚠️ Requires proper Asterisk logging
- ⚠️ May not catch all types of spam (only auth failures)
- ⚠️ Bans expire (can be changed to permanent)

**Current Issue:**
- fail2ban is configured but showing 0 bans
- Needs investigation: Are Asterisk logs in the right format?

---

### **Option B: Use iptables SIP-BLACKLIST (Manual Only)**

**How it works:**
- Maintain a custom iptables chain manually
- All blocking/unblocking is manual via UI
- No automatic detection
- Persistent across reboots

**Backend Implementation:**
```go
// Block IP
exec.Command("sudo", "iptables", "-I", "SIP-BLACKLIST", "1", "-s", ip, "-j", "DROP")
exec.Command("sudo", "netfilter-persistent", "save")

// Unblock IP
exec.Command("sudo", "iptables", "-D", "SIP-BLACKLIST", "-s", ip, "-j", "DROP")
exec.Command("sudo", "netfilter-persistent", "save")

// List blocked IPs
exec.Command("sudo", "iptables", "-L", "SIP-BLACKLIST", "-n", "-v")
```

**Pros:**
- ✅ Simple and direct
- ✅ Already working (8 IPs blocked)
- ✅ Permanent bans (until manually removed)
- ✅ No dependency on fail2ban
- ✅ Shows packet/byte statistics

**Cons:**
- ❌ No automatic detection
- ❌ Requires manual monitoring
- ❌ Need to identify spam IPs yourself
- ❌ More admin overhead

**Current Status:**
- **ACTIVE and WORKING** ✅
- 8 spam IPs blocked
- 32K+ packets dropped

---

### **Option C: Hybrid (Both Systems)** ⚡ BEST OF BOTH WORLDS

**How it works:**
- fail2ban handles automatic behavioral banning (temporary)
- SIP-BLACKLIST handles permanent manual bans
- UI shows both sources

**Backend Implementation:**
```go
// Get blocked IPs from BOTH sources
func GetBlockedIPs() {
    // 1. Get fail2ban bans
    fail2banIPs := getFromFail2ban()
    
    // 2. Get manual iptables bans
    manualIPs := getFromSIPBlacklist()
    
    // Merge and return
    return append(fail2banIPs, manualIPs...)
}

// Block IP - goes to SIP-BLACKLIST (permanent)
func BlockIP(ip) {
    iptables("-I", "SIP-BLACKLIST", "-s", ip, "-j", "DROP")
}

// Unblock IP - tries both
func UnblockIP(ip) {
    // Try fail2ban first
    fail2ban("set", "asterisk", "unbanip", ip)
    
    // Try iptables
    iptables("-D", "SIP-BLACKLIST", "-s", ip, "-j", "DROP")
}
```

**Pros:**
- ✅ Automatic + manual control
- ✅ Temporary (fail2ban) + permanent (iptables) bans
- ✅ Flexibility
- ✅ Best protection

**Cons:**
- ⚠️ More complex
- ⚠️ Need to manage two systems
- ⚠️ UI needs to show source of each ban

---

## Current Backend Implementation

**After latest changes, backend uses:** **Option B (iptables SIP-BLACKLIST only)**

This works but doesn't leverage fail2ban's automatic detection!

---

## My Recommendation: **Option C (Hybrid)** ⭐

### Why Hybrid is Best:

1. **Automatic Protection**: fail2ban catches new attackers automatically
2. **Manual Control**: You can permanently block known spam networks via SIP-BLACKLIST
3. **Flexibility**: Temporary bans for dynamic IPs, permanent for repeat offenders
4. **Best of Both**: Industry standard + custom control

### Implementation Plan:

#### Phase 1: Fix fail2ban (Enable Auto-Banning)
```bash
# 1. Check if Asterisk is logging properly
docker logs asterisk | grep -i "failed\|unauthorized\|invalid"

# 2. Update fail2ban filter if needed
# 3. Test by triggering failed auth
# 4. Verify auto-banning works
```

#### Phase 2: Update Backend to Hybrid
```go
// Blocked IPs from BOTH sources
- GET /api/v1/security/blocked-ips → Returns fail2ban + iptables IPs (marked with source)

// Manual blocking → SIP-BLACKLIST (permanent)
- POST /api/v1/security/block-ip → iptables -I SIP-BLACKLIST

// Unblock → Try both
- DELETE /api/v1/security/unblock-ip/:ip → fail2ban unban + iptables delete

// Stats → Combined
- GET /api/v1/security/stats → fail2ban stats + iptables stats
```

#### Phase 3: Update UI
```tsx
// Show IP source in table
{ip.source === 'fail2ban' ? (
  <Badge color="yellow">Auto (expires in 1h)</Badge>
) : (
  <Badge color="red">Manual (permanent)</Badge>
)}
```

---

## Decision Required

**Which strategy do you want?**

### A. **fail2ban Only** (automatic)
- Need to fix why fail2ban isn't catching anything
- Remove SIP-BLACKLIST chain
- All blocking via fail2ban

### B. **iptables SIP-BLACKLIST Only** (manual) - CURRENT STATE
- Keep as-is
- Accept manual management
- Simple but requires monitoring

### C. **Hybrid** (automatic + manual) - RECOMMENDED
- Keep both systems
- fail2ban for auto-detection
- SIP-BLACKLIST for permanent bans
- UI shows both

---

## Quick Fix for Now

If you want fail2ban to work, let's first check why it's not catching anything:

```bash
# 1. Check Asterisk logs exist
docker logs asterisk --tail 100 | grep -i "fail\|invalid\|unauthorized"

# 2. Check if fail2ban is monitoring
sudo fail2ban-client get asterisk logpath

# 3. Test fail2ban filter manually
sudo fail2ban-regex /var/log/asterisk/messages /etc/fail2ban/filter.d/asterisk.conf
```

The issue is likely that:
- Asterisk logs are inside Docker container
- fail2ban is on host
- Log paths don't match

**Solution**: Mount Asterisk logs to host or configure fail2ban to read Docker logs.

---

## Summary

**Current Backend**: Uses iptables SIP-BLACKLIST (manual only)  
**Current fail2ban**: Installed but not active (0 bans)  
**Original Intent**: fail2ban (based on documentation)  
**What's Actually Working**: iptables SIP-BLACKLIST (8 IPs, millions of packets blocked)

**My Recommendation**: Implement **Hybrid strategy** for best protection.

Tell me which option you prefer, and I'll implement it properly!
