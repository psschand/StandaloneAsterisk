# Test User Credentials

## Test Users Created

All users are configured for the `demo-tenant` tenant.

### Password for All Users
**Password**: `Password123!`

### User Accounts

| Role    | Username | Email                    | First Name | Last Name |
|---------|----------|--------------------------|------------|-----------|
| Admin   | admin    | admin@callcenter.com     | Admin      | User      |
| Manager | manager  | manager@callcenter.com   | Manager    | User      |
| Agent   | agent1   | agent1@callcenter.com    | Agent      | One       |
| Agent   | agent2   | agent2@callcenter.com    | Agent      | Two       |

## Login Examples

### Admin Login
```
Email: admin@callcenter.com
Password: Password123!
Tenant: demo-tenant (auto-detected)
```

### Manager Login
```
Email: manager@callcenter.com
Password: Password123!
Tenant: demo-tenant (auto-detected)
```

### Agent Login
```
Email: agent1@callcenter.com
Password: Password123!
Tenant: demo-tenant (auto-detected)
```

## Frontend Access

Once port 80 is open in your security group:
- **URL**: http://138.2.68.107/

## Backend API Access

Once port 8443 is open in your security group:
- **API Base**: http://138.2.68.107:8443/api/v1/
- **Health Check**: http://138.2.68.107:8443/health
- **Adminer**: http://138.2.68.107:8443/adminer

## Database Access (via Adminer)

**URL**: http://138.2.68.107:8443/adminer

**Connection Details**:
- System: MySQL
- Server: `db` or `mysql`
- Username: `callcenter`
- Password: `callcenterpass`
- Database: `callcenter`

## Testing the Login

1. Open http://138.2.68.107/ (after opening port 80)
2. Enter any of the test user credentials
3. The frontend will auto-detect tenant as `demo-tenant`
4. You should be logged in and see the dashboard

## Password Hash

All users use the same bcrypt hash:
```
$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG
```

This hash was generated with bcrypt cost factor 10 and corresponds to the password `Password123!`

**✅ Verified**: This hash has been tested and confirmed to work with Go's `bcrypt.CompareHashAndPassword`

## Reset Users

If you need to reset the users or passwords, run:
```bash
docker exec -i mysql mysql -ucallcenter -pcallcenterpass callcenter < backend/seed_test_users.sql
```

## Validation

To validate the database setup:
```bash
cd backend && bash validate_database.sh
```
