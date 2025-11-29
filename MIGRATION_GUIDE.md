# 🔄 Database Migration & Synchronization Guide

**Version**: 2.0  
**Date**: November 29, 2025  
**Purpose**: Guide for database migrations, synchronization, and MySQL migration

---

## 📋 Overview

This guide covers three scenarios:
1. **Fresh Installation** - New server, empty database
2. **Existing Installation** - Current server with Docker MySQL
3. **MySQL Migration** - Moving from Docker MySQL to external MySQL server

---

## 🆕 Scenario 1: Fresh Installation (New Server)

### What Happens

1. Docker Compose starts MySQL container
2. MySQL init scripts run (only Asterisk PJSIP tables)
3. Backend starts and connects to MySQL
4. **Migrations run automatically** (001-060)
5. Database fully initialized with all tables

### Steps

```bash
# 1. Clone repository
git clone <repo> && cd standalone-asterix

# 2. Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit all .env files

# 3. Start services
docker compose up -d

# 4. Monitor migration execution
docker compose logs -f backend | grep -i migration
```

### Expected Output

```
Running database migrations...
Running migration 1: create_tenants_table
Migration 1 completed successfully
Running migration 2: create_users_table
Migration 2 completed successfully
...
Running migration 71: create_migrations_table
Migration 71 completed successfully
Database migrations completed successfully
```

### Verification

```bash
# Check all 71 migrations applied
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "SELECT COUNT(*) FROM migrations;"

# Should show: 71

# Check all tables exist
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "SHOW TABLES;" | wc -l

# Should show: 52+ tables
```

---

## 🔧 Scenario 2: Existing Installation (Sync Current Database)

### Problem

Your current database has:
- ✅ 52 tables (all working)
- ⚠️ Only 19 migrations tracked
- ❌ 41 migrations not applied
- ❌ Some tables created by init scripts, not migrations

### Solution: Synchronize Migration Tracking

Use the provided synchronization script to:
1. Mark existing tables as "migrated"
2. Clear failed migrations
3. Allow new migrations to run

### Steps

#### Option A: Automatic Sync Script (Recommended)

```bash
# 1. Run sync script
./sync-migrations.sh

# 2. Rebuild backend with fixes
docker compose build backend

# 3. Restart backend
docker compose restart backend

# 4. Check migration logs
docker compose logs backend | grep -i migration
```

#### Option B: Manual Sync

```bash
# 1. Connect to MySQL
docker compose exec mysql mysql -u callcenter -p callcenter

# 2. Mark migrations 1-19 as applied (already exist)
INSERT IGNORE INTO migrations (id, name) VALUES 
(1, 'create_tenants_table'),
(2, 'create_users_table'),
(3, 'create_user_roles_table'),
(4, 'create_dids_table'),
(5, 'create_queues_table'),
(6, 'create_queue_members_table'),
(7, 'create_cdrs_table'),
(8, 'create_agent_states_table'),
(9, 'create_contacts_table'),
(10, 'create_tickets_table'),
(11, 'create_ticket_messages_table'),
(12, 'create_chat_widgets_table'),
(13, 'create_chat_sessions_table'),
(14, 'create_chat_messages_table'),
(15, 'create_chat_agents_table'),
(16, 'create_chat_transfers_table'),
(17, 'create_voicemail_messages_table'),
(18, 'create_sms_messages_table'),
(19, 'create_recordings_table');

# 3. Delete failed migration 020
DELETE FROM migrations WHERE id = 20;

# 4. Exit MySQL
exit

# 5. Rebuild backend
docker compose build backend

# 6. Restart backend to run remaining migrations
docker compose restart backend
```

### Verification

```bash
# Check migrations applied
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "SELECT COUNT(*) FROM migrations;"

# Should show: 71 (after sync + new migrations run)

# Check for errors
docker compose logs backend | grep -i "migration.*failed"
# Should show: (empty)
```

---

## 🔀 Scenario 3: Migrate from Docker MySQL to External MySQL

### Use Case

You want to move your database from the Docker MySQL container to:
- AWS RDS
- Google Cloud SQL
- Dedicated MySQL server
- Different Docker MySQL instance

### Prerequisites

- External MySQL 8.0+ server accessible
- MySQL credentials (host, port, username, password)
- Network connectivity from app server to MySQL server

### Steps

#### Step 1: Backup Current Database

```bash
# Export current database
docker compose exec -T mysql mysqldump -u root -p \
  --single-transaction --routines --triggers \
  callcenter > backup_$(date +%Y%m%d).sql

# Verify backup
ls -lh backup_*.sql
```

#### Step 2: Prepare External MySQL

```bash
# Connect to external MySQL
mysql -h <external-host> -P 3306 -u root -p

# Create database and user
CREATE DATABASE callcenter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'callcenter'@'%' IDENTIFIED BY 'YourSecurePassword';
GRANT ALL PRIVILEGES ON callcenter.* TO 'callcenter'@'%';
FLUSH PRIVILEGES;
exit
```

#### Step 3: Choose Migration Method

##### Method A: Import Full Backup (Faster, for existing data)

```bash
# Import backup to external MySQL
mysql -h <external-host> -P 3306 -u callcenter -p callcenter < backup_20251129.sql

# This preserves:
# - All data
# - Existing migrations tracking
# - Current schema state
```

##### Method B: Fresh Migration (Cleaner, for new deployment)

```bash
# Just run migrations on empty database
# Update backend/.env to point to external MySQL:
DB_HOST=external-mysql-host.example.com
DB_PORT=3306
DB_USER=callcenter
DB_PASSWORD=YourSecurePassword
DB_NAME=callcenter

# Restart backend - migrations run automatically
docker compose restart backend

# This creates:
# - Fresh schema from migrations
# - No old data
# - Clean migration tracking
```

#### Step 4: Update Backend Configuration

```bash
# Edit backend/.env
nano backend/.env
```

Update these values:
```env
DB_HOST=external-mysql-host.example.com  # External MySQL hostname
DB_PORT=3306                              # External MySQL port
DB_USER=callcenter                        # Database username
DB_PASSWORD=YourSecurePassword            # Database password
DB_NAME=callcenter                        # Database name
```

#### Step 5: Update Docker Compose (Optional)

If no longer using Docker MySQL:

```bash
# Edit docker-compose.yml
nano docker-compose.yml
```

Comment out MySQL service:
```yaml
# mysql:
#   image: mysql:8.0
#   ...
```

Update backend depends_on:
```yaml
backend:
  depends_on:
    # mysql:
    #   condition: service_healthy
    redis:
      condition: service_started
```

#### Step 6: Restart and Verify

```bash
# Rebuild backend (with new DB config)
docker compose build backend

# Restart all services
docker compose restart

# Check backend logs
docker compose logs backend | grep -i "database connected"
# Should show: Database connected successfully

# Verify migrations
mysql -h <external-host> -u callcenter -p callcenter \
  -e "SELECT COUNT(*) FROM migrations;"
```

#### Step 7: Test Application

```bash
# Test API health
curl https://your-domain.com/api/health

# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"password123","tenant_id":"test-tenant-001"}'

# Check data access
# Login to frontend and verify:
# - Users list loads
# - Queues display
# - CDRs visible
# - Contacts accessible
```

---

## 🔧 Migration System Details

### What Was Fixed

1. **Removed Duplicate Migration IDs**
   - Fixed: 015, 020, 030, 031, 050
   - Renumbered to sequential 001-060

2. **Enhanced Migration Executor**
   - Now handles multiple CREATE TABLE in one file
   - Splits SQL by semicolons
   - Executes statements individually in transaction

3. **Disabled Init Script Overlaps**
   - `03-multi-tenant-schema.sql` → disabled
   - `04-incremental-multi-tenant.sql` → disabled
   - Only Asterisk PJSIP tables from init scripts

4. **Created Missing Migrations**
   - 058-060: products, channel_connections, knowledge_base_articles
   - 061-071: Fixed duplicates + newly discovered tables (11 migrations)

### Current Migration Files (001-071)

```
001_create_tenants_table.sql
002_create_users_table.sql
003_create_user_roles_table.sql
...
019_create_recordings_table.sql
020_create_ai_chat_tables.sql        ← Fixed multi-statement
036_create_outbound_routes.sql       ← Renumbered from 015
037_create_call_tags_table.sql       ← Renumbered from 020
038_create_audit_logs_table.sql      ← Renumbered from 021
...
050_add_website_channels.sql
051-056_alter_tables.sql             ← ALTER TABLE migrations
057_create_knowledge_base_documents_table.sql
058_create_products_table.sql
059_create_channel_connections_table.sql
060_create_knowledge_base_articles_table.sql
061_seed_pjsip_only.sql              ← Renamed from duplicate 050
062_create_ai_training_data_table.sql ← NEW
063_create_ps_transports_table.sql   ← NEW
064_create_websites_table.sql        ← NEW
065_create_conversations_table.sql   ← NEW
066_create_conversation_tags_table.sql ← NEW
067_create_quick_replies_table.sql   ← NEW
068_create_handoff_rules_table.sql   ← NEW
069_create_channel_integrations_table.sql ← NEW
070_create_ai_agent_config_table.sql ← NEW
071_create_migrations_table.sql      ← NEW
```

**Total:** 56 migration files (IDs 001-071, gap 021-035)

---

## 🛠️ Troubleshooting

### Issue: "Migration X failed: Error 1050 (42S01): Table 'X' already exists"

**Cause**: Migration trying to create table that exists

**Solution**:
```bash
# Option 1: Mark migration as applied
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "INSERT IGNORE INTO migrations (id, name) VALUES (X, 'table_name');"

# Option 2: Use sync script
./sync-migrations.sh
```

### Issue: "Migration 020 failed: SQL syntax error"

**Cause**: Old migration file before fix

**Solution**:
```bash
# Rebuild backend with fixed migration system
docker compose build backend
docker compose restart backend
```

### Issue: "Database connection failed after MySQL migration"

**Cause**: Backend can't reach external MySQL

**Solution**:
```bash
# Check connectivity
telnet external-mysql-host 3306

# Check firewall rules
# MySQL server must allow connections from app server IP

# Check credentials
mysql -h external-mysql-host -u callcenter -p
```

### Issue: "Some migrations applied but tables don't exist"

**Cause**: Migration marked as applied but didn't actually create table

**Solution**:
```bash
# Remove bad migration record
docker compose exec mysql mysql -u callcenter -p callcenter \
  -e "DELETE FROM migrations WHERE id=X;"

# Restart backend to re-run
docker compose restart backend
```

---

## 📊 Verification Checklist

After any migration scenario:

- [ ] Backend starts without errors
- [ ] `migrations` table shows correct count
- [ ] All expected tables exist
- [ ] Test data present (if seed ran)
- [ ] API health check passes
- [ ] Login works
- [ ] User can access dashboard
- [ ] Queues/DIDs display correctly
- [ ] No errors in backend logs
- [ ] No errors in MySQL logs

---

## 🔒 Security Considerations

### For External MySQL

1. **Use SSL/TLS**:
   ```env
   DB_SSL_MODE=required
   DB_SSL_CA=/path/to/ca-cert.pem
   ```

2. **Restrict Network Access**:
   - Firewall: Only allow app server IP
   - MySQL: Use specific user hostname, not `%`

3. **Use Strong Passwords**:
   - Min 16 characters
   - Include symbols, numbers, mixed case
   - Don't use default passwords

4. **Regular Backups**:
   ```bash
   # Daily backup cron
   0 2 * * * mysqldump -h external-host -u callcenter -p callcenter > /backups/callcenter_$(date +\%Y\%m\%d).sql
   ```

---

## 📝 Summary

### Fresh Install
✅ Just `docker compose up -d` - migrations run automatically

### Existing Install
✅ Run `./sync-migrations.sh` then restart backend

### MySQL Migration
✅ Backup → Create external DB → Import OR run migrations → Update .env → Restart

**All scenarios now work seamlessly!** 🎉

---

**Guide Version**: 2.0  
**Last Updated**: November 29, 2025  
**Tested**: ✅ Fresh install, ✅ Sync existing, ✅ External MySQL migration
