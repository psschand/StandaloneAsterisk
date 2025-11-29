# Migration System - Quick Reference

## ✅ Status: COMPLETE AND PRODUCTION READY

### Key Numbers
- **Migration Files:** 56
- **Database Migrations:** 71 (includes 15 historical placeholders for IDs 21-35)
- **Database Tables:** 53 base tables + 1 view
- **All Checks:** ✅ PASSED

---

## Issues Fixed Today

### 1. Duplicate Migration ID 050 ✅
- **Fixed:** Renamed `050_seed_pjsip_only.sql` → `061_seed_pjsip_only.sql`

### 2. Missing Table Migrations ✅
- **Created:** Migrations 062-071 for 10 previously undocumented tables
- **Tables:** ai_training_data, ps_transports, websites, conversations, conversation_tags, quick_replies, handoff_rules, channel_integrations, ai_agent_config, migrations

### 3. Special Cases Documented ✅
- **cdr_asterisk:** It's a VIEW (not a table), maps to `cdrs` table
- **ps_* tables:** Created by Asterisk init script (except ps_transports which now has migration 063)

---

## Fresh Deployment Commands

```bash
# 1. Clone and enter directory
git clone <repo> && cd standalone-asterix

# 2. Configure environment
cp .env.example .env
vim .env  # Edit as needed

# 3. Deploy
docker compose up -d

# 4. Verify migrations ran
docker compose exec mysql mysql -u callcenter -pcallcenterpass callcenter \
  -e "SELECT COUNT(*) as total, MAX(id) as highest FROM migrations;"
# Expected: total=71, highest=71

# 5. Verify tables created
docker compose exec mysql mysql -u callcenter -pcallcenterpass callcenter \
  -e "SHOW TABLES;"
# Expected: 54 objects (53 tables + 1 view)
```

---

## Migration to External MySQL

```bash
# Option 1: Full dump/restore
docker compose exec mysql mysqldump -u callcenter -pcallcenterpass callcenter > backup.sql
mysql -h NEW_HOST -u USER -p DATABASE < backup.sql

# Option 2: Fresh migration (recommended)
# 1. Update .env with external MySQL credentials
MYSQL_HOST=external-host
MYSQL_PORT=3306
MYSQL_USER=username
MYSQL_PASSWORD=password
MYSQL_DATABASE=dbname

# 2. Start backend (auto-runs migrations)
docker compose up -d backend
```

---

## Validation Test

```bash
# Run comprehensive validation
/tmp/migration_final_test.sh

# Should output:
# ✅ ✅ ✅  ALL CHECKS PASSED  ✅ ✅ ✅
```

---

## Migration File Breakdown

| Range | Count | Purpose |
|-------|-------|---------|
| 001-020 | 20 files | Core tables (tenants, users, queues, CDRs, chat) |
| 021-035 | 0 files | Historical gap (placeholders in DB) |
| 036-060 | 25 files | Features (IVR, routing, knowledge base) |
| 061-071 | 11 files | Fixes + newly discovered tables |
| **Total** | **56 files** | **Complete database schema** |

---

## Important Notes

1. **Gap 21-35:** These are historical placeholders in the database. The actual migrations were renumbered to 038-046. This is normal and won't cause issues.

2. **cdr_asterisk VIEW:** This is a database view, not a table. It provides Asterisk-compatible CDR format by mapping to the `cdrs` table.

3. **Asterisk Init Tables:** Five ps_* tables (endpoints, auths, aors, contacts, queue_members) are created by `docker/mysql/init/01-asterisk-realtime.sql`. The exception is `ps_transports` which has migration 063.

4. **Idempotent Migrations:** All migrations use `CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE`, so they can be run multiple times safely.

5. **Auto-Run:** The Go backend automatically runs pending migrations on startup.

---

## Troubleshooting

**Problem:** Migration errors on fresh install  
**Solution:** Check `docker compose logs backend` for specific SQL errors

**Problem:** Tables already exist  
**Solution:** Normal - migrations use IF NOT EXISTS

**Problem:** Foreign key errors  
**Solution:** Ensure migrations run in order (they're numbered)

**Problem:** ps_* tables missing  
**Solution:** Check `docker/mysql/init/01-asterisk-realtime.sql` is enabled

---

## Next Steps

✅ System is ready for production deployment  
✅ Can deploy to new servers  
✅ Can migrate to external MySQL  
✅ All database objects are tracked  

No further action required on migration system.

---

**Last Validated:** 2025-11-29  
**Status:** Production Ready ✅
