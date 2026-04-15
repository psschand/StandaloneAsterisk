# Database Migrations

This directory contains SQL migration files for the Call Center application database schema.

## Migration Files

All migrations are numbered sequentially and executed in ascending order. The migration runner automatically skips already-applied migrations (tracked in the `migrations` table — see migration 071).

> **Note**: Migration numbers 001 and 021–035 are not present in this repository (gaps from project history). The runner handles gaps gracefully.

### Core Tables (002–008)
- `002_create_users_table.sql` — User accounts
- `003_create_user_roles_table.sql` — User-tenant role mappings
- `004_create_dids_table.sql` — Phone numbers (DIDs)
- `005_create_queues_table.sql` — Call queues
- `006_create_queue_members_table.sql` — Queue agent assignments
- `007_create_cdrs_table.sql` — Call Detail Records
- `008_create_agent_states_table.sql` — Real-time agent states

### Contact & Support Tables (009–011)
- `009_create_contacts_table.sql` — Customer contacts
- `010_create_tickets_table.sql` — Helpdesk tickets
- `011_create_ticket_messages_table.sql` — Ticket messages/comments

### Chat Tables (012–016)
- `012_create_chat_widgets_table.sql` — Live chat widget configs
- `013_create_chat_sessions_table.sql` — Chat conversations
- `014_create_chat_messages_table.sql` — Chat messages
- `015_create_chat_agents_table.sql` — Chat agent availability
- `016_create_chat_transfers_table.sql` — Chat transfer history

### Communication Tables (017–020)
- `017_create_voicemail_messages_table.sql` — Voicemail storage
- `018_create_sms_messages_table.sql` — SMS messages
- `019_create_recordings_table.sql` — Call recordings
- `020_create_ai_chat_tables.sql` — AI chat conversations and sessions

### Routing & Call Flow Tables (036–048)
- `036_create_outbound_routes.sql` — Outbound dial routing rules
- `037_create_call_tags_table.sql` — Call tags/labels
- `038_create_audit_logs_table.sql` — Audit trail
- `039_create_notifications_table.sql` — User notifications
- `040_create_ivr_menus_table.sql` — IVR menu configurations
- `041_create_ivr_options_table.sql` — IVR menu options
- `042_create_call_surveys_table.sql` — Call survey definitions
- `043_create_survey_responses_table.sql` — Survey responses
- `044_create_schedules_table.sql` — Business hours/schedules
- `045_create_blacklist_table.sql` — Blocked numbers
- `046_create_speed_dials_table.sql` — Speed dial configurations
- `047_create_webhooks_table.sql` — Webhook configurations
- `048_create_webhook_logs_table.sql` — Webhook delivery logs

### Omnichannel & Integrations (049–060)
- `049_add_multi_website_support.sql` — Multi-website tenant support
- `050_add_website_channels.sql` — Website channel configurations
- `051_alter_ivr_menus_add_fields.sql` — IVR menu field additions
- `052_alter_queues_add_missing_columns.sql` — Queue schema updates
- `053_alter_queues_add_metadata.sql` — Queue metadata columns
- `054_seed_test_data.sql` — Test/seed data for initial setup
- `055_create_ps_endpoint_id_ips_table.sql` — PJSIP endpoint IP allowlist (ARA)
- `056_add_team_name_to_chat_widgets.sql` — Chat widget team name field
- `057_create_knowledge_base_documents_table.sql` — Knowledge base documents
- `058_create_products_table.sql` — Product catalog
- `059_create_channel_connections_table.sql` — Channel connection configs
- `060_create_knowledge_base_articles_table.sql` — Knowledge base articles

### AI & Advanced Features (061–070)
- `061_seed_pjsip_only.sql` — PJSIP seed data (endpoints, auths, AORs, transports)
- `062_create_ai_training_data_table.sql` — AI training data storage
- `063_create_ps_transports_table.sql` — PJSIP transport configurations (ARA)
- `064_create_websites_table.sql` — Website definitions
- `065_create_conversations_table.sql` — Omnichannel conversation threads
- `066_create_conversation_tags_table.sql` — Conversation tags
- `067_create_quick_replies_table.sql` — Quick reply templates
- `068_create_handoff_rules_table.sql` — AI-to-human handoff rules
- `069_create_channel_integrations_table.sql` — Channel integration configs
- `070_create_ai_agent_config_table.sql` — AI agent configuration

### System & Security (071–075)
- `071_create_migrations_table.sql` — Migration tracking table (idempotent runner)
- `072_add_permissions_to_user_roles.sql` — Granular permissions for user roles
- `073_fix_pjsip_endpoint_acl.sql` — **Fix**: Clear PJSIP endpoint deny/permit ACLs (SIP registration fix)
- `074_fix_pjsip_tls_transport.sql` — **Fix**: Set self-signed TLS cert in ps_transports (interim TLS fix)
- `075_fix_pjsip_tls_letsencrypt.sql` — **Fix**: Replace with Let's Encrypt cert, set method=sslv23 (final TLS fix)

## Migration Runner — How It Works

### Source: `backend/internal/database/migrate.go`

The Go backend runs all pending migrations **automatically at startup**. There is no separate `migrate` CLI command — the API server (`cmd/api/main.go`) calls `RunMigrations()` before starting. 

### Filename Format

Migration files must be named: `NNN_description.sql` where `NNN` is a zero-padded integer (e.g. `073`). The runner extracts the numeric ID from the filename prefix to determine execution order and to record state. Files that do not match this pattern are skipped with a warning.

### Runner Behaviour (step by step)

1. **Bootstrap**: Creates the `migrations` tracking table if absent (idempotent `CREATE TABLE IF NOT EXISTS`)
2. **Load applied**: Reads `SELECT id FROM migrations` into a map
3. **Discover files**: Globs `./migrations/*.sql`, sorted by numeric ID
4. **Skip applied**: If a migration ID is already in the map → skip
5. **Execute in transaction**: Each SQL file is split on `;` and each statement executed via `db.Exec()`. Rolls back the whole file on any error
6. **Record success**: `INSERT INTO migrations (id, name)` inside the same transaction

Re-deploying the backend is **safe** — only new migrations run.

### `migrations` Tracking Table Schema

```sql
CREATE TABLE IF NOT EXISTS migrations (
  id         INT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Purpose |
|--------|---------|
| `id` | Numeric prefix from filename (e.g. `75` for `075_*`) |
| `name` | Filename without extension and without the `NNN_` prefix |
| `applied_at` | UTC timestamp when the migration ran |

### Rollback

**Rollbacks are not implemented.** There are no `*_down.sql` files. The `RollbackLastMigration()` function in `migrate.go` prints a warning and returns without making changes. Rollbacks must be done manually with `ALTER TABLE` / `UPDATE` statements.

### Current State (as of 2026-04-15)

| Metric | Value |
|--------|-------|
| Total migration files | 55 |
| Applied (in `migrations` table) | 55 (IDs 2–75, with gaps 21–35) |
| Pending | 0 |
| Last applied | 75 — `fix_pjsip_tls_letsencrypt` |

> Migrations 074 and 075 were originally applied manually (direct SQL via Docker exec) during an emergency TLS fix. They were subsequently registered in the `migrations` table (`INSERT IGNORE INTO migrations ...`) so the runner does not attempt to re-run them on next deploy.

---

## Running Migrations Manually

For emergency patches or debugging, use the Docker exec approach:

```bash
# Apply a single new migration
docker exec -i mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" callcenter \
  < backend/migrations/076_your_new_migration.sql

# Register it in the tracking table (so the auto-runner skips it)
docker exec mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" callcenter \
  -e "INSERT IGNORE INTO migrations (id, name) VALUES (76, 'your_new_migration')"
```

> **Important**: If you apply a migration manually, you MUST also insert a row into the `migrations` table. Otherwise the next backend restart will attempt to re-run it, which may fail or corrupt data.

### Check Applied Migrations

```bash
docker exec mysql mysql -uroot -pcallcenterpass callcenter \
  -e "SELECT id, name, applied_at FROM migrations ORDER BY id"

# Quick count
docker exec mysql mysql -uroot -pcallcenterpass callcenter \
  -e "SELECT COUNT(*) as applied, MAX(id) as last_id FROM migrations"
```

## Creating New Migrations

1. Pick the next sequential number: `ls backend/migrations/*.sql | sort | tail -1` → increment by 1
2. Create file: `NNN_short_description.sql` (lowercase, underscores)
3. Always use `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` where possible
4. Run manually via Docker exec to test, then register in `migrations` table
5. On next backend redeploy the runner will skip it (already tracked) — no double-run

**Never reuse or renumber an existing migration ID.** If a migration needs to be undone, create a new higher-numbered migration that reverses the change.

---

## ARA (Asterisk Realtime Architecture) Migrations

The following migrations are specifically related to PJSIP Realtime (ARA) tables. These are the tables Asterisk queries directly for endpoint/auth/transport configuration:

| Migration | Table | Purpose |
|-----------|-------|---------|
| `055_create_ps_endpoint_id_ips_table.sql` | `ps_endpoint_id_ips` | IP-based endpoint identification (Twilio trunk) |
| `061_seed_pjsip_only.sql` | `ps_endpoints`, `ps_auths`, `ps_aors` | Seed extension 1000, 1001, and twilio_trunk |
| `063_create_ps_transports_table.sql` | `ps_transports` | Transport config (UDP/TCP/TLS/WS) |
| `073_fix_pjsip_endpoint_acl.sql` | `ps_endpoints` | Clear deny/permit ACLs that blocked registration |
| `074_fix_pjsip_tls_transport.sql` | `ps_transports` | Set self-signed TLS cert (interim, superseded by 075) |
| `075_fix_pjsip_tls_letsencrypt.sql` | `ps_transports` | Set Let's Encrypt cert + `method=sslv23` (final state) |

> For full ARA table schemas and troubleshooting, see `SIP_REGISTRATION_FIX_GUIDE.md` §9.

---

## Schema Features

- **Multi-tenancy**: All tables include `tenant_id` for data isolation
- **Soft Deletes**: Achieved via foreign key `ON DELETE` actions
- **Indexes**: Optimized for common queries and foreign keys
- **JSON Fields**: Flexible configuration storage for settings, metadata
- **Timestamps**: `created_at` and `updated_at` tracking on all tables
- **Constraints**: Foreign keys maintain referential integrity

## Notes

- All tables use `InnoDB` engine for transaction support
- Character set: `utf8mb4` for full Unicode support (emojis, etc.)
- Timestamps are stored in UTC
- Auto-increment primary keys for all tables
- Composite unique indexes where needed (e.g., tenant_id + user_id)
