# Login Credentials - Quick Reference

## 🔐 Default User Accounts

### Admin Account
```
Email: admin@callcenter.com
Password: Password123!
Role: Admin
Tenant: demo-tenant
```

### Manager Account
```
Email: manager@callcenter.com
Password: Password123!
Role: Manager
Tenant: demo-tenant
```

### Agent Accounts
```
Email: agent1@callcenter.com
Password: Password123!
Role: Agent
Tenant: demo-tenant
```

```
Email: agent2@callcenter.com
Password: Password123!
Role: Agent
Tenant: demo-tenant
```

## ⚠️ Important Notes

1. **Password is case-sensitive**: `Password123!` (with capital P)
2. **Don't forget the exclamation mark**: `!` at the end
3. **Tenant ID**: All users are part of `demo-tenant`

## 🔧 Troubleshooting Login Issues

### If you get 401 Unauthorized:

1. **Clear browser cache and cookies**
   - Chrome: Ctrl+Shift+Del → Clear browsing data
   - Firefox: Ctrl+Shift+Del → Clear cookies and cache

2. **Hard refresh the page**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Check credentials**
   - Email: Must be exact (e.g., `admin@callcenter.com`)
   - Password: `Password123!` (case-sensitive with !)

4. **Check browser console** (F12)
   - Look for red errors
   - Check Network tab for failed requests

### Test Login via API:

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@callcenter.com",
      ...
    }
  }
}
```

## 🔄 Reset Password (if needed)

If you need to reset a password:

```bash
# Reset admin password back to Password123!
docker compose exec -T mysql mysql -uroot -pcallcenterpass callcenter <<EOF
UPDATE users 
SET password_hash = '\$2a\$10\$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG'
WHERE email = 'admin@callcenter.com';
EOF
```

## 📱 Features Available After Login

Once logged in, you'll have access to:

- ✅ **Dashboard** - Real-time metrics
- ✅ **DIDs Management** - Inbound number routing
- ✅ **Queue Management** - Agent queues
- ✅ **IVR Designer** - Interactive voice menus
- ✅ **SIP Trunks** - Carrier connections
- ✅ **Outbound Routes** - Dial plan rules
- ✅ **Dialplan Visualizer** - Visual routing flows
- ✅ **Extensions** - User endpoints
- ✅ **Settings** - System configuration

## 🎯 Quick Start After Login

1. **Log in** with `admin@callcenter.com` / `Password123!`
2. **Navigate to Dialplan Visualizer** to see your routing
3. **Try double-clicking** a DID or Queue node to edit it
4. **Visit Outbound Routes** to manage dial rules

---

**Last Updated**: November 19, 2025  
**System**: Standalone Asterisk Call Center  
**Version**: Production
