-- Seed data for testing ARI call functionality
-- This creates test users, extensions (PJSIP), DIDs, and queues
-- Matches actual database schema

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

-- Get the user IDs for roles
SET @agent100_id = (SELECT id FROM users WHERE username = 'agent100');
SET @agent101_id = (SELECT id FROM users WHERE username = 'agent101');
SET @manager_id = (SELECT id FROM users WHERE username = 'manager');

-- Insert user roles
INSERT INTO user_roles (user_id, tenant_id, role, extension, created_at)
VALUES 
    (@agent100_id, 'test-tenant-001', 'agent', '100', NOW()),
    (@agent101_id, 'test-tenant-001', 'agent', '101', NOW()),
    (@manager_id, 'test-tenant-001', 'manager', NULL, NOW())
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- Insert PJSIP endpoints for extensions 100 and 101 (ARA - Asterisk Real-time Architecture)
INSERT INTO ps_endpoints (id, transport, aors, auth, context, disallow, allow, direct_media, ice_support, force_rport, rewrite_contact, rtp_symmetric, dtmf_mode, callerid)
VALUES 
    ('100', 'transport-udp', '100', '100', 'internal', 'all', 'ulaw,alaw,g722', 'no', 'no', 'yes', 'yes', 'yes', 'rfc4733', '"Agent 100" <100>'),
    ('101', 'transport-udp', '101', '101', 'internal', 'all', 'ulaw,alaw,g722', 'no', 'no', 'yes', 'yes', 'yes', 'rfc4733', '"Agent 101" <101>')
ON DUPLICATE KEY UPDATE callerid=VALUES(callerid);

-- Insert PJSIP AORs (Address of Record)
INSERT INTO ps_aors (id, max_contacts, remove_existing, qualify_frequency, authenticate_qualify)
VALUES 
    ('100', 2, 'yes', 60, 'no'),
    ('101', 2, 'yes', 60, 'no')
ON DUPLICATE KEY UPDATE max_contacts=VALUES(max_contacts);

-- Insert PJSIP authentication (matching existing Asterisk config passwords)
INSERT INTO ps_auths (id, auth_type, password, username)
VALUES 
    ('100', 'userpass', 'changeme100', '100'),
    ('101', 'userpass', 'changeme101', '101')
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- Insert test DIDs
INSERT INTO dids (number, tenant_id, friendly_name, country_code, status, route_type, route_extension, created_at, updated_at)
VALUES 
    ('+19863334949', 'test-tenant-001', 'Twilio Main Number', 'US', 'active', 'extension', '100', NOW(), NOW()),
    ('+15551234567', 'test-tenant-001', 'Test Number', 'US', 'active', 'extension', '101', NOW(), NOW())
ON DUPLICATE KEY UPDATE number=VALUES(number);

-- Insert test queues
INSERT INTO queues (name, tenant_id, strategy, timeout, max_callers, created_at, updated_at)
VALUES 
    ('sales', 'test-tenant-001', 'ringall', 300, 100, NOW(), NOW()),
    ('support', 'test-tenant-001', 'leastrecent', 300, 100, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Get queue IDs for queue members
SET @sales_queue_id = (SELECT id FROM queues WHERE name = 'sales' AND tenant_id = 'test-tenant-001');
SET @support_queue_id = (SELECT id FROM queues WHERE name = 'support' AND tenant_id = 'test-tenant-001');

-- Insert queue members
INSERT INTO queue_members (queue_id, user_id, interface, penalty, paused, created_at, updated_at)
VALUES 
    (@sales_queue_id, @agent100_id, 'PJSIP/100', 0, 0, NOW(), NOW()),
    (@sales_queue_id, @agent101_id, 'PJSIP/101', 0, 0, NOW(), NOW()),
    (@support_queue_id, @agent100_id, 'PJSIP/100', 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE penalty=VALUES(penalty);

-- Initialize agent states
INSERT INTO agent_states (user_id, tenant_id, state, state_duration, last_state_change, created_at, updated_at)
VALUES 
    (@agent100_id, 'test-tenant-001', 'offline', 0, NOW(), NOW(), NOW()),
    (@agent101_id, 'test-tenant-001', 'offline', 0, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE state=VALUES(state);

-- Insert test contacts
INSERT INTO contacts (tenant_id, first_name, last_name, phone, email, created_at, updated_at)
VALUES 
    ('test-tenant-001', 'John', 'Customer', '+15559876543', 'john@customer.com', NOW(), NOW()),
    ('test-tenant-001', 'Jane', 'Buyer', '+15558765432', 'jane@buyer.com', NOW(), NOW())
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Insert chat widget configuration
INSERT INTO chat_widgets (tenant_id, name, color, position, welcome_message, is_active, created_at, updated_at)
VALUES 
    ('test-tenant-001', 'Main Website Chat', '#0066cc', 'bottom-right', 'Hello! How can we help you today?', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);
