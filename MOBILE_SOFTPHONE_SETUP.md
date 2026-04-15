# Mobile Softphone Setup Guide

## Overview

All transport protocols are now enabled for mobile SIP clients:
- **SIP UDP** (Port 5060) - Low latency, best for LAN
- **SIP TCP** (Port 5060) - Firewall-friendly, more reliable  
- **SIP TLS** (Port 5061) - Encrypted, highest security (recommended)
- **WebSocket** (Port 8088) - Browser-based and mobile web clients
- **IAX2** (Port 4569) - IAX protocol (in progress)

## Active Extensions & Credentials

### Extension 1000 (Agent)
- **Username:** `agent100`
- **Password:** `agent100pass`
- **Transports:** SIP (UDP/TCP/TLS), WebSocket
- **Notes:** Cloud-optimized, supports all protocols

### Extension 1002 (Sales)
- **Username:** `agent105`
- **Password:** `agent105pass`
- **Transports:** SIP (UDP/TCP/TLS)
- **Notes:** Standard mobile registration

### Extension 1013 (Support)
- **Username:** `1013`
- **Password:** `1234567`
- **Transports:** SIP (UDP/TCP/TLS)
- **Notes:** Legacy configuration

## Mobile Client Setup

### iOS / Android (SIP UDP)
```
Protocol:           SIP
Server/Domain:      app.soham.top (or your public IP: 138.2.68.107)
Port:               5060
Username:           agent100 (or 1002, 1013)
Password:           agent100pass (see credentials above)
Transport:          UDP (or TCP for better firewall compatibility)
Register:           Yes
Outbound Proxy:     app.soham.top:5060 (optional)
NAT Traversal:      STUN (optional, with app.soham.top:3478)
```

### Secure Connection (SIP TLS)
```
Protocol:           SIP
Server/Domain:      app.soham.top
Port:               5061
Username:           agent100
Password:           agent100pass
Transport:          TLS
Register:           Yes
Certificate:        Accept (self-signed certificate - tap Accept When Prompted)
```

### WebRTC / Browser Clients
```
Server:             app.soham.top (or 138.2.68.107)
Port:               8088
Username:           agent100
Password:           agent100pass
Transport:          WebSocket (ws:// or wss://)
TLS Required:       No for ws://, Yes for wss://
```

## Common Mobile Apps

### Android
- **Linphone** - Open-source, all protocols
- **Zoiper** - Commercial, features-rich
- **CSipSimple** - Legacy but stable
- **Bria** - Enterprise-grade

### iOS
- **Linphone** (App Store) - Recommended
- **Zoiper** - Commercial
- **Bria Mobile** - Enterprise
- **MicroSIP** - Lightweight

## Troubleshooting

### "Authentication Failed"
- **Cause:** Wrong username/password
- **Fix:** Verify credentials from `MOBILE_SOFTPHONE_SETUP.md` (this file)
- **Check:** Extension 1000 uses `agent100`, not `1000`

### "Server Not Reachable"
- **Cause:** Firewall blocking SIP ports
- **Fix:** Try different transports (TCP usually works through most firewalls)
- **Fallback:** Use WebSocket on port 8088 (HTTP port, rarely blocked)

### "TCP/TLS Not Working"
- **Cause:** Network not supporting encrypted connections
- **Fix:** Try UDP first, then TCP, then TLS
- **Diagnosis:** Test with: `nc -zu 138.2.68.107 5060` (UDP), `nc -zv 138.2.68.107 5060` (TCP)

### "NAT Issues - One Way Audio"
- **Cause:** NAT traversal not configured
- **Fix:** 
  - Enable STUN in client settings
  - STUN Server: `stun.l.google.com:3478`
  - Or use TLS which handles NAT better

### Extension Offline in Tests
- Check if Asterisk is running: `docker exec asterisk asterisk -rx "core show version"`
- Verify database connection: `docker exec asterisk asterisk -rx "database show"`
- Check endpoint registration: `docker exec asterisk asterisk -rx "pjsip show endpoints"`

## Database Credentials Location

All SIP credentials are stored in MySQL realtime (`ps_auths` table):

```sql
-- View credentials
SELECT id, username, password FROM ps_auths WHERE id IN (1000, 1002, 1013);

-- Add new credentials
INSERT INTO ps_auths (id, username, password, auth_type)
VALUES ('1050', 'newuser', 'securepass123', 'userpass');

-- Update existing
UPDATE ps_auths SET password='newpass' WHERE id='1000';
```

## Advanced Diagnostics

### Check Transport Status
```bash
docker exec asterisk asterisk -rx "pjsip show transports"
```

Expected output:
```
Transport:  transport-tcp   tcp    0  0  0.0.0.0:5060
Transport:  transport-tls   tls    0  0  0.0.0.0:5061
Transport:  transport-udp   udp    0  0  0.0.0.0:5060
Transport:  transport-ws    ws     0  0  0.0.0.0:8088
```

### Check Endpoint Configuration
```bash
docker exec asterisk asterisk -rx "pjsip show endpoint 1000"
```

### View SIP Registration
```bash
docker exec asterisk asterisk -rx "pjsip show registrations"
```

### Monitor Live Calls
```bash
docker exec asterisk asterisk -rx "pjsip show channels"
```

### Check Detailed Logs
```bash
docker logs asterisk | grep -i "transport\|registration\|auth"
```

## Security Notes

1. **TLS Certificate:** Self-signed certificate is used. Mobile clients will prompt for acceptance.
2. **Password Storage:** Plaintext in database (standard for SIP servers). Use strong passwords.
3. **Firewall:** Ensure UDP/TCP/TLS ports are open for your mobile clients' networks.
4. **Production:** Replace self-signed cert with CA-signed certificate for production.

## Performance Tips

- **UDP:** Lowest latency, best for LAN/stable connections
- **TCP:** Better firewall compatibility, slightly higher latency
- **TLS:** Encryption overhead ~50-100ms, recommended for security
- **WebSocket:** For web/browser clients, firewall-friendly (port 8088 = HTTP)

## Next Steps

1. Download mobile SIP client (Linphone recommended for ease)
2. Enter server details from your transport section above
3. Use credentials from "Active Extensions" section
4. Test registration - you should see "Online" status
5. Make a test call to another extension

## Support

For issues:
1. Check Asterisk logs: `docker logs asterisk | tail -100`
2. Check MySQL connection: `docker exec mysql mysql -u root -p<password> callcenter`
3. Verify file permissions: `docker exec asterisk chmod 644 /etc/asterisk/pjsip.conf`
4. Restart if config changes: `docker compose restart asterisk`
