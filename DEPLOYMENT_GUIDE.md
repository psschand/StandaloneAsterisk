# 🚀 Call Center Platform - Production Deployment Guide

**Version**: 1.0  
**Last Updated**: November 29, 2025  
**Platform**: Multi-Tenant Omnichannel Call Center with Asterisk + AI

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Fresh Installation (New Server)](#fresh-installation-new-server)
5. [Environment Configuration](#environment-configuration)
6. [Database Migrations](#database-migrations)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Testing & Verification](#testing--verification)
9. [Post-Deployment Tasks](#post-deployment-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Backup & Recovery](#backup--recovery)
12. [Upgrading Existing Installation](#upgrading-existing-installation)

---

## 📖 Overview

This guide covers deploying the call center platform to a new server. The platform includes:

- **Asterisk 18** - VoIP PBX with PJSIP, ARI, voicemail
- **Backend API** - Go 1.24 + Gin + GORM + MySQL
- **Frontend SPA** - React 18 + TypeScript + Vite
- **Database** - MySQL 8.0 with multi-tenant architecture
- **Cache/PubSub** - Redis for WebSocket scaling
- **Reverse Proxy** - Caddy with automatic HTTPS
- **AI Features** - Gemini AI chat with RAG knowledge base

### Architecture Highlights

- **Multi-tenant SaaS** with tenant isolation
- **Auto-migrations** on backend startup
- **Docker Compose** orchestration with health checks
- **Optimized** for low CPU/memory usage
- **WebRTC** support for browser-based calling
- **Omnichannel** - Voice, Chat, SMS, Email ticketing

---

## 💻 System Requirements

### Minimum Hardware
- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **Network**: Public IP with UDP/TCP ports accessible

### Operating System
- **Ubuntu 20.04/22.04 LTS** (recommended)
- **Debian 11/12**
- **CentOS 8/Rocky Linux 8**

### Software Prerequisites
```bash
# Docker Engine 24.0+ and Docker Compose V2
docker --version
docker compose version

# Git (for cloning repository)
git --version
```

### Required Ports

| Port(s) | Protocol | Service | Purpose |
|---------|----------|---------|---------|
| 80 | TCP | Caddy | HTTP (auto-redirects to HTTPS) |
| 443 | TCP | Caddy | HTTPS (frontend + API) |
| 5060 | UDP | Asterisk | SIP signaling |
| 10000-20000 | UDP | Asterisk | RTP media (audio/video) |
| 8088 | TCP | Asterisk ARI | Internal (Docker network only) |
| 3306 | TCP | MySQL | Internal (Docker network only) |

**Note**: Only ports 80, 443, 5060, and 10000-20000 need to be open to the internet.

---

## ✅ Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] **Server access** with sudo/root privileges
- [ ] **Domain name** pointing to server IP (e.g., `app.yourdomain.com`)
- [ ] **Public IP address** of the server
- [ ] **Twilio account** with SIP trunk configured (or other SIP provider)
- [ ] **Gemini API key** (for AI chat features)
- [ ] **Email credentials** (optional, for voicemail notifications)
- [ ] **Backup plan** for database and recordings
- [ ] **SSL certificate** (Caddy auto-generates Let's Encrypt certs)

### Gather Required Information

Create a checklist with these values:

```
Server Public IP: ___________________________
Domain Name: ________________________________
MySQL Root Password: ________________________
MySQL User Password: ________________________
JWT Secret Key: _____________________________
Twilio SIP Domain: __________________________
Twilio Username: ____________________________
Twilio Password: ____________________________
Twilio Phone Number: ________________________
Gemini API Key: _____________________________
```

---

## 🆕 Fresh Installation (New Server)

### Step 1: Prepare Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker compose version

# Install git (if not present)
sudo apt install -y git
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/psschand/StandaloneAsterisk.git
cd StandaloneAsterisk

# Verify you're in the correct directory
ls -la
# Should see: docker-compose.yml, Caddyfile, backend/, frontend/, etc.
```

### Step 3: Configure Environment Variables

#### Root Directory `.env`

```bash
# Copy example and edit
cp .env.example .env
nano .env
```

Edit the following values:

```dotenv
# CRITICAL: Update these values
ASTERISK_PUBLIC_IP=YOUR_SERVER_PUBLIC_IP  # e.g., 203.0.113.45
APP_DOMAIN=YOUR_DOMAIN                     # e.g., app.yourdomain.com

# Twilio SIP Trunk Configuration
TWILIO_SIP_DOMAIN=YOUR_REGION.pstn.twilio.com
TWILIO_IPS=YOUR_REGION.pstn.twilio.com
TWILIO_USERNAME=YOUR_TWILIO_USERNAME
TWILIO_PASSWORD=YOUR_TWILIO_PASSWORD
TWILIO_ORIGINATING_NUMBER=+1234567890

# Extension Credentials (Softphones)
EXT_100_USERNAME=100
EXT_100_PASSWORD=CHANGE_THIS_PASSWORD
EXT_100_CALLERID="Agent 100 <1234567890>"

# MySQL Configuration
MYSQL_ROOT_PASSWORD=STRONG_ROOT_PASSWORD_HERE
MYSQL_DATABASE=callcenter
MYSQL_USER=callcenter
MYSQL_PASSWORD=STRONG_USER_PASSWORD_HERE
```

#### Backend `.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

**CRITICAL**: Update these values:

```dotenv
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
SERVER_ENV=production  # IMPORTANT: Change to production

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=callcenter
DB_PASSWORD=SAME_AS_MYSQL_PASSWORD_ABOVE  # Must match root .env
DB_NAME=callcenter

# JWT Configuration (SECURITY CRITICAL)
JWT_SECRET=GENERATE_RANDOM_64_CHAR_STRING_HERE
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=168h

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN  # e.g., https://app.yourdomain.com
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Origin,Content-Type,Accept,Authorization

# Asterisk ARI Configuration
ASTERISK_ARI_URL=http://asterisk:8088/ari
ASTERISK_ARI_USERNAME=asterisk
ASTERISK_ARI_PASSWORD=asterisk

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# AI Configuration (Optional)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE  # Get from Google AI Studio
```

**Generate JWT Secret**:
```bash
# Generate secure random string
openssl rand -hex 32
```

#### Frontend `.env`

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

```dotenv
# API Configuration
VITE_API_URL=https://YOUR_DOMAIN/api  # e.g., https://app.yourdomain.com/api
VITE_WS_URL=wss://YOUR_DOMAIN/ws      # e.g., wss://app.yourdomain.com/ws

# Asterisk WebSocket (for WebRTC)
VITE_ASTERISK_WS_URL=wss://YOUR_DOMAIN/ws
```

### Step 4: Update Docker Compose Domain

Edit `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Find lines 153-155 and update:

```yaml
      # CHANGE THESE TO YOUR DOMAIN
      - CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN
      - SOFTPHONE_DOMAIN=YOUR_DOMAIN
      - SOFTPHONE_PROXY_HOST=YOUR_DOMAIN
```

### Step 5: Update Caddyfile

Edit `Caddyfile`:

```bash
nano Caddyfile
```

Update the domain (first line):

```
YOUR_DOMAIN {  # e.g., app.yourdomain.com
    # ... rest of config stays the same
}
```

### Step 6: Build and Start Services

```bash
# Ensure clean state (important for first install)
docker compose down -v
sudo rm -rf mysql_data/  # Only on fresh install

# Build all containers
docker compose build

# Start all services
docker compose up -d

# Monitor startup logs
docker compose logs -f
```

**Wait for MySQL to initialize** (first startup takes 2-3 minutes):

```bash
# Watch MySQL logs until you see "ready for connections"
docker compose logs -f mysql

# Watch backend logs for migration completion
docker compose logs -f backend
```

You should see:
```
backend  | Database connected successfully
backend  | Running database migrations...
backend  | Running migration 1: create_tenants_table
backend  | Migration 1 completed successfully
...
backend  | Running migration 50: seed_test_data
backend  | Migration 50 completed successfully
backend  | Database migrations completed successfully
```

### Step 7: Verify All Containers Running

```bash
docker compose ps
```

Expected output - all containers should show `healthy` or `running`:

```
NAME                  STATUS
asterisk              Up (healthy)
backend               Up (healthy)
caddy                 Up (healthy)
frontend              Up (healthy)
mysql                 Up (healthy)
redis                 Up (healthy)
```

---

## 🔧 Environment Configuration

### Required Environment Variables

#### Security-Critical Variables

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| `JWT_SECRET` | backend/.env | Signs authentication tokens | 64-char random hex |
| `MYSQL_ROOT_PASSWORD` | .env | MySQL admin access | Strong password |
| `MYSQL_PASSWORD` | .env, backend/.env | App database access | Strong password |
| `TWILIO_PASSWORD` | .env | SIP trunk authentication | From Twilio console |

#### Domain/Network Variables

| Variable | Location | Purpose | Example |
|----------|----------|---------|---------|
| `ASTERISK_PUBLIC_IP` | .env | SIP/RTP media routing | 203.0.113.45 |
| `APP_DOMAIN` | .env, Caddyfile, compose | Primary domain | app.yourdomain.com |
| `CORS_ALLOWED_ORIGINS` | backend/.env, compose | API security | https://app.yourdomain.com |
| `VITE_API_URL` | frontend/.env | Frontend API endpoint | https://app.yourdomain.com/api |

#### Optional Variables

| Variable | Location | Purpose | Default |
|----------|----------|---------|---------|
| `GEMINI_API_KEY` | backend/.env | AI chat features | (disabled) |
| `REDIS_PASSWORD` | backend/.env | Redis authentication | (none) |
| `LOG_LEVEL` | backend/.env | Logging verbosity | debug |
| `SERVER_ENV` | backend/.env | Environment mode | development |

---

## 🗄️ Database Migrations

### How Migrations Work

The backend automatically runs migrations on startup:

1. **Backend starts** → Connects to MySQL
2. **Migration check** → Reads `./migrations/*.sql` files
3. **Tracking** → Checks `migrations` table for applied migrations
4. **Execution** → Runs pending migrations in order (001, 002, ...)
5. **Recording** → Marks each migration as applied

### Migration Files Location

```
backend/migrations/
├── 001_create_tenants_table.sql
├── 002_create_users_table.sql
├── 003_create_user_roles_table.sql
...
├── 050_seed_test_data.sql          # Test tenant and users
├── 051_create_ps_endpoint_id_ips_table.sql
└── 052_add_team_name_to_chat_widgets.sql
```

### Initial Test Data (Migration 050)

After first startup, you'll have:

**Test Tenant**: `test-tenant-001` (Company: Test Company)

**Test Users**:
| Username | Password | Role | Extension |
|----------|----------|------|-----------|
| `manager` | `password123` | Manager | - |
| `agent100` | `password123` | Agent | 100 |
| `agent101` | `password123` | Agent | 101 |

**SIP Extensions**:
| Extension | Password | Caller ID |
|-----------|----------|-----------|
| 100 | `changeme100` | Agent 100 <9863334949> |
| 101 | `changeme101` | Agent 101 <9863334949> |

**Voicemail Boxes**: 1000, 1001

**Queues**: sales (rrmemory), support (leastrecent)

**DID**: +19863334949 → routes to sales queue

### Manual Migration Management

If migrations fail or you need manual control:

```bash
# View migration status
docker compose exec backend ls -la /app/migrations

# Check migrations table
docker compose exec mysql mysql -u callcenter -p callcenter -e "SELECT * FROM migrations ORDER BY id;"

# Manually run a specific migration
docker compose exec mysql mysql -u callcenter -p callcenter < backend/migrations/001_create_tenants_table.sql

# Reset migrations (DESTRUCTIVE - only for development)
docker compose exec mysql mysql -u callcenter -p -e "DROP DATABASE callcenter; CREATE DATABASE callcenter;"
docker compose restart backend
```

### Migration Troubleshooting

**Problem**: Migrations not running on backend startup

```bash
# Check backend logs
docker compose logs backend | grep -i migration

# Verify migrations directory exists in container
docker compose exec backend ls -la /app/migrations

# Ensure backend has read permissions
docker compose exec backend ls -la /app/migrations/*.sql
```

**Problem**: "Migration X failed" error

```bash
# View specific migration file
cat backend/migrations/00X_migration_name.sql

# Check MySQL error logs
docker compose logs mysql | tail -50

# Manually test SQL syntax
docker compose exec mysql mysql -u callcenter -p callcenter
```

---

## 🔒 SSL/TLS Configuration

### Automatic SSL with Caddy

Caddy automatically obtains Let's Encrypt SSL certificates if:

1. **Domain points to server** (DNS A record configured)
2. **Ports 80 and 443 open** (for ACME challenge)
3. **Valid email in Caddyfile** (optional but recommended)

#### Update Caddyfile for Production

```bash
nano Caddyfile
```

Add email for Let's Encrypt notifications:

```
{
    email admin@yourdomain.com  # Add this line
}

app.yourdomain.com {
    # ... rest of config
}
```

### Verify SSL Certificate

```bash
# Check Caddy logs for certificate issuance
docker compose logs caddy | grep -i certificate

# Test HTTPS connection
curl -I https://YOUR_DOMAIN

# Verify certificate details
echo | openssl s_client -connect YOUR_DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
```

### SSL Troubleshooting

**Issue**: "Unable to obtain certificate"

```bash
# Ensure DNS is correctly configured
dig YOUR_DOMAIN +short
# Should return your server's public IP

# Check firewall allows ports 80 and 443
sudo ufw status
sudo iptables -L -n | grep -E '(80|443)'

# View Caddy error logs
docker compose logs caddy | grep -i error
```

**Issue**: Certificate expired or renewal failed

```bash
# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# Check certificate expiry
echo | openssl s_client -connect YOUR_DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate
```

---

## ✅ Testing & Verification

### Step-by-Step Verification

#### 1. Check All Containers Running

```bash
docker compose ps
```

All should show `Up` or `healthy`.

#### 2. Test Database Connection

```bash
# Connect to MySQL
docker compose exec mysql mysql -u callcenter -p

# Enter password from .env file
# Run query:
SHOW DATABASES;
USE callcenter;
SHOW TABLES;
SELECT * FROM tenants;
SELECT id, username, email, role FROM users;
exit
```

Expected output: `test-tenant-001`, 3 users (manager, agent100, agent101)

#### 3. Test Backend API

```bash
# Health check
curl https://YOUR_DOMAIN/api/health

# Expected: {"status":"ok"}

# Test login
curl -X POST https://YOUR_DOMAIN/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"password123","tenant_id":"test-tenant-001"}'

# Expected: {"token":"...", "user":{...}}
```

#### 4. Test Frontend Access

Open browser: `https://YOUR_DOMAIN`

Expected:
- Login page loads
- No console errors (F12 developer tools)
- Can login with `manager` / `password123`

#### 5. Test Asterisk SIP

```bash
# Check Asterisk CLI
docker compose exec asterisk asterisk -rx "pjsip show endpoints"

# Expected output:
# Endpoint: 100/100  Unavailable  0 of inf
# Endpoint: 101/101  Unavailable  0 of inf

# Check Twilio trunk
docker compose exec asterisk asterisk -rx "pjsip show endpoint twilio-trunk"
```

#### 6. Test SIP Registration (Zoiper/Softphone)

Configure Zoiper:
- **Server**: YOUR_DOMAIN or YOUR_SERVER_IP
- **Port**: 5060 (UDP)
- **Username**: 100
- **Password**: changeme100
- **Domain**: (leave blank or same as server)

Expected: Green checkmark (registered)

#### 7. Test WebSocket Connection

```bash
# Check Redis (WebSocket backend)
docker compose exec redis redis-cli ping
# Expected: PONG

# Check backend WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://YOUR_DOMAIN/ws
```

#### 8. Test AI Chat (if enabled)

Login → Navigate to **AI Chat** → Select test agent

Send message: "Hello"

Expected: AI responds (if GEMINI_API_KEY configured)

#### 9. Test Call Flow

Make test call:
1. Dial DID from external phone (Twilio number configured in seed data)
2. Call should route to sales queue
3. Agent 100 (if registered) should receive call

### Performance Verification

```bash
# Check resource usage
docker stats --no-stream

# Expected (approximate):
# asterisk:  < 100MB RAM, < 10% CPU (idle)
# mysql:     < 200MB RAM, < 5% CPU (idle)
# backend:   < 50MB RAM, < 5% CPU (idle)
# frontend:  < 10MB RAM, < 1% CPU (idle)
# caddy:     < 50MB RAM, < 1% CPU (idle)
# redis:     < 20MB RAM, < 1% CPU (idle)
```

---

## 📝 Post-Deployment Tasks

### 1. Change Default Passwords

**CRITICAL SECURITY STEP**:

```bash
# Login to frontend as manager
# Navigate to: Settings → Users → Edit each user

# Change passwords for:
# - manager (default: password123)
# - agent100 (default: password123)
# - agent101 (default: password123)

# Also change SIP extension passwords:
# Navigate to: Settings → Extensions → Edit extension

# Change passwords for:
# - Extension 100 (default: changeme100)
# - Extension 101 (default: changeme101)
```

### 2. Create Production Tenant

```bash
# Login as manager
# Navigate to: Admin → Tenants → Create New Tenant

# Fill in:
# - Tenant ID: your-company-slug
# - Company Name: Your Company Inc.
# - Contact Email: admin@yourcompany.com
```

### 3. Create Production Users

```bash
# Navigate to: Admin → Users → Create User

# Assign to new tenant
# Set strong passwords
# Assign appropriate roles (agent, supervisor, admin)
```

### 4. Configure DIDs and Queues

```bash
# Navigate to: Settings → DIDs → Create DID
# Add your production Twilio numbers

# Navigate to: Settings → Queues → Create Queue
# Configure queue strategies (ringall, rrmemory, leastrecent)
# Add agents to queues
```

### 5. Setup Voicemail Notifications

Edit `voicemail.conf`:

```bash
nano voicemail.conf
```

Add email configuration:

```ini
[general]
format=wav49|gsm|wav
serveremail=voicemail@yourdomain.com
attach=yes
maxmsg=100
maxsecs=300

; SMTP Configuration
mailcmd=/usr/sbin/sendmail -t
emailsubject=New voicemail in mailbox ${VM_MAILBOX}
emailbody=You have a new voicemail from ${VM_CALLERID}
```

Restart Asterisk:

```bash
docker compose restart asterisk
```

### 6. Setup Backups

Create backup script:

```bash
nano /home/ubuntu/backup-callcenter.sh
```

```bash
#!/bin/bash
# Call Center Backup Script

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MySQL database
docker compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD callcenter > $BACKUP_DIR/callcenter_$DATE.sql

# Backup recordings (if applicable)
docker compose exec -T asterisk tar czf - /var/spool/asterisk/monitor > $BACKUP_DIR/recordings_$DATE.tar.gz

# Backup configurations
tar czf $BACKUP_DIR/config_$DATE.tar.gz .env backend/.env frontend/.env docker-compose.yml Caddyfile

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to cron:

```bash
chmod +x /home/ubuntu/backup-callcenter.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/ubuntu/backup-callcenter.sh >> /var/log/callcenter-backup.log 2>&1
```

### 7. Setup Monitoring

Install monitoring tools:

```bash
# Option 1: Simple monitoring with ctop
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop
ctop

# Option 2: Prometheus + Grafana (advanced)
# See DOCKER_OPTIMIZATION_GUIDE.md for details
```

### 8. Configure Firewall

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5060/udp    # SIP
sudo ufw allow 10000:20000/udp  # RTP
sudo ufw enable

# Verify
sudo ufw status
```

### 9. Setup Log Rotation

Docker Compose already has log rotation configured, but verify:

```bash
# Check docker-compose.yml logging section
grep -A 3 "logging:" docker-compose.yml

# Expected:
#   logging:
#     driver: json-file
#     options:
#       max-size: "10m"
#       max-file: "3"
```

### 10. Documentation

Create internal documentation:

```bash
# Create ops directory
mkdir -p /home/ubuntu/callcenter-ops

# Document:
# - Server credentials
# - DNS configuration
# - API keys and secrets (encrypted!)
# - Emergency contacts
# - Escalation procedures
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Backend Won't Start

**Symptom**: `docker compose ps` shows backend as `Exited (1)`

```bash
# Check backend logs
docker compose logs backend

# Common causes:
# 1. Database not ready - wait 30 seconds and try again
# 2. Invalid JWT_SECRET - check backend/.env
# 3. Migration failed - see migration section above
```

**Solution**:

```bash
# Restart backend after MySQL is ready
docker compose restart backend

# If still failing, check environment variables
docker compose exec backend env | grep -E '(DB_|JWT_)'
```

#### MySQL Initialization Failed

**Symptom**: MySQL container restarting or unhealthy

```bash
# Check MySQL logs
docker compose logs mysql | tail -100

# Common causes:
# 1. mysql_data volume has old data
# 2. Invalid configuration in my.cnf
```

**Solution**:

```bash
# DESTRUCTIVE: Remove volumes and restart
docker compose down -v
sudo rm -rf mysql_data/
docker compose up -d mysql

# Wait for "ready for connections"
docker compose logs -f mysql
```

#### Asterisk SIP Not Working

**Symptom**: Softphone can't register, calls fail

```bash
# Check Asterisk logs
docker compose logs asterisk | tail -50

# Check PJSIP endpoints
docker compose exec asterisk asterisk -rx "pjsip show endpoints"

# Check if Asterisk is listening
docker compose exec asterisk netstat -tulpn | grep 5060
```

**Solution**:

```bash
# Verify ASTERISK_PUBLIC_IP is correct
docker compose exec asterisk asterisk -rx "pjsip show endpoint 100"

# Check NAT configuration
docker compose exec asterisk cat /etc/asterisk/pjsip.conf | grep -A 5 transport-udp

# Restart Asterisk
docker compose restart asterisk
```

#### No Audio in Calls (RTP Issues)

**Symptom**: Calls connect but no audio

```bash
# Check RTP port range
docker compose exec asterisk asterisk -rx "rtp show settings"

# Verify firewall allows UDP 10000-20000
sudo ufw status | grep 10000:20000

# Check Asterisk public IP
docker compose exec asterisk asterisk -rx "pjsip show endpoint 100" | grep contact
```

**Solution**:

```bash
# Update ASTERISK_PUBLIC_IP in .env
nano .env
# Change ASTERISK_PUBLIC_IP to your server's public IP

# Restart containers
docker compose restart asterisk

# Test with Asterisk echo test
# Dial extension 600 from registered softphone
```

#### Frontend 404 or Blank Page

**Symptom**: Browser shows 404 or blank page

```bash
# Check Caddy logs
docker compose logs caddy | tail -50

# Check frontend build
docker compose logs frontend | grep -i error

# Verify frontend files exist
docker compose exec frontend ls -la /usr/share/nginx/html/
```

**Solution**:

```bash
# Rebuild frontend
docker compose build frontend
docker compose restart frontend caddy

# Check Caddyfile syntax
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

#### WebSocket Connection Failed

**Symptom**: "WebSocket disconnected" in browser console

```bash
# Check Redis
docker compose exec redis redis-cli ping

# Check backend WebSocket handler
docker compose logs backend | grep -i websocket

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8000/ws
```

**Solution**:

```bash
# Restart Redis and backend
docker compose restart redis backend

# Verify WebSocket URL in frontend
docker compose exec frontend cat /usr/share/nginx/html/assets/*.js | grep -o 'wss://[^"]*'
```

#### High CPU Usage

**Symptom**: Server slow, docker stats shows high CPU

```bash
# Check which container is consuming CPU
docker stats --no-stream

# Common culprits:
# - Asterisk: Many active calls
# - MySQL: Complex queries without indexes
# - Backend: Inefficient API calls
```

**Solution**:

```bash
# Asterisk: Check active calls
docker compose exec asterisk asterisk -rx "core show channels"

# MySQL: Check slow queries
docker compose exec mysql mysql -u root -p -e "SHOW FULL PROCESSLIST;"

# Backend: Check API logs
docker compose logs backend | grep -E '(POST|GET|PUT|DELETE)' | tail -50

# Adjust resource limits in docker-compose.yml if needed
```

#### Database Migration Stuck

**Symptom**: Backend logs show migration running but never completes

```bash
# Check active MySQL processes
docker compose exec mysql mysql -u root -p -e "SHOW FULL PROCESSLIST;"

# Check migration lock
docker compose exec mysql mysql -u callcenter -p callcenter -e "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
```

**Solution**:

```bash
# Kill stuck migration transaction (if safe)
# Find process ID from SHOW FULL PROCESSLIST
docker compose exec mysql mysql -u root -p -e "KILL <process_id>;"

# Restart backend
docker compose restart backend
```

---

## 💾 Backup & Recovery

### Backup Strategy

**What to Backup**:
1. MySQL database (call records, contacts, configurations)
2. Recording files (call recordings)
3. Configuration files (.env, docker-compose.yml, Caddyfile)
4. Voicemail messages
5. SSL certificates (if not using Caddy auto-SSL)

### Manual Backup

```bash
# Backup MySQL database
docker compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
  --single-transaction --routines --triggers \
  callcenter > callcenter_backup_$(date +%Y%m%d).sql

# Backup recordings
docker compose exec -T asterisk tar czf - /var/spool/asterisk/monitor \
  > recordings_backup_$(date +%Y%m%d).tar.gz

# Backup voicemail
docker compose exec -T asterisk tar czf - /var/spool/asterisk/voicemail \
  > voicemail_backup_$(date +%Y%m%d).tar.gz

# Backup configurations
tar czf config_backup_$(date +%Y%m%d).tar.gz \
  .env backend/.env frontend/.env docker-compose.yml Caddyfile
```

### Automated Backup (Recommended)

See [Post-Deployment Tasks - Setup Backups](#6-setup-backups)

### Recovery Procedure

#### Restore Database

```bash
# Stop backend to prevent writes
docker compose stop backend

# Restore database
docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD \
  callcenter < callcenter_backup_20241129.sql

# Restart backend
docker compose start backend

# Verify data restored
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "SELECT COUNT(*) FROM cdrs;"
```

#### Restore Recordings

```bash
# Extract recordings backup
docker compose exec -T asterisk tar xzf - -C / \
  < recordings_backup_20241129.tar.gz

# Verify files restored
docker compose exec asterisk ls -la /var/spool/asterisk/monitor/
```

#### Disaster Recovery (New Server)

1. **Provision new server** (same OS and Docker version)
2. **Install Docker** (see [Fresh Installation](#fresh-installation-new-server))
3. **Clone repository** and checkout same commit
4. **Restore configuration files**:
   ```bash
   tar xzf config_backup_20241129.tar.gz
   ```
5. **Update IP/domain** in .env and docker-compose.yml (if changed)
6. **Start MySQL only**:
   ```bash
   docker compose up -d mysql
   # Wait for "ready for connections"
   ```
7. **Restore database**:
   ```bash
   docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD \
     callcenter < callcenter_backup_20241129.sql
   ```
8. **Start remaining services**:
   ```bash
   docker compose up -d
   ```
9. **Restore recordings and voicemail** (if applicable)
10. **Verify all services** (see [Testing & Verification](#testing--verification))
11. **Update DNS** to point to new server IP

---

## 🔄 Upgrading Existing Installation

### Preparation

```bash
# 1. Backup current installation
# See Backup & Recovery section

# 2. Test upgrade in staging environment (if available)

# 3. Schedule maintenance window
# Notify users of downtime

# 4. Document current state
docker compose ps > pre-upgrade-status.txt
docker images > pre-upgrade-images.txt
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;" > pre-upgrade-migrations.txt
```

### Upgrade Procedure

```bash
# 1. Pull latest code
cd /path/to/StandaloneAsterisk
git fetch origin
git log --oneline main..origin/main  # Review changes
git pull origin main

# 2. Review changelog
cat CHANGELOG.md  # if exists

# 3. Check for new environment variables
diff .env .env.example
diff backend/.env backend/.env.example
diff frontend/.env frontend/.env.example

# Add any new required variables to your .env files

# 4. Rebuild containers
docker compose build

# 5. Stop services
docker compose down

# 6. Start services (migrations run automatically)
docker compose up -d

# 7. Monitor startup
docker compose logs -f backend | grep -i migration

# 8. Verify all services healthy
docker compose ps

# 9. Test critical functionality
# - Login
# - Make test call
# - Check queue status
# - Verify AI chat (if enabled)
```

### Rollback Procedure

If upgrade fails:

```bash
# 1. Stop services
docker compose down

# 2. Checkout previous version
git log --oneline -10  # Find previous commit hash
git checkout <previous-commit-hash>

# 3. Restore database backup
docker compose up -d mysql
# Wait for ready
docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD \
  callcenter < callcenter_backup_pre_upgrade.sql

# 4. Rebuild and start
docker compose build
docker compose up -d

# 5. Verify services
docker compose ps
```

---

## 📞 Support and Resources

### Documentation

- **User Guide**: `VOICEMAIL_USER_GUIDE.md`
- **Docker Optimization**: `DOCKER_OPTIMIZATION_GUIDE.md`
- **Migration Guide**: `DATABASE_MIGRATION_COMPLETE.md`
- **Feature Status**: `ALL_FEATURES_COMPLETE.md`

### Logs Location

| Service | Log Command |
|---------|-------------|
| All services | `docker compose logs` |
| Backend API | `docker compose logs backend` |
| Asterisk | `docker compose logs asterisk` |
| MySQL | `docker compose logs mysql` |
| Caddy | `docker compose logs caddy` |
| Frontend | `docker compose logs frontend` |

### Useful Commands

```bash
# Real-time logs
docker compose logs -f <service>

# Last 100 lines
docker compose logs --tail 100 <service>

# Since timestamp
docker compose logs --since 2024-11-29T10:00:00 <service>

# Container shell access
docker compose exec <service> /bin/bash  # or /bin/sh

# Asterisk CLI
docker compose exec asterisk asterisk -rvvv

# MySQL CLI
docker compose exec mysql mysql -u callcenter -p callcenter

# Redis CLI
docker compose exec redis redis-cli
```

### Performance Monitoring

```bash
# Resource usage
docker stats

# Disk usage
docker system df

# Network connections
docker compose exec asterisk netstat -tulpn
docker compose exec backend netstat -tulpn

# Process list
docker compose exec backend ps aux
docker compose exec asterisk ps aux
```

---

## 🎉 Deployment Checklist

Use this checklist to ensure complete deployment:

### Pre-Deployment
- [ ] Server meets minimum requirements
- [ ] Domain DNS configured (A record pointing to server IP)
- [ ] Firewall rules configured (ports 80, 443, 5060, 10000-20000)
- [ ] Docker and Docker Compose installed
- [ ] All credentials gathered (Twilio, Gemini, passwords)

### Configuration
- [ ] Cloned repository to server
- [ ] Created and configured `.env` (root directory)
- [ ] Created and configured `backend/.env`
- [ ] Created and configured `frontend/.env`
- [ ] Updated `docker-compose.yml` with domain (lines 153-155)
- [ ] Updated `Caddyfile` with domain and email
- [ ] Generated secure JWT secret (64 chars)
- [ ] Set strong MySQL passwords

### Deployment
- [ ] Removed old volumes (`docker compose down -v`)
- [ ] Built containers (`docker compose build`)
- [ ] Started services (`docker compose up -d`)
- [ ] Waited for MySQL initialization (2-3 minutes)
- [ ] Verified migrations completed successfully
- [ ] All containers showing healthy/running

### Verification
- [ ] Database connection tested (users and tenants exist)
- [ ] Backend API health check passes
- [ ] Frontend loads in browser (HTTPS)
- [ ] Login works with test credentials
- [ ] Asterisk shows SIP endpoints
- [ ] Softphone can register (extension 100)
- [ ] WebSocket connection established
- [ ] SSL certificate obtained (if using Caddy auto-SSL)

### Post-Deployment
- [ ] Changed all default passwords
- [ ] Created production tenant
- [ ] Created production users
- [ ] Configured production DIDs and queues
- [ ] Setup voicemail email notifications
- [ ] Configured automated backups
- [ ] Setup monitoring (ctop or Prometheus)
- [ ] Configured firewall rules
- [ ] Documented deployment (internal wiki/docs)
- [ ] Tested critical user workflows

### Security
- [ ] All default passwords changed
- [ ] JWT_SECRET is random and secure (64+ chars)
- [ ] MySQL passwords are strong (16+ chars)
- [ ] CORS_ALLOWED_ORIGINS set to production domain only
- [ ] SERVER_ENV set to "production" in backend/.env
- [ ] Firewall restricts access to necessary ports only
- [ ] SSL/TLS enabled and working
- [ ] Backup encryption enabled (if storing offsite)

---

## 📄 License and Credits

- **Platform**: Multi-Tenant Call Center
- **Author**: psschand
- **Repository**: https://github.com/psschand/StandaloneAsterisk
- **Version**: 1.0
- **Last Updated**: November 29, 2025

---

**End of Deployment Guide** - For technical support, refer to repository issues or documentation files.
