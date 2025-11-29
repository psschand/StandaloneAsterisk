# 🔍 Database Schema Analysis - Migration vs Init Scripts vs Current DB

**Analysis Date**: November 29, 2025  
**Database**: callcenter (MySQL 8.0)

---

## 🚨 **CRITICAL FINDINGS**

### **Problem Discovered**

The database schema is **NOT fully synchronized** with migration files. Here's what happened:

1. **MySQL Init Scripts** ran on first container start (created 15 base tables)
2. **Backend Migrations** ran (applied 19 migrations, created additional tables)
3. **Duplicate/Overlapping Tables** exist in both init scripts AND migration files
4. **Some tables** came from init scripts that are NOT in migrations
5. **Migration 020 failed** due to SQL syntax error, stopping further migrations

---

## 📊 **Current Database State**

### Total Tables in Database: **52 tables**

```
agent_states             handoff_rules           ps_transports
ai_agent_config          ivr_menus               queue_members
ai_training_data         ivr_options             queues
audit_logs               knowledge_base          quick_replies
blacklist                knowledge_base_articles recordings
call_surveys             knowledge_base_documents schedules
call_tags                messages                sms_messages
cdr_asterisk             migrations              speed_dials
cdrs                     notifications           survey_responses
channel_connections      outbound_routes         tenants
channel_integrations     products                ticket_messages
chat_agents              ps_aors                 tickets
chat_messages            ps_auths                user_roles
chat_sessions            ps_contacts             users
chat_transfers           ps_endpoint_id_ips      voicemail_messages
chat_widgets             ps_endpoints            websites
contacts                 ps_transports
conversation_tags
conversations
dids
```

---

## 📁 **Source Analysis**

### **Tables from MySQL Init Scripts** (docker/mysql/init/)

**File**: `01-asterisk-realtime.sql` (6 tables)
```
✅ ps_endpoints       - Asterisk PJSIP endpoints
✅ ps_aors           - Address of Record
✅ ps_auths          - Authentication
✅ ps_contacts       - Contact registrations
✅ queue_members     - Queue member assignments (Asterisk realtime)
✅ (ps_transports - created but not in grep)
```

**File**: `03-multi-tenant-schema.sql` (10 tables)
```
✅ tenants           - Multi-tenant core
✅ users             - User accounts
✅ user_roles        - Role assignments
✅ dids              - Phone numbers
✅ sms_messages      - SMS storage
✅ cdr               - Call Detail Records (named 'cdr', NOT 'cdrs')
✅ queues            - Call queues
✅ call_recordings   - Recording metadata
✅ agent_states      - Agent status
✅ websocket_sessions - WebSocket connections
```

**File**: `04-incremental-multi-tenant.sql` (5 tables, duplicates)
```
⚠️  user_roles       - DUPLICATE (also in 03-multi-tenant-schema.sql)
⚠️  cdr              - DUPLICATE
⚠️  call_recordings  - DUPLICATE
⚠️  agent_states     - DUPLICATE
⚠️  websocket_sessions - DUPLICATE
```

**Total Unique Tables from Init Scripts**: **15 tables**

---

### **Tables from Backend Migrations** (backend/migrations/)

**Applied Migrations** (19 migrations, stopped at 020):

| ID | Migration | Table(s) Created |
|----|-----------|------------------|
| 001 | create_tenants_table | ⚠️ tenants (already exists from init) |
| 002 | create_users_table | ⚠️ users (already exists from init) |
| 003 | create_user_roles_table | ⚠️ user_roles (already exists from init) |
| 004 | create_dids_table | ⚠️ dids (already exists from init) |
| 005 | create_queues_table | ⚠️ queues (already exists from init) |
| 006 | create_queue_members_table | ⚠️ queue_members (already exists from init) |
| 007 | create_cdrs_table | ✅ cdrs (different from 'cdr' in init) |
| 008 | create_agent_states_table | ⚠️ agent_states (already exists from init) |
| 009 | create_contacts_table | ✅ contacts |
| 010 | create_tickets_table | ✅ tickets |
| 011 | create_ticket_messages_table | ✅ ticket_messages |
| 012 | create_chat_widgets_table | ✅ chat_widgets |
| 013 | create_chat_sessions_table | ✅ chat_sessions |
| 014 | create_chat_messages_table | ✅ chat_messages |
| 015 | create_chat_agents_table | ✅ chat_agents |
| 016 | create_chat_transfers_table | ✅ chat_transfers |
| 017 | create_voicemail_messages_table | ✅ voicemail_messages |
| 018 | create_sms_messages_table | ⚠️ sms_messages (already exists from init) |
| 019 | create_recordings_table | ✅ recordings (different from call_recordings) |
| **020** | **create_ai_chat_tables** | **❌ FAILED - SQL syntax error** |

**Tables Created by Applied Migrations**: **11 new tables** (8 duplicated init tables)

---

### **Unapplied Migrations** (25 migrations NOT run yet)

| ID | Migration File | Expected Table(s) |
|----|---------------|-------------------|
| 020 | create_ai_chat_tables.sql | conversations, messages, knowledge_base, handoff_rules, channel_integrations, ai_agent_config, conversation_tags, quick_replies |
| 020 | create_call_tags_table.sql | call_tags |
| 021 | create_audit_logs_table.sql | audit_logs |
| 022 | create_notifications_table.sql | notifications |
| 023 | create_ivr_menus_table.sql | ivr_menus |
| 024 | create_ivr_options_table.sql | ivr_options |
| 025 | create_call_surveys_table.sql | call_surveys |
| 026 | create_survey_responses_table.sql | survey_responses |
| 027 | create_schedules_table.sql | schedules |
| 028 | create_blacklist_table.sql | blacklist |
| 029 | create_speed_dials_table.sql | speed_dials |
| 030 | add_multi_website_support.sql | websites, ALTER tables |
| 030 | create_webhooks_table.sql | (webhooks - not in DB) |
| 031 | add_website_channels.sql | ALTER tables |
| 031 | create_webhook_logs_table.sql | (webhook_logs - not in DB) |
| 032 | alter_ivr_menus_add_fields.sql | ALTER ivr_menus |
| 033 | alter_queues_add_missing_columns.sql | ALTER queues |
| 034 | alter_queues_add_metadata.sql | ALTER queues |
| 050 | seed_pjsip_only.sql | INSERT data |
| 050 | seed_test_data.sql | INSERT data |
| 050 | seed_test_data_fixed.sql | INSERT data |
| 051 | create_ps_endpoint_id_ips_table.sql | ps_endpoint_id_ips |
| 052 | add_team_name_to_chat_widgets.sql | ALTER chat_widgets |
| 053 | create_knowledge_base_documents_table.sql | knowledge_base_documents |

**Note**: Some tables exist in DB (created elsewhere) even though migrations didn't run.

---

## 🔴 **Tables in Database BUT NOT in Migrations**

These tables exist in the current database but are NOT tracked by the migration system:

```
✅ ai_agent_config           - Created by migration 020 (failed, but partially executed?)
✅ ai_training_data          - Source unknown (likely migration 020)
✅ audit_logs                - Should be from migration 021 (NOT applied)
✅ blacklist                 - Should be from migration 028 (NOT applied)
✅ call_surveys              - Should be from migration 025 (NOT applied)
✅ call_tags                 - Should be from migration 020 alt (NOT applied)
✅ cdr_asterisk              - Source unknown (not in migrations or init)
✅ channel_connections       - Source unknown
✅ channel_integrations      - Should be from migration 020 (failed)
✅ conversation_tags         - Should be from migration 020 (failed)
✅ conversations             - Should be from migration 020 (failed)
✅ handoff_rules             - Should be from migration 020 (failed)
✅ ivr_menus                 - Should be from migration 023 (NOT applied)
✅ ivr_options               - Should be from migration 024 (NOT applied)
✅ knowledge_base            - Should be from migration 020 (failed)
✅ knowledge_base_articles   - Source unknown
✅ knowledge_base_documents  - Should be from migration 053 (NOT applied)
✅ messages                  - Should be from migration 020 (failed)
✅ notifications             - Should be from migration 022 (NOT applied)
✅ outbound_routes           - Should be from migration 015 alt (NOT applied)
✅ products                  - Source unknown (not in any migration)
✅ ps_endpoint_id_ips        - Should be from migration 051 (NOT applied)
✅ ps_transports             - From init script 01-asterisk-realtime.sql
✅ quick_replies             - Should be from migration 020 (failed)
✅ schedules                 - Should be from migration 027 (NOT applied)
✅ speed_dials               - Should be from migration 029 (NOT applied)
✅ survey_responses          - Should be from migration 026 (NOT applied)
✅ websites                  - Should be from migration 030 (NOT applied)
```

**Total**: **27 tables** exist but migrations didn't track them!

---

## 🔍 **Why This Happened**

### Root Cause Analysis

1. **MySQL Init Scripts Run First** (on fresh docker volume)
   - Created 15 base tables
   - Ran BEFORE backend started
   - No migration tracking

2. **Backend Migrations Attempted to Create Same Tables**
   - Migrations 001-008 have `CREATE TABLE IF NOT EXISTS`
   - Tables already existed from init scripts
   - Migrations recorded as "applied" but did nothing

3. **Migration 020 Failed Halfway Through**
   - File: `020_create_ai_chat_tables.sql`
   - Contains multiple CREATE TABLE statements
   - MySQL transaction cannot execute multiple DDL in one `db.Exec()`
   - **Partial Execution**: Some tables created before error
   - Migration marked as FAILED
   - Backend stopped running further migrations

4. **Tables Created Outside Migration System**
   - Some tables exist but no migration created them
   - Likely manual SQL execution or different init process
   - Examples: `products`, `cdr_asterisk`, `channel_connections`

---

## ⚠️ **Problems with Current State**

### 1. **Schema Drift**
- Different servers may have different schemas
- New deployments get 15 tables from init scripts
- Existing deployments don't get those tables from migrations

### 2. **Migration Tracking Broken**
- 19 migrations marked "applied" but many did nothing
- 25 migrations exist but never ran
- Database has 27 tables not tracked by migrations

### 3. **Duplicate Migration Files**
- Two files with ID 015 (create_chat_agents_table.sql + create_outbound_routes.sql)
- Two files with ID 020 (create_ai_chat_tables.sql + create_call_tags_table.sql)
- Two files with ID 030 (add_multi_website_support.sql + create_webhooks_table.sql)
- Two files with ID 031 (add_website_channels.sql + create_webhook_logs_table.sql)
- Three files with ID 050 (seed_pjsip_only.sql + seed_test_data.sql + seed_test_data_fixed.sql)

### 4. **Init vs Migration Overlap**
- 8 tables created by BOTH init scripts AND migrations
- `CREATE TABLE IF NOT EXISTS` masks the problem
- No way to know which source is "truth"

### 5. **Missing Tables in Migrations**
- `products` table exists but no migration file
- `cdr_asterisk` table exists but no migration file
- `channel_connections` table exists but no migration file
- `knowledge_base_articles` table exists but no migration file

---

## 🛠️ **Recommended Solutions**

### **Option 1: Consolidate Everything into Migrations** (RECOMMENDED)

**Goal**: Remove init scripts, make migrations the single source of truth

**Steps**:
1. **Rename/Disable Init Scripts**:
   ```bash
   mv docker/mysql/init/03-multi-tenant-schema.sql docker/mysql/init/03-multi-tenant-schema.sql.disabled
   mv docker/mysql/init/04-incremental-multi-tenant.sql docker/mysql/init/04-incremental-multi-tenant.sql.disabled
   ```

2. **Fix Duplicate Migration IDs**:
   - Rename migrations to have unique sequential IDs (001-053)
   - Example: `015_create_outbound_routes.sql` → `036_create_outbound_routes.sql`

3. **Fix Migration 020**:
   - Split into separate files (one table per migration)
   - OR fix SQL to execute multiple statements

4. **Create Missing Migrations**:
   - `products` table
   - `cdr_asterisk` table
   - `channel_connections` table
   - `knowledge_base_articles` table

5. **Fresh Database Reset** (dev/staging only):
   ```bash
   docker compose down -v
   docker compose up -d
   ```

6. **Production Migration Path**:
   - Run unapplied migrations manually
   - Update `migrations` table to reflect actual state

---

### **Option 2: Keep Init Scripts, Remove Duplicate Migrations**

**Goal**: Init scripts create base tables, migrations only for new features

**Steps**:
1. **Remove Migrations 001-008** (duplicate init tables)
2. **Keep Init Scripts** as-is
3. **Fix Migration 020** and continue from there
4. **Create Missing Migrations** for tables not in init or existing migrations

---

### **Option 3: Document Current State, Move Forward**

**Goal**: Accept current state, prevent future issues

**Steps**:
1. **Document** which tables came from where (this document)
2. **Fix Migration 020** to allow further migrations
3. **New Migrations** starting from 054 (after fixing duplicates)
4. **Warn** in deployment guide about schema inconsistency

---

## 📋 **Action Items**

### **Immediate (Critical)**

- [ ] **Fix Migration 020** - Split into multiple files or fix SQL
- [ ] **Fix Duplicate Migration IDs** - Renumber files (015, 020, 030, 031, 050)
- [ ] **Document Missing Tables** - Find where products, cdr_asterisk, etc. come from
- [ ] **Test Fresh Install** - Verify init scripts + migrations work together

### **Short Term**

- [ ] **Choose Strategy** - Option 1, 2, or 3 above
- [ ] **Update DEPLOYMENT_GUIDE.md** - Reflect actual migration behavior
- [ ] **Create Migration for Missing Tables** - products, cdr_asterisk, etc.
- [ ] **Test Upgrade Path** - Existing DB → new migrations

### **Long Term**

- [ ] **Remove Init Scripts** - Migrate everything to backend migrations
- [ ] **Add Migration Tests** - Verify schema matches models
- [ ] **Schema Versioning** - Track schema version separately from migration ID
- [ ] **Migration Rollback** - Implement down migrations

---

## 📊 **Migration File Issues**

### **Duplicate IDs Found**

| ID | Files | Issue |
|----|-------|-------|
| 015 | create_chat_agents_table.sql<br>create_outbound_routes.sql | Two files, same ID |
| 020 | create_ai_chat_tables.sql<br>create_call_tags_table.sql | Two files, same ID |
| 030 | add_multi_website_support.sql<br>create_webhooks_table.sql | Two files, same ID |
| 031 | add_website_channels.sql<br>create_webhook_logs_table.sql | Two files, same ID |
| 050 | seed_pjsip_only.sql<br>seed_test_data.sql<br>seed_test_data_fixed.sql | Three files, same ID |

**Impact**: Migration system will only load ONE file per ID (alphabetically first), others ignored!

---

## 🎯 **Proposed Migration Renumbering**

To fix duplicate IDs, renumber as follows:

```
Current                              → Proposed
001_create_tenants_table.sql         → 001_create_tenants_table.sql
002_create_users_table.sql           → 002_create_users_table.sql
003_create_user_roles_table.sql      → 003_create_user_roles_table.sql
004_create_dids_table.sql            → 004_create_dids_table.sql
005_create_queues_table.sql          → 005_create_queues_table.sql
006_create_queue_members_table.sql   → 006_create_queue_members_table.sql
007_create_cdrs_table.sql            → 007_create_cdrs_table.sql
008_create_agent_states_table.sql    → 008_create_agent_states_table.sql
009_create_contacts_table.sql        → 009_create_contacts_table.sql
010_create_tickets_table.sql         → 010_create_tickets_table.sql
011_create_ticket_messages_table.sql → 011_create_ticket_messages_table.sql
012_create_chat_widgets_table.sql    → 012_create_chat_widgets_table.sql
013_create_chat_sessions_table.sql   → 013_create_chat_sessions_table.sql
014_create_chat_messages_table.sql   → 014_create_chat_messages_table.sql
015_create_chat_agents_table.sql     → 015_create_chat_agents_table.sql
015_create_outbound_routes.sql       → 036_create_outbound_routes.sql ✏️
016_create_chat_transfers_table.sql  → 016_create_chat_transfers_table.sql
017_create_voicemail_messages_table.sql → 017_create_voicemail_messages_table.sql
018_create_sms_messages_table.sql    → 018_create_sms_messages_table.sql
019_create_recordings_table.sql      → 019_create_recordings_table.sql
020_create_ai_chat_tables.sql        → 020-027_split_into_separate_files ✏️
020_create_call_tags_table.sql       → 037_create_call_tags_table.sql ✏️
021_create_audit_logs_table.sql      → 028_create_audit_logs_table.sql ✏️
022_create_notifications_table.sql   → 029_create_notifications_table.sql ✏️
023_create_ivr_menus_table.sql       → 030_create_ivr_menus_table.sql ✏️
024_create_ivr_options_table.sql     → 031_create_ivr_options_table.sql ✏️
025_create_call_surveys_table.sql    → 032_create_call_surveys_table.sql ✏️
026_create_survey_responses_table.sql → 033_create_survey_responses_table.sql ✏️
027_create_schedules_table.sql       → 034_create_schedules_table.sql ✏️
028_create_blacklist_table.sql       → 035_create_blacklist_table.sql ✏️
029_create_speed_dials_table.sql     → 038_create_speed_dials_table.sql ✏️
030_add_multi_website_support.sql    → 039_add_multi_website_support.sql ✏️
030_create_webhooks_table.sql        → 040_create_webhooks_table.sql ✏️
031_add_website_channels.sql         → 041_add_website_channels.sql ✏️
031_create_webhook_logs_table.sql    → 042_create_webhook_logs_table.sql ✏️
032_alter_ivr_menus_add_fields.sql   → 043_alter_ivr_menus_add_fields.sql ✏️
033_alter_queues_add_missing_columns.sql → 044_alter_queues_add_missing_columns.sql ✏️
034_alter_queues_add_metadata.sql    → 045_alter_queues_add_metadata.sql ✏️
050_seed_pjsip_only.sql              → 050_seed_pjsip_only.sql
050_seed_test_data.sql               → (DELETE - use seed_test_data_fixed) ✏️
050_seed_test_data_fixed.sql         → 051_seed_test_data.sql ✏️
051_create_ps_endpoint_id_ips_table.sql → 052_create_ps_endpoint_id_ips_table.sql ✏️
052_add_team_name_to_chat_widgets.sql → 053_add_team_name_to_chat_widgets.sql ✏️
053_create_knowledge_base_documents_table.sql → 054_create_knowledge_base_documents_table.sql ✏️

NEW MIGRATIONS NEEDED:
→ 055_create_products_table.sql
→ 056_create_cdr_asterisk_table.sql
→ 057_create_channel_connections_table.sql
→ 058_create_knowledge_base_articles_table.sql
```

---

## 📝 **Conclusion**

The database schema is **functional but inconsistent**:

- ✅ **Works**: All tables exist, application runs
- ⚠️ **Problem**: Schema created from multiple sources (init + migrations + unknown)
- ❌ **Not Portable**: Fresh install may differ from current state
- ❌ **Not Maintainable**: Migration tracking incomplete

**Recommendation**: **Consolidate to migrations-only** (Option 1) for production deployment.

---

**Analysis Completed**: November 29, 2025  
**Next Step**: Choose consolidation strategy and implement fixes
