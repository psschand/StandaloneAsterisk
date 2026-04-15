# Linphone SIP Configuration Guide

## Problem Fixed
Linphone was getting IOError when trying to connect with UDP/TCP/TLS because:
1. Softphone credentials API was hardcoded to return `app.soham.top` for all protocols
2. `app.soham.top` only routes HTTPS (port 443) through Caddy reverse proxy
3. SIP uses UDP/TCP/TLS on ports 5060/5061 and cannot be proxied through Caddy
4. Solution: API now returns the public IP (138.2.68.107) for direct SIP connections

## ✅ Correct Linphone Configuration for Admin Extension

Use these settings in Linphone:

### For UDP (Recommended - NAT Friendly)
- **Server/Proxy:** `138.2.68.107`
- **Username:** `1000`
- **Password:** `agent100pass`
- **Port:** `5060`
- **Transport:** `UDP`

### For TCP
- **Server/Proxy:** `138.2.68.107`
- **Username:** `1000`
- **Password:** `agent100pass`
- **Port:** `5060`
- **Transport:** `TCP`

### For TLS (Secure)
- **Server/Proxy:** `138.2.68.107`
- **Username:** `1000`
- **Password:** `agent100pass`
- **Port:** `5061`
- **Transport:** `TLS`

### For WebSocket (Browser/WebRTC)
- **Server/Proxy:** `app.soham.top`
- **Username:** `1000`
- **Password:** `agent100pass`
- **Port:** `443`
- **Transport:** `WSS` (WebSocket Secure)

## API Response

When authenticated admin calls `/api/v1/softphone/credentials`, the API automatically returns the appropriate configuration for their endpoint's transport:

```json
{
  "success": true,
  "data": {
    "domain": "app.soham.top",
    "extension": "1000",
    "password": "agent100pass",
    "port": 5060,
    "proxy": "138.2.68.107",
    "transport": "UDP",
    "username": "1000"
  }
}
```

## Network Architecture

```
Linphone Client (UDP/TCP/TLS)
        ↓
    138.2.68.107:5060/5061
        ↓
  Asterisk Container
        ↓
  PJSIP Endpoint 1000
        ↓
  MySQL ps_endpoints/ps_auths
```

For WebRTC/Browser clients:
```
Linphone Client (WebSocket)
        ↓
    app.soham.top:443 (HTTPS)
        ↓
   Caddy Proxy
        ↓
  Backend WebSocket Handler :8088
        ↓
   Asterisk WebRTC
```

## Environment Variables

Backend container uses:
- `SOFTPHONE_DOMAIN=app.soham.top` - Domain for WebSocket proxy
- `SOFTPHONE_SIP_HOST=138.2.68.107` - Public IP for direct SIP
- `SOFTPHONE_PROXY_PORT=443` - HTTPS proxy port

These can be customized in `docker-compose.yml` for other environments.

## Testing Connectivity

From your client machine:

```bash
# Test UDP
$ nc -u -zv 138.2.68.107 5060
Connection to 138.2.68.107 5060 port [udp/*] succeeded!

# Test TCP  
$ nc -zv 138.2.68.107 5060
Connection to 138.2.68.107 port [tcp/*] succeeded!

# Test TLS
$ openssl s_client -connect 138.2.68.107:5061
```

## Troubleshooting

If you still get IOError:

1. **Check firewall** - Ensure ports 5060 (UDP/TCP) and 5061 (TCP) are open
2. **Check DNS** - Verify 138.2.68.107 resolves correctly
3. **Check extension** - Verify extension 1000 exists in database:
   ```sql
   SELECT id, transport, auth FROM ps_endpoints WHERE id='1000';
   ```
4. **Check Asterisk logs**:
   ```bash
   docker compose logs --tail=100 asterisk | grep "1000\|REGISTER"
   ```
5. **Test API directly**:
   ```bash
   curl -X POST http://localhost:8001/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"admin@callcenter.com","password":"Password123!"}'
   ```

## Implementation Details

See [backend/internal/handler/softphone_handler.go](backend/internal/handler/softphone_handler.go#L131) for transport-aware credential logic.
