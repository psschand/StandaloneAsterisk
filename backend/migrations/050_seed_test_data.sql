-- Seed data for testing ARI call functionality
-- This creates a test tenant, users, extensions, DIDs, and queues

-- Insert test tenant
INSERT INTO tenants (id, name, domain, plan, status, created_at, updated_at)
VALUES ('test-tenant-001', 'Test Company', 'test.callcenter.local', 'enterprise', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert test users (agents)
INSERT INTO users (username, email, password_hash, first_name, last_name, created_at, updated_at)
VALUES 
    ('agent100', 'agent100@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Agent', 'One', NOW(), NOW()),
    ('agent101', 'agent101@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Agent', 'Two', NOW(), NOW()),
    ('manager', 'manager@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manager', 'Test', NOW(), NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Note: Password hash is for 'password123' - bcrypt hash

-- Get the user IDs
SET @agent100_id = (SELECT id FROM users WHERE username = 'agent100');
SET @agent101_id = (SELECT id FROM users WHERE username = 'agent101');
SET @manager_id = (SELECT id FROM users WHERE username = 'manager');

-- Insert user roles
INSERT INTO user_roles (user_id, role, created_at)
VALUES 
    (@agent100_id, 'agent', NOW()),
    (@agent101_id, 'agent', NOW()),
    (@manager_id, 'manager', NOW())
ON DUPLICATE KEY UPDATE role=VALUES(role); 
    ('user-agent-100', 'agent', NOW()),
    ('user-agent-101', 'agent', NOW()),
    ('user-manager', 'manager', NOW())
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- Insert test DIDs
INSERT INTO dids (id, tenant_id, number, provider, country_code, routing_type, routing_destination, is_active, created_at, updated_at)
VALUES 
    ('did-twilio-001', 'test-tenant-001', '+19863334949', 'twilio', 'US', 'queue', 'sales', true, NOW(), NOW()),
    ('did-test-002', 'test-tenant-001', '+15551234567', 'twilio', 'US', 'user', 'user-agent-100', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE number=VALUES(number);

-- Insert test queue
INSERT INTO queues (id, tenant_id, name, strategy, max_wait_time, created_at, updated_at)
VALUES 
    ('queue-sales', 'test-tenant-001', 'sales', 'rrmemory', 300, NOW(), NOW()),
    ('queue-support', 'test-tenant-001', 'support', 'leastrecent', 300, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert queue members
INSERT INTO queue_members (id, queue_id, user_id, penalty, paused, created_at, updated_at)
VALUES 
    ('qm-001', 'queue-sales', 'user-agent-100', 0, false, NOW(), NOW()),
    ('qm-002', 'queue-sales', 'user-agent-101', 0, false, NOW(), NOW()),
    ('qm-003', 'queue-support', 'user-agent-100', 0, false, NOW(), NOW())
ON DUPLICATE KEY UPDATE penalty=VALUES(penalty);

-- Initialize agent states
INSERT INTO agent_states (id, tenant_id, user_id, state, state_duration, last_state_change, created_at, updated_at)
VALUES 
    ('as-100', 'test-tenant-001', 'user-agent-100', 'offline', 0, NOW(), NOW(), NOW()),
    ('as-101', 'test-tenant-001', 'user-agent-101', 'offline', 0, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE state=VALUES(state);

-- Insert test contacts
INSERT INTO contacts (id, tenant_id, name, phone, email, created_at, updated_at)
VALUES 
    ('contact-001', 'test-tenant-001', 'John Customer', '+15559876543', 'john@customer.com', NOW(), NOW()),
    ('contact-002', 'test-tenant-001', 'Jane Buyer', '+15558765432', 'jane@buyer.com', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert PJSIP endpoints for testing (ARA - Asterisk Real-time Architecture)
INSERT INTO ps_endpoints (id, transport, aors, auth, context, disallow, allow, direct_media, ice_support, force_rport, rewrite_contact, rtp_symmetric, dtmf_mode, callerid)
VALUES 
    ('100', 'transport-udp', '100', '100', 'internal', 'all', 'ulaw,alaw,g722', 'no', 'no', 'yes', 'yes', 'yes', 'rfc4733', '"Agent One" <100>'),
    ('101', 'transport-udp', '101', '101', 'internal', 'all', 'ulaw,alaw,g722', 'no', 'no', 'yes', 'yes', 'yes', 'rfc4733', '"Agent Two" <101>')
ON DUPLICATE KEY UPDATE callerid=VALUES(callerid);

-- Insert PJSIP AORs
INSERT INTO ps_aors (id, max_contacts, remove_existing, qualify_frequency, authenticate_qualify)
VALUES 
    ('100', 3, 'yes', 60, 'no'),
    ('101', 3, 'yes', 60, 'no')
ON DUPLICATE KEY UPDATE max_contacts=VALUES(max_contacts);

-- Insert PJSIP auth credentials
-- Password: changeme100 and changeme101 (matching existing Asterisk config)
INSERT INTO ps_auths (id, auth_type, password, username, realm)
VALUES 
    ('100', 'userpass', 'changeme100', '100', NULL),
    ('101', 'userpass', 'changeme101', '101', NULL)
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- Insert chat widget for testing
INSERT INTO chat_widgets (id, tenant_id, name, welcome_message, is_active, created_at, updated_at)
VALUES 
    ('widget-001', 'test-tenant-001', 'Website Chat', 'Welcome! How can we help you today?', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Display created data
SELECT 'Seed data created successfully!' as status;
SELECT '========================' as separator;
SELECT 'Test Credentials:' as info;
SELECT '  Email: agent100@test.com / agent101@test.com' as credentials;
SELECT '  Password: password123' as password;
SELECT '  SIP Extensions: 100 / 101' as extensions;
SELECT '  SIP Password: agent100pass / agent101pass' as sip_password;
SELECT '========================' as separator;
SELECT 'Test DIDs:' as info;
SELECT number, routing_type, routing_destination FROM dids WHERE tenant_id = 'test-tenant-001';
SELECT '========================' as separator;
SELECT 'Test Queues:' as info;
SELECT name, strategy FROM queues WHERE tenant_id = 'test-tenant-001';
