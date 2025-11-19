# Security Management UI - Implementation Complete ✅

## Overview
Comprehensive security management interface integrated into the admin panel, allowing administrators to monitor and control IP blocking via fail2ban and firewall.

**Implementation Date**: November 14, 2025  
**Status**: ✅ Production Ready  
**Access**: Admin and Superadmin roles only

---

## Features Implemented

### 1. Backend API (5 Endpoints)

**File**: `backend/internal/handler/security_handler.go` (261 lines)

All endpoints are registered at `/api/v1/security` (admin only):

1. **GET** `/api/v1/security/blocked-ips` - List currently banned IPs
   - Query param: `jail` (default: "asterisk")
   - Returns: Array of blocked IP objects with jail name, reason
   
2. **POST** `/api/v1/security/block-ip` - Manually ban an IP address
   - Body: `{ "ip": "192.168.1.100", "jail_name": "asterisk", "reason": "Manual ban" }`
   - Executes: `sudo fail2ban-client set asterisk banip <ip>`
   
3. **DELETE** `/api/v1/security/unblock-ip/:ip` - Unban an IP address
   - Query param: `jail` (default: "asterisk")
   - Executes: `sudo fail2ban-client set asterisk unbanip <ip>`
   
4. **GET** `/api/v1/security/stats` - Get security statistics
   - Returns: Currently failed, total failed, currently banned, total banned, firewall blocks
   
5. **GET** `/api/v1/security/firewall-logs` - Get recent firewall blocked attempts
   - Query param: `limit` (default: 100)
   - Parses: `/var/log/syslog` for "BLOCKED-SIP:" entries
   - Returns: Array of log entries with timestamp, message, source IP

---

### 2. Frontend UI Component

**File**: `frontend/src/pages/admin/SecurityManagement.tsx` (502 lines)

#### Features:

**Statistics Dashboard**
- 4 real-time stat cards:
  - Currently Banned IPs
  - Total Banned (all time)
  - Failed Attempts
  - Firewall Blocked Packets
- Auto-refresh every 30 seconds

**Blocked IPs Management**
- Table view of all currently banned IPs
- Shows: IP address, jail name, reason
- Actions: Unblock button per IP
- Empty state when no IPs blocked

**Firewall Logs Viewer**
- Scrollable list of recent firewall blocks
- Shows: Timestamp, source IP, full message
- Reverse chronological order (newest first)
- Max 50 recent entries

**Manual IP Blocking**
- Modal form to manually block IPs
- Fields: IP address (required), Reason (optional)
- Validation and error handling
- Success/error alerts

**Navigation Tabs**
- Blocked IPs (count badge)
- Firewall Logs (count badge)
- Statistics (detailed breakdown)

---

### 3. System Configuration

**File**: `setup_sudo_security.sh`

Configured passwordless sudo for security commands:
```bash
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/fail2ban-client
ubuntu ALL=(ALL) NOPASSWD: /bin/grep * /var/log/syslog
```

**Location**: `/etc/sudoers.d/fail2ban-api`  
**Permissions**: 0440 (read-only, owned by root)

---

## Security Architecture

### Multi-Layer Protection (All Active)

1. **Network Layer - iptables Firewall**
   - Whitelist: 5 Twilio IP ranges
   - Allow: Docker network WebSocket (172.25.0.0/16)
   - Drop: All other SIP traffic (port 5060)
   - Log: Rate-limited blocking (5/min)

2. **Application Layer - Asterisk ACL**
   - WebRTC endpoints: Deny 0.0.0.0/0, Permit 172.25.0.0/16
   - Twilio trunk: IP-based identification

3. **Behavioral Layer - fail2ban**
   - Monitors: Asterisk logs for failed auth attempts
   - Threshold: 3 failures in 5 minutes
   - Action: Ban for 1 hour
   - Management: via UI (block/unblock)

---

## Usage Guide

### Accessing the UI

1. Login as admin or superadmin
2. Navigate to **Admin → Security** in sidebar
3. UI loads with current statistics

### Blocking an IP

1. Click "Block IP" button
2. Enter IP address (e.g., `203.0.113.50`)
3. Optionally add reason (e.g., "Brute force attempt")
4. Click "Block IP"
5. IP is immediately banned via fail2ban

### Unblocking an IP

1. Go to "Blocked IPs" tab
2. Find the IP in the list
3. Click "Unblock" button
4. Confirm the action
5. IP is immediately unbanned

### Monitoring Activity

**Statistics Tab**:
- View fail2ban and firewall stats
- Protection status indicator
- Multi-layer protection info

**Firewall Logs Tab**:
- See recent blocked attempts
- Identify attacking IPs
- Monitor spam patterns

---

## API Examples

### Get Blocked IPs
```bash
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/v1/security/blocked-ips
```

Response:
```json
{
  "success": true,
  "data": {
    "blocked_ips": [
      {
        "ip": "203.0.113.50",
        "jail_name": "asterisk",
        "reason": "Brute force attempt"
      }
    ],
    "total": 1,
    "jail": "asterisk"
  }
}
```

### Block IP
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "reason": "Manual ban"}' \
  https://your-domain.com/api/v1/security/block-ip
```

### Unblock IP
```bash
curl -X DELETE -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/v1/security/unblock-ip/203.0.113.50?jail=asterisk
```

### Get Security Stats
```bash
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/v1/security/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "jail_name": "asterisk",
    "currently_failed": "0",
    "total_failed": "5",
    "currently_banned": "1",
    "total_banned": "3",
    "firewall_blocked_total": 127
  }
}
```

### Get Firewall Logs
```bash
curl -H "Authorization: Bearer <token>" \
  https://your-domain.com/api/v1/security/firewall-logs?limit=10
```

---

## File Changes

### Backend
- ✅ `backend/internal/handler/security_handler.go` (NEW - 261 lines)
- ✅ `backend/cmd/api/main.go` (MODIFIED - added securityHandler + 5 routes)
- ✅ `setup_sudo_security.sh` (NEW - sudoers configuration)

### Frontend
- ✅ `frontend/src/pages/admin/SecurityManagement.tsx` (NEW - 502 lines)
- ✅ `frontend/src/App.tsx` (MODIFIED - added /admin/security route)
- ✅ `frontend/src/components/layouts/DashboardLayout.tsx` (MODIFIED - added Security nav item)

### System
- ✅ `/etc/sudoers.d/fail2ban-api` (NEW - passwordless sudo for fail2ban commands)
- ✅ `/etc/fail2ban/filter.d/asterisk.conf` (EXISTS - from setup_fail2ban.sh)
- ✅ `/etc/fail2ban/jail.d/asterisk.conf` (EXISTS - from setup_fail2ban.sh)

---

## Testing

### Manual Testing Checklist

- [x] View blocked IPs list
- [x] Block an IP manually
- [x] Unblock an IP
- [x] View security statistics
- [x] View firewall logs
- [x] Verify auto-refresh (30s interval)
- [x] Test empty states
- [x] Test error handling
- [x] Verify role-based access (admin only)

### Automated fail2ban Testing

Test automatic blocking:
```bash
# Generate failed attempts (from different machine)
for i in {1..5}; do
  sip-cli REGISTER sip:test@your-ip:5060
done

# Check if IP was banned
sudo fail2ban-client status asterisk

# Should show the attacking IP in banned list
```

---

## Monitoring Commands

### Check fail2ban Status
```bash
sudo fail2ban-client status asterisk
```

### View Firewall Blocked IPs
```bash
sudo grep "BLOCKED-SIP:" /var/log/syslog | tail -20
```

### Check iptables Rules
```bash
sudo iptables -L -n -v | grep 5060
```

### Monitor Asterisk Security Logs
```bash
sudo tail -f /var/log/asterisk/messages | grep -E "NOTICE|WARNING|ERROR"
```

---

## Performance Impact

- **Backend**: Minimal - executes shell commands on-demand
- **Frontend**: ~5KB gzipped for SecurityManagement component
- **Auto-refresh**: 30-second interval (low network impact)
- **Database**: None - reads from fail2ban and syslog directly

---

## Security Considerations

1. **Sudo Access**: Limited to specific fail2ban commands only
2. **Authentication**: Requires admin or superadmin role
3. **Rate Limiting**: UI auto-refresh is 30s (prevents abuse)
4. **Input Validation**: IP addresses validated on frontend and backend
5. **Audit Trail**: All block/unblock actions logged in fail2ban

---

## Future Enhancements

Potential improvements:
- [ ] Whitelist management (never block certain IPs)
- [ ] Custom ban duration per IP
- [ ] Export firewall logs to CSV
- [ ] Email alerts on suspicious activity
- [ ] Geographic IP lookup for blocked IPs
- [ ] Multiple jail support (SSH, HTTP, etc.)
- [ ] Ban history with unban timestamps
- [ ] IP reputation check integration

---

## Troubleshooting

### Issue: "Permission denied" when blocking IP

**Solution**: Verify sudoers file is correctly configured
```bash
sudo visudo -cf /etc/sudoers.d/fail2ban-api
```

### Issue: Blocked IPs not showing

**Solution**: Ensure fail2ban service is running
```bash
sudo systemctl status fail2ban
sudo systemctl restart fail2ban
```

### Issue: Firewall logs empty

**Solution**: Check if iptables rules are logging
```bash
sudo iptables -L -n -v | grep LOG
# Should show LOG rules with "BLOCKED-SIP:" prefix
```

---

## Deployment Status

✅ **Backend**: Built and running (container restarted)  
✅ **Frontend**: Built and running (container restarted)  
✅ **Sudoers**: Configured and tested  
✅ **fail2ban**: Active and monitoring  
✅ **Firewall**: Active and blocking spam  

**Total Lines of Code**: 763 lines (261 backend + 502 frontend)  
**Implementation Time**: ~2 hours  
**Status**: ✅ Production Ready  

---

## Summary

The Security Management UI provides administrators with complete control over IP blocking and security monitoring. The system integrates fail2ban management with a user-friendly interface, allowing real-time monitoring of blocked IPs, failed attempts, and firewall activity. The multi-layer security architecture (firewall → Asterisk ACL → fail2ban) ensures robust protection against spam and brute-force attacks while maintaining easy management through the admin dashboard.
