# 🔧 Environment Configuration Reference

**Complete guide to all environment variables in the Call Center Platform**

---

## 📋 Overview

The platform uses three separate `.env` files:

1. **Root `.env`** - Asterisk and MySQL configuration
2. **backend/.env** - Go API server configuration
3. **frontend/.env** - React SPA build-time variables

---

## 📁 Root Directory `.env`

**Location**: `/home/ubuntu/wsp/call-center/standalone-asterix/.env`

### Asterisk Configuration

#### `ASTERISK_PUBLIC_IP`
- **Type**: IP address
- **Required**: Yes
- **Default**: `138.2.68.107`
- **Description**: Server's public IP for SIP/RTP media routing
- **Example**: `203.0.113.45`
- **Notes**: 
  - Use actual public IP, not private/NAT IP
  - Required for proper audio in calls (RTP)
  - If behind NAT, this should be external firewall IP

#### `APP_DOMAIN`
- **Type**: Domain name
- **Required**: Yes (for production)
- **Default**: Not set
- **Description**: Primary domain for the application
- **Example**: `app.yourdomain.com`
- **Notes**:
  - Used by Asterisk for WebRTC
  - Should match domain in Caddyfile
  - DNS must point to server IP

### Twilio SIP Trunk Configuration

#### `TWILIO_SIP_DOMAIN`
- **Type**: Hostname
- **Required**: Yes (if using Twilio)
- **Default**: `nlpbay.pstn.ashburn.twilio.com`
- **Description**: Twilio SIP trunk domain for your region
- **Example**: `nlpbay.pstn.ashburn.twilio.com`
- **Notes**:
  - Get from Twilio Console → Elastic SIP Trunking
  - Format: `<region>.pstn.<location>.twilio.com`
  - Different regions have different domains

#### `TWILIO_IPS`
- **Type**: Hostname or IP
- **Required**: Yes (if using Twilio)
- **Default**: `nlpbay.pstn.ashburn.twilio.com`
- **Description**: Twilio signaling IP for endpoint identification
- **Example**: `nlpbay.pstn.ashburn.twilio.com` or `54.172.60.0`
- **Notes**:
  - Can be hostname or IP address
  - Used in PJSIP identify section
  - Must match actual Twilio signaling source

#### `TWILIO_USERNAME`
- **Type**: String
- **Required**: Yes (if using credential auth)
- **Default**: `Admin`
- **Description**: Twilio SIP trunk username
- **Example**: `your-username`
- **Notes**:
  - Get from Twilio Console → Trunk → Credentials
  - Can be blank if using IP ACL only

#### `TWILIO_PASSWORD`
- **Type**: String (sensitive)
- **Required**: Yes (if using credential auth)
- **Default**: `Admin@1234567`
- **Description**: Twilio SIP trunk password
- **Example**: `securepassword123`
- **Notes**:
  - **SECURITY**: Change default immediately
  - Use strong password (16+ chars)
  - Can be blank if using IP ACL only

#### `TWILIO_ORIGINATING_NUMBER`
- **Type**: E.164 phone number
- **Required**: Yes
- **Default**: `+19863334949`
- **Description**: Caller ID for outbound calls
- **Example**: `+15551234567`
- **Notes**:
  - Must be a verified Twilio number
  - Format: +[country][area][number]
  - Used as `From` header in SIP INVITE

### SIP Extension Configuration

#### `EXT_100_USERNAME`
- **Type**: String
- **Required**: Yes
- **Default**: `100`
- **Description**: Username for extension 100
- **Example**: `100`
- **Notes**:
  - Used for SIP authentication
  - Typically matches extension number

#### `EXT_100_PASSWORD`
- **Type**: String (sensitive)
- **Required**: Yes
- **Default**: `changeme100`
- **Description**: Password for extension 100
- **Example**: `StrongPass123!`
- **Notes**:
  - **SECURITY**: Change default immediately
  - Used by softphones (Zoiper, Linphone, etc.)
  - Min 10 chars recommended

#### `EXT_100_CALLERID`
- **Type**: Caller ID string
- **Required**: No
- **Default**: `"Agent 100 <9863334949>"`
- **Description**: Display name and number for extension 100
- **Example**: `"John Doe <15551234567>"`
- **Notes**:
  - Format: `"Name <number>"`
  - Quotes required if contains spaces
  - Number should match Twilio originating number

#### `EXT_101_USERNAME`, `EXT_101_PASSWORD`, `EXT_101_CALLERID`
- Same as extension 100, for second agent
- **Optional**: Uncomment in `.env` if needed

### MySQL Configuration

#### `MYSQL_ROOT_PASSWORD`
- **Type**: String (sensitive)
- **Required**: Yes
- **Default**: `callcenterrootpass`
- **Description**: MySQL root user password
- **Example**: `SuperSecure_Root_Pass_2024!`
- **Notes**:
  - **SECURITY**: Change default immediately
  - Min 16 chars, mixed case, symbols
  - Used for database administration only

#### `MYSQL_DATABASE`
- **Type**: String
- **Required**: Yes
- **Default**: `callcenter`
- **Description**: Database name for application
- **Example**: `callcenter` or `callcenter_prod`
- **Notes**:
  - Created automatically on first MySQL start
  - Should match `DB_NAME` in backend/.env

#### `MYSQL_USER`
- **Type**: String
- **Required**: Yes
- **Default**: `callcenter`
- **Description**: MySQL application user
- **Example**: `callcenter_app`
- **Notes**:
  - Created automatically on first MySQL start
  - Has full privileges on MYSQL_DATABASE
  - Should match `DB_USER` in backend/.env

#### `MYSQL_PASSWORD`
- **Type**: String (sensitive)
- **Required**: Yes
- **Default**: `callcenterpass`
- **Description**: Password for MySQL application user
- **Example**: `App_User_Pass_2024!`
- **Notes**:
  - **SECURITY**: Change default immediately
  - **CRITICAL**: Must match `DB_PASSWORD` in backend/.env
  - Min 16 chars recommended

---

## 📁 Backend `.env`

**Location**: `/home/ubuntu/wsp/call-center/standalone-asterix/backend/.env`

### Server Configuration

#### `SERVER_HOST`
- **Type**: IP address
- **Required**: Yes
- **Default**: `0.0.0.0`
- **Description**: Interface to bind HTTP server
- **Example**: `0.0.0.0` (all interfaces) or `127.0.0.1` (localhost only)
- **Notes**:
  - `0.0.0.0` recommended for Docker
  - Don't change unless you know what you're doing

#### `SERVER_PORT`
- **Type**: Integer (1-65535)
- **Required**: Yes
- **Default**: `8000`
- **Description**: Port for backend API server
- **Example**: `8000`
- **Notes**:
  - Exposed in docker-compose.yml
  - Proxied by Caddy at /api path
  - Don't change unless updating docker-compose.yml

#### `SERVER_ENV`
- **Type**: String (enum)
- **Required**: Yes
- **Default**: `development`
- **Allowed**: `development`, `production`, `staging`
- **Description**: Runtime environment mode
- **Example**: `production`
- **Notes**:
  - **IMPORTANT**: Set to `production` for live deployments
  - Affects logging verbosity and error responses
  - `development` shows detailed error messages

### Database Configuration

#### `DB_HOST`
- **Type**: Hostname
- **Required**: Yes
- **Default**: `mysql`
- **Description**: MySQL server hostname
- **Example**: `mysql` (Docker) or `localhost` (local)
- **Notes**:
  - Use `mysql` for Docker Compose (service name)
  - Use IP or hostname for external database

#### `DB_PORT`
- **Type**: Integer (1-65535)
- **Required**: Yes
- **Default**: `3306`
- **Description**: MySQL server port
- **Example**: `3306`
- **Notes**:
  - Standard MySQL port
  - Only change if MySQL uses non-standard port

#### `DB_USER`
- **Type**: String
- **Required**: Yes
- **Default**: `callcenter`
- **Description**: MySQL username for backend
- **Example**: `callcenter`
- **Notes**:
  - **CRITICAL**: Must match `MYSQL_USER` in root .env

#### `DB_PASSWORD`
- **Type**: String (sensitive)
- **Required**: Yes
- **Default**: `your-secure-password`
- **Description**: MySQL password for backend
- **Example**: `App_User_Pass_2024!`
- **Notes**:
  - **CRITICAL**: Must match `MYSQL_PASSWORD` in root .env
  - **SECURITY**: Change from example value

#### `DB_NAME`
- **Type**: String
- **Required**: Yes
- **Default**: `callcenter`
- **Description**: Database name to connect to
- **Example**: `callcenter`
- **Notes**:
  - **CRITICAL**: Must match `MYSQL_DATABASE` in root .env

#### `DB_MAX_OPEN_CONNS`
- **Type**: Integer (1-1000)
- **Required**: No
- **Default**: `25`
- **Description**: Maximum database connections in pool
- **Example**: `25`
- **Notes**:
  - Higher = more concurrent requests
  - Too high = resource exhaustion
  - 25 suitable for most deployments

#### `DB_MAX_IDLE_CONNS`
- **Type**: Integer (1-100)
- **Required**: No
- **Default**: `5`
- **Description**: Maximum idle connections kept open
- **Example**: `5`
- **Notes**:
  - Should be ≤ DB_MAX_OPEN_CONNS
  - Higher = faster response (reuses connections)
  - 5-10 typical for production

#### `DB_CONN_MAX_LIFETIME`
- **Type**: Integer (seconds)
- **Required**: No
- **Default**: `300`
- **Description**: Maximum lifetime of connections (seconds)
- **Example**: `300` (5 minutes)
- **Notes**:
  - Prevents stale connection issues
  - 300-600 typical for production

### JWT Configuration

#### `JWT_SECRET`
- **Type**: String (sensitive)
- **Required**: Yes
- **Default**: `your-super-secret-jwt-key-change-this-in-production`
- **Description**: Secret key for signing JWT tokens
- **Example**: `a1b2c3d4e5f6...` (64 hex chars)
- **Notes**:
  - **SECURITY CRITICAL**: Must be random and secret
  - Min 32 chars, 64+ recommended
  - Generate with: `openssl rand -hex 32`
  - Changing this invalidates all existing tokens

#### `JWT_EXPIRATION`
- **Type**: Duration string
- **Required**: Yes
- **Default**: `24h`
- **Description**: Access token lifetime
- **Example**: `24h`, `1h`, `30m`
- **Notes**:
  - Format: `<number><unit>` (h=hours, m=minutes)
  - Shorter = more secure, more logins
  - 1-24 hours typical

#### `JWT_REFRESH_EXPIRATION`
- **Type**: Duration string
- **Required**: Yes
- **Default**: `168h`
- **Description**: Refresh token lifetime
- **Example**: `168h` (7 days)
- **Notes**:
  - Should be > JWT_EXPIRATION
  - 7-30 days typical
  - Users re-login after this expires

### CORS Configuration

#### `CORS_ALLOWED_ORIGINS`
- **Type**: Comma-separated URLs
- **Required**: Yes
- **Default**: `http://localhost:3000,http://localhost:3001`
- **Description**: Allowed frontend origins for CORS
- **Example**: `https://app.yourdomain.com,https://yourdomain.com`
- **Notes**:
  - **SECURITY**: Only list trusted domains
  - Include protocol (http:// or https://)
  - No trailing slashes
  - Separate multiple with commas (no spaces)

#### `CORS_ALLOWED_METHODS`
- **Type**: Comma-separated HTTP methods
- **Required**: Yes
- **Default**: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- **Description**: Allowed HTTP methods
- **Example**: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- **Notes**:
  - Don't remove OPTIONS (required for preflight)
  - Add others if needed (HEAD, CONNECT, etc.)

#### `CORS_ALLOWED_HEADERS`
- **Type**: Comma-separated header names
- **Required**: Yes
- **Default**: `Origin,Content-Type,Accept,Authorization`
- **Description**: Allowed request headers
- **Example**: `Origin,Content-Type,Accept,Authorization,X-Custom-Header`
- **Notes**:
  - `Authorization` required for JWT
  - `Content-Type` required for JSON
  - Add custom headers if needed

### Asterisk ARI Configuration

#### `ASTERISK_ARI_URL`
- **Type**: URL
- **Required**: Yes
- **Default**: `http://asterisk:8088/ari`
- **Description**: Asterisk REST Interface endpoint
- **Example**: `http://asterisk:8088/ari`
- **Notes**:
  - Use `asterisk` (Docker service name)
  - Port 8088 is Asterisk HTTP server
  - Don't add trailing slash

#### `ASTERISK_ARI_USERNAME`
- **Type**: String
- **Required**: Yes
- **Default**: `asterisk`
- **Description**: ARI authentication username
- **Example**: `asterisk`
- **Notes**:
  - Configured in Asterisk ari.conf
  - Should match Asterisk configuration

#### `ASTERISK_ARI_PASSWORD`
- **Type**: String (sensitive)
- **Required**: Yes
- **Default**: `asterisk`
- **Description**: ARI authentication password
- **Example**: `SecureARIPass123`
- **Notes**:
  - **SECURITY**: Change default in production
  - Configured in Asterisk ari.conf

#### `ASTERISK_ARI_APP`
- **Type**: String
- **Required**: Yes
- **Default**: `callcenter`
- **Description**: ARI application name
- **Example**: `callcenter`
- **Notes**:
  - Used to register WebSocket connection
  - Should match dialplan Stasis() calls

### WebSocket Configuration

#### `WS_READ_BUFFER_SIZE`
- **Type**: Integer (bytes)
- **Required**: No
- **Default**: `1024`
- **Description**: WebSocket read buffer size
- **Example**: `1024`
- **Notes**:
  - Affects memory usage per connection
  - 1024 bytes suitable for most use cases

#### `WS_WRITE_BUFFER_SIZE`
- **Type**: Integer (bytes)
- **Required**: No
- **Default**: `1024`
- **Description**: WebSocket write buffer size
- **Example**: `1024`
- **Notes**:
  - Should match or exceed read buffer
  - 1024 bytes suitable for most use cases

#### `WS_PING_INTERVAL`
- **Type**: Duration string
- **Required**: No
- **Default**: `30s`
- **Description**: Ping interval for keepalive
- **Example**: `30s`, `1m`
- **Notes**:
  - Keeps connections alive through proxies
  - 30-60 seconds typical

#### `WS_PONG_TIMEOUT`
- **Type**: Duration string
- **Required**: No
- **Default**: `60s`
- **Description**: Timeout waiting for pong response
- **Example**: `60s`
- **Notes**:
  - Should be ≥ WS_PING_INTERVAL
  - Connection closed if no pong received

### File Upload Configuration

#### `UPLOAD_MAX_SIZE`
- **Type**: Integer (bytes)
- **Required**: No
- **Default**: `10485760`
- **Description**: Maximum upload file size
- **Example**: `10485760` (10MB)
- **Notes**:
  - 10MB = 10 * 1024 * 1024 bytes
  - Adjust based on expected file types

#### `UPLOAD_PATH`
- **Type**: Directory path
- **Required**: No
- **Default**: `./uploads`
- **Description**: Directory to store uploaded files
- **Example**: `./uploads`
- **Notes**:
  - Relative to backend working directory
  - Should be in mounted volume for persistence

#### `UPLOAD_ALLOWED_TYPES`
- **Type**: Comma-separated MIME types
- **Required**: No
- **Default**: `image/jpeg,image/png,image/gif,application/pdf,text/plain`
- **Description**: Allowed file MIME types
- **Example**: `image/jpeg,image/png,application/pdf`
- **Notes**:
  - **SECURITY**: Restrict to necessary types
  - Add others: `audio/wav`, `video/mp4`, etc.

### Rate Limiting

#### `RATE_LIMIT_ENABLED`
- **Type**: Boolean
- **Required**: No
- **Default**: `true`
- **Description**: Enable API rate limiting
- **Example**: `true` or `false`
- **Notes**:
  - **SECURITY**: Recommended for production
  - Prevents abuse and DoS attacks

#### `RATE_LIMIT_REQUESTS`
- **Type**: Integer
- **Required**: No (if rate limiting enabled)
- **Default**: `100`
- **Description**: Max requests per window
- **Example**: `100`
- **Notes**:
  - Adjust based on expected traffic
  - Too low = legitimate users affected

#### `RATE_LIMIT_WINDOW`
- **Type**: Duration string
- **Required**: No (if rate limiting enabled)
- **Default**: `1m`
- **Description**: Time window for rate limiting
- **Example**: `1m` (1 minute)
- **Notes**:
  - Works with RATE_LIMIT_REQUESTS
  - 100 requests per 1 minute = 100/min

### Logging

#### `LOG_LEVEL`
- **Type**: String (enum)
- **Required**: No
- **Default**: `debug`
- **Allowed**: `debug`, `info`, `warn`, `error`
- **Description**: Minimum log level
- **Example**: `info` (production), `debug` (development)
- **Notes**:
  - `debug` = verbose, all logs
  - `info` = important events
  - `warn` = warnings and errors
  - `error` = errors only

#### `LOG_FORMAT`
- **Type**: String (enum)
- **Required**: No
- **Default**: `json`
- **Allowed**: `json`, `text`
- **Description**: Log output format
- **Example**: `json` (production), `text` (development)
- **Notes**:
  - `json` = structured logs (easier to parse)
  - `text` = human-readable

#### `LOG_OUTPUT`
- **Type**: String (enum)
- **Required**: No
- **Default**: `stdout`
- **Allowed**: `stdout`, `file`, `both`
- **Description**: Log output destination
- **Example**: `stdout`
- **Notes**:
  - `stdout` = Docker logs (recommended)
  - `file` = write to file
  - `both` = stdout and file

### Redis Configuration

#### `REDIS_HOST`
- **Type**: Hostname
- **Required**: Yes (if using Redis)
- **Default**: `redis`
- **Description**: Redis server hostname
- **Example**: `redis` (Docker) or `localhost`
- **Notes**:
  - Used for WebSocket PubSub (multi-server)
  - Optional: system works without Redis

#### `REDIS_PORT`
- **Type**: Integer (1-65535)
- **Required**: Yes (if using Redis)
- **Default**: `6379`
- **Description**: Redis server port
- **Example**: `6379`
- **Notes**:
  - Standard Redis port

#### `REDIS_PASSWORD`
- **Type**: String (sensitive)
- **Required**: No
- **Default**: (empty)
- **Description**: Redis authentication password
- **Example**: `RedisPass123`
- **Notes**:
  - Leave empty if Redis has no auth
  - Set if using AUTH command

#### `REDIS_DB`
- **Type**: Integer (0-15)
- **Required**: No
- **Default**: `0`
- **Description**: Redis database number
- **Example**: `0`
- **Notes**:
  - 0-15 available by default
  - Use different DB for isolation

### AI Configuration

#### `GEMINI_API_KEY`
- **Type**: String (sensitive)
- **Required**: No (optional feature)
- **Default**: (not set)
- **Description**: Google Gemini API key for AI chat
- **Example**: `AIzaSyD...`
- **Notes**:
  - Get from Google AI Studio
  - **OPTIONAL**: AI features disabled without this
  - Used for chatbot and knowledge base RAG

---

## 📁 Frontend `.env`

**Location**: `/home/ubuntu/wsp/call-center/standalone-asterix/frontend/.env`

### API Configuration

#### `VITE_API_URL`
- **Type**: URL
- **Required**: Yes
- **Default**: (not set)
- **Description**: Backend API base URL
- **Example**: `https://app.yourdomain.com/api`
- **Notes**:
  - Include protocol (https://)
  - Include `/api` path (Caddy proxy route)
  - No trailing slash

#### `VITE_WS_URL`
- **Type**: WebSocket URL
- **Required**: Yes
- **Default**: (not set)
- **Description**: WebSocket endpoint URL
- **Example**: `wss://app.yourdomain.com/ws`
- **Notes**:
  - Use `wss://` for HTTPS (secure WebSocket)
  - Use `ws://` for HTTP only (development)
  - Include `/ws` path

### Asterisk WebSocket (WebRTC)

#### `VITE_ASTERISK_WS_URL`
- **Type**: WebSocket URL
- **Required**: No (if using WebRTC)
- **Default**: (not set)
- **Description**: Asterisk WebSocket endpoint for WebRTC
- **Example**: `wss://app.yourdomain.com/ws`
- **Notes**:
  - Used for browser-based calling
  - Should match VITE_WS_URL in most cases

---

## 🔐 Security Best Practices

### Password Requirements

**All passwords should:**
- Be at least 16 characters
- Include uppercase, lowercase, numbers, symbols
- Not contain dictionary words
- Be unique (don't reuse across services)

**Generate secure passwords:**
```bash
# 32-character alphanumeric
openssl rand -base64 32

# 64-character hex (for JWT_SECRET)
openssl rand -hex 32
```

### Sensitive Variables

**Never commit these to Git:**
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `DB_PASSWORD`
- `JWT_SECRET`
- `TWILIO_PASSWORD`
- `GEMINI_API_KEY`
- `REDIS_PASSWORD`
- `ASTERISK_ARI_PASSWORD`

**Use `.env` files (already in `.gitignore`):**
```bash
# Verify .gitignore
cat .gitignore | grep .env

# Should output:
# .env
# backend/.env
# frontend/.env
```

### Production vs Development

| Variable | Development | Production |
|----------|-------------|------------|
| `SERVER_ENV` | `development` | `production` |
| `LOG_LEVEL` | `debug` | `info` or `warn` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `https://yourdomain.com` |
| `JWT_EXPIRATION` | `24h` | `1h` - `4h` |
| `RATE_LIMIT_ENABLED` | `false` | `true` |

---

## 📋 Quick Setup Checklist

### For Fresh Installation

1. **Copy all example files:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Update root `.env`:**
   - [ ] `ASTERISK_PUBLIC_IP` → Your server IP
   - [ ] `APP_DOMAIN` → Your domain
   - [ ] `TWILIO_*` → Your Twilio credentials
   - [ ] `MYSQL_ROOT_PASSWORD` → Strong password
   - [ ] `MYSQL_PASSWORD` → Strong password

3. **Update backend/.env:**
   - [ ] `SERVER_ENV` → `production`
   - [ ] `DB_PASSWORD` → Same as `MYSQL_PASSWORD` above
   - [ ] `JWT_SECRET` → Random 64 hex chars
   - [ ] `CORS_ALLOWED_ORIGINS` → `https://YOUR_DOMAIN`
   - [ ] `GEMINI_API_KEY` → Your API key (optional)

4. **Update frontend/.env:**
   - [ ] `VITE_API_URL` → `https://YOUR_DOMAIN/api`
   - [ ] `VITE_WS_URL` → `wss://YOUR_DOMAIN/ws`

5. **Update docker-compose.yml:**
   - [ ] Lines 153-155: Change domains to YOUR_DOMAIN

6. **Update Caddyfile:**
   - [ ] Line 1: Change to YOUR_DOMAIN
   - [ ] Add email for Let's Encrypt

---

## 🔍 Validation Commands

### Verify Environment Variables Loaded

```bash
# Backend container
docker compose exec backend env | grep -E '(DB_|JWT_|ASTERISK_)'

# Check specific variable
docker compose exec backend printenv JWT_SECRET
```

### Test Database Connection

```bash
# Using backend env vars
docker compose exec backend sh -c 'mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT VERSION();"'
```

### Verify CORS Configuration

```bash
# Test CORS from browser console or curl
curl -i -X OPTIONS https://YOUR_DOMAIN/api/health \
  -H "Origin: https://YOUR_DOMAIN" \
  -H "Access-Control-Request-Method: GET"

# Should return:
# Access-Control-Allow-Origin: https://YOUR_DOMAIN
```

---

## 📞 Troubleshooting

### "Cannot connect to database"

**Check:**
1. `DB_PASSWORD` in backend/.env matches `MYSQL_PASSWORD` in root .env
2. `DB_USER` matches `MYSQL_USER`
3. `DB_NAME` matches `MYSQL_DATABASE`
4. MySQL container is running: `docker compose ps mysql`

### "JWT validation failed"

**Check:**
1. `JWT_SECRET` is set and not empty
2. Frontend is using correct API URL
3. Token not expired (check `JWT_EXPIRATION`)

### "CORS error in browser"

**Check:**
1. `CORS_ALLOWED_ORIGINS` includes your frontend domain
2. Protocol matches (http vs https)
3. No trailing slashes in origins
4. docker-compose.yml lines 153-155 updated

### "Twilio calls fail"

**Check:**
1. `ASTERISK_PUBLIC_IP` is server's public IP
2. `TWILIO_*` credentials correct
3. Firewall allows UDP 10000-20000
4. SIP trunk configured in Twilio console

---

**End of Environment Configuration Reference**
