ARA/ARI verification and admin-panel best practices

This document provides quick verification steps to confirm ARA (Asterisk Realtime Architecture)
and ARI (Asterisk REST Interface) are working, plus recommended admin-panel features and data flows.

1) Verification checklist (runtime container)

- Confirm runtime generated ODBC ini is present:
  cat /tmp/odbc_internal.ini

- Confirm unixODBC driver and DSN:
  odbcinst -j
  odbcinst -q -s
  isql -v asterisk-connector <user> <pass>

- Start Asterisk CLI and verify modules & ODBC mapping:
  asterisk -rvvvvv
  asterisk -rx "odbc show"
  asterisk -rx "module show like res_config_odbc"
  asterisk -rx "module show like res_odbc"

- Reload realtime and PJSIP modules then check endpoints:
  asterisk -rx "module reload res_odbc"
  asterisk -rx "module reload res_config_odbc"
  asterisk -rx "module reload res_pjsip"
  asterisk -rx "pjsip show endpoints"

- If `pjsip show endpoints` returns "No objects found":
  - Ensure `res_config_odbc.conf` has `dsn=<resource-name>` where resource-name matches a section in `res_odbc.conf` (e.g. `[asterisk]`).
  - Ensure `res_odbc.conf`'s resource section uses `dsn => <odbc-dsn-name>` where the low-level DSN exists in /etc/odbc.ini or the generated ODBCINI file (e.g. `asterisk-connector`).
  - Enable `debug=yes` in `res_config_odbc.conf` and increase Asterisk console verbosity; reload modules and watch SQL queries.

2) Quick ARI check

- Ensure `http.conf` has enabled HTTP server and `ari.conf` has an enabled user with full permissions. Example `ari.conf` snippet:

  [asterisk]
  enabled = yes
  pretty = yes

  [asterisk_user]
  type = user
  read_only = no
  password = ari-password
  allowed_origins = *

- Validate ARI is reachable from the host: curl -u asterisk_user:ari-password http://<asterisk-host>:8088/ari/endpoints

3) Admin / User panel best-practices (short)

- Data model: keep user accounts and tenant info in the main app DB (already present in `users`, `tenants`, `agents`). Store SIP credentials and realtime mapping in `ps_*` tables so changes take effect in Asterisk immediately.

- Endpoint onboarding flow (recommended):
  1. Admin creates agent user in app -> inserts `users` and `agents` rows.
  2. When admin adds SIP credentials, the app inserts/updates `ps_auths`, `ps_aors`, and `ps_endpoints` using the same unique `id` (e.g. agent's id).
  3. After DB write, the app calls ARI or AMI to optionally reload modules or uses a simple `ASTERISK` CLI socket command to trigger `module reload res_config_odbc` (not required if sorcery/extconfig is set to pull at runtime; but safe during tests).
  4. Agent can register via SIP UA; the app watches `ps_contacts` for registration info (or queries ARI for active channels and registrations via `asterisk -rx 'pjsip show contacts'`.)

- Security and tenancy:
  - Use tenant_id to scope endpoints and admin actions.
  - When inserting `ps_*` rows, ensure IDs are unique and consistent (prefer UUIDs or deterministic ids e.g. `tenantid-agentname`).
  - Protect ARI by using strong, per-service credentials and restrict `allowed_origins`.

- Concurrency / race notes:
  - When multiple app instances write to the DB, use UPSERT (INSERT ... ON DUPLICATE KEY UPDATE) to avoid race conditions.
  - Consider batching DB writes for bulk imports to reduce the chance of transient errors when Asterisk queries tables.

- Common UI actions to implement quickly:
  - Create/Edit SIP endpoint (id, username, password, codecs, context).
  - List registrations (from ps_contacts) and active calls (via ARI channels API).
  - Force reload realtime (button that triggers `module reload res_config_odbc` via the Asterisk CLI socket or calls ARI to get a fresh view).
  - Manage ARI credentials for applications (create/remove API users).

4) Troubleshooting tips

- If `isql` can't connect but the DSN exists, verify `ODBCINI` points to the generated file (echo $ODBCINI). The entrypoint sets this to `/tmp/odbc_internal.ini`.
- If Asterisk logs show SQL errors, copy the SQL shown by `res_config_odbc` and run it manually against the DB to verify permissions.
- If `res_pjsip` declines to load, temporarily replace `pjsip.conf` with a minimal one containing at least one transport section to validate the module starts.

End of document
