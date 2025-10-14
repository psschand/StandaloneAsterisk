-- Idempotent seed for Asterisk Realtime (ps_* tables)
-- This seed runs after the schema creation scripts

USE callcenter;

-- Sample endpoint/auth/aor for testing
INSERT INTO ps_auths (id, auth_type, password, username)
VALUES
  ('agent100-auth', 'userpass', 'agent100pass', 'agent100')
ON DUPLICATE KEY UPDATE
  password = VALUES(password), username = VALUES(username);

INSERT INTO ps_aors (id, max_contacts, contact)
VALUES
  ('agent100', 1, NULL)
ON DUPLICATE KEY UPDATE
  max_contacts = VALUES(max_contacts);

INSERT INTO ps_endpoints (id, transport, aors, auth, context, disallow, allow)
VALUES
  ('agent100', 'transport-udp', 'agent100', 'agent100-auth', 'from-internal', 'all', 'ulaw,alaw')
ON DUPLICATE KEY UPDATE
  transport = VALUES(transport), aors = VALUES(aors), auth = VALUES(auth), context = VALUES(context), disallow = VALUES(disallow), allow = VALUES(allow);

-- Optional: a simple contact row is added when the UA registers; leave blank here.

-- Small convenience tenant/user entries for the application tables
INSERT INTO tenants (id, name, domain, status, settings)
VALUES
  ('demo-tenant', 'Demo Tenant', 'demo.local', 'active', '{}')
ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);

INSERT INTO users (id, tenant_id, email, password, first_name, last_name, role, status)
VALUES
  ('demo-admin', 'demo-tenant', 'admin@demo.local', '$2a$10$XQN0Vh9.KQgKvVDQlJYmHeqfg7lVGqxOK8WdQfNKJYxPJTVQP3jmG', 'Demo', 'Admin', 'admin', 'active')
ON DUPLICATE KEY UPDATE email=VALUES(email), status=VALUES(status);

