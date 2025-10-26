# Database Migrations

This directory contains SQL migration files for the Call Center application database schema.

## Migration Files

All migrations are numbered sequentially and should be executed in order:

### Core Tables (001-008)
- `001_create_tenants_table.sql` - Multi-tenancy support
- `002_create_users_table.sql` - User accounts
- `003_create_user_roles_table.sql` - User-tenant role mappings
- `004_create_dids_table.sql` - Phone numbers (DIDs)
- `005_create_queues_table.sql` - Call queues
- `006_create_queue_members_table.sql` - Queue agent assignments
- `007_create_cdrs_table.sql` - Call Detail Records
- `008_create_agent_states_table.sql` - Real-time agent states

### Contact & Ticket Tables (009-011)
- `009_create_contacts_table.sql` - Customer contacts
- `010_create_tickets_table.sql` - Helpdesk tickets
- `011_create_ticket_messages_table.sql` - Ticket messages/comments

### Chat Tables (012-016)
- `012_create_chat_widgets_table.sql` - Live chat widget configs
- `013_create_chat_sessions_table.sql` - Chat conversations
- `014_create_chat_messages_table.sql` - Chat messages
- `015_create_chat_agents_table.sql` - Chat agent availability
- `016_create_chat_transfers_table.sql` - Chat transfer history

### Communication Tables (017-020)
- `017_create_voicemail_messages_table.sql` - Voicemail storage
- `018_create_sms_messages_table.sql` - SMS messages
- `019_create_recordings_table.sql` - Call recordings
- `020_create_call_tags_table.sql` - Call tags/labels

### System Tables (021-022)
- `021_create_audit_logs_table.sql` - Audit trail
- `022_create_notifications_table.sql` - User notifications

### IVR Tables (023-024)
- `023_create_ivr_menus_table.sql` - IVR menu configurations
- `024_create_ivr_options_table.sql` - IVR menu options

### Survey Tables (025-026)
- `025_create_call_surveys_table.sql` - Survey definitions
- `026_create_survey_responses_table.sql` - Survey responses

### Configuration Tables (027-031)
- `027_create_schedules_table.sql` - Business hours/schedules
- `028_create_blacklist_table.sql` - Blocked numbers
- `029_create_speed_dials_table.sql` - Speed dial configs
- `030_create_webhooks_table.sql` - Webhook configurations
- `031_create_webhook_logs_table.sql` - Webhook delivery logs

## Running Migrations

### Using MySQL CLI
```bash
# Run all migrations
for file in migrations/*.sql; do
    mysql -u root -p callcenter_db < "$file"
done

# Run a specific migration
mysql -u root -p callcenter_db < migrations/001_create_tenants_table.sql
```

### Using Docker
```bash
# Copy migrations to container and execute
docker cp migrations/ mysql-container:/tmp/
docker exec -i mysql-container sh -c 'for f in /tmp/migrations/*.sql; do mysql -u root -p"$MYSQL_ROOT_PASSWORD" callcenter_db < "$f"; done'
```

### Using Go Migration Tool
The application can run migrations automatically on startup using the migration service in `internal/database/migrate.go`.

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
