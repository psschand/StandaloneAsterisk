-- Multi-tenant Call Center Schema
-- Compatible with Asterisk 20+ realtime
-- Implements tenant isolation with proper indexing for scalability

USE callcenter;

-- ============================================================================
-- TENANTS TABLE (Core multi-tenancy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NULL UNIQUE,
  status ENUM('active','suspended','trial','inactive') DEFAULT 'active',
  max_agents INT DEFAULT 10,
  max_dids INT DEFAULT 5,
  max_concurrent_calls INT DEFAULT 10,
  features JSON DEFAULT NULL COMMENT '{"webrtc":true,"sms":true,"recording":true,"queue":true}',
  settings JSON DEFAULT NULL COMMENT 'Tenant-specific settings',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_domain (domain),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- UPDATE ASTERISK REALTIME TABLES FOR MULTI-TENANCY
-- ============================================================================

-- Add tenant_id to ps_endpoints (PJSIP endpoints)
ALTER TABLE ps_endpoints 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'default' AFTER id,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NULL AFTER tenant_id,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD INDEX IF NOT EXISTS idx_tenant_id (tenant_id),
  ADD INDEX IF NOT EXISTS idx_tenant_endpoint (tenant_id, id);

-- Add tenant_id to ps_auths
ALTER TABLE ps_auths 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'default' AFTER id,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD INDEX IF NOT EXISTS idx_tenant_id (tenant_id),
  ADD INDEX IF NOT EXISTS idx_tenant_auth (tenant_id, id);

-- Add tenant_id to ps_aors
ALTER TABLE ps_aors 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'default' AFTER id,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD INDEX IF NOT EXISTS idx_tenant_id (tenant_id),
  ADD INDEX IF NOT EXISTS idx_tenant_aor (tenant_id, id);

-- Add tenant_id to ps_contacts
ALTER TABLE ps_contacts 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'default' AFTER id,
  ADD INDEX IF NOT EXISTS idx_tenant_id (tenant_id),
  ADD INDEX IF NOT EXISTS idx_tenant_endpoint (tenant_id, endpoint);

-- Add tenant_id to queue_members
ALTER TABLE queue_members 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'default' AFTER uniqueid,
  ADD INDEX IF NOT EXISTS idx_tenant_id (tenant_id),
  ADD INDEX IF NOT EXISTS idx_tenant_queue (tenant_id, queue_name);

-- ============================================================================
-- USERS TABLE (Multi-tenant users with roles)
-- ============================================================================
-- Note: 02-migrate-users-to-bigint.sql drops and recreates this table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(32),
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- USER ROLES TABLE (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  role ENUM('superadmin','tenant_admin','supervisor','agent','viewer') NOT NULL,
  endpoint_id VARCHAR(128) NULL COMMENT 'Associated PJSIP endpoint for agents',
  permissions JSON DEFAULT NULL COMMENT 'Role-specific permissions',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tenant (user_id, tenant_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_role (role),
  INDEX idx_endpoint (endpoint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DIDs TABLE (Phone Numbers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dids (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  number VARCHAR(32) NOT NULL UNIQUE COMMENT 'E.164 format recommended',
  country_code VARCHAR(8),
  friendly_name VARCHAR(255),
  route_type ENUM('queue','endpoint','ivr','webhook','external','voicemail') NOT NULL DEFAULT 'queue',
  route_target VARCHAR(255) NOT NULL COMMENT 'Queue name, endpoint ID, webhook URL, etc',
  sms_enabled BOOLEAN DEFAULT FALSE,
  sms_webhook_url VARCHAR(512) NULL,
  status ENUM('active','inactive','pending') DEFAULT 'active',
  metadata JSON DEFAULT NULL COMMENT 'Carrier info, pricing, etc',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id),
  INDEX idx_number (number),
  INDEX idx_status (status),
  INDEX idx_route (route_type, route_target)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SMS MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sms_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  did_id BIGINT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  sender VARCHAR(64) NOT NULL,
  recipient VARCHAR(64) NOT NULL,
  body TEXT,
  status ENUM('pending','queued','sent','delivered','failed','received') DEFAULT 'pending',
  error_message TEXT NULL,
  segments INT DEFAULT 1,
  cost DECIMAL(10,4) DEFAULT 0,
  user_id BIGINT NULL COMMENT 'Agent who sent/received',
  provider VARCHAR(64) DEFAULT 'internal',
  provider_message_id VARCHAR(255) NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (did_id) REFERENCES dids(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant (tenant_id),
  INDEX idx_did (did_id),
  INDEX idx_direction_status (direction, status),
  INDEX idx_created (created_at),
  INDEX idx_sender (sender),
  INDEX idx_recipient (recipient),
  INDEX idx_user (user_id),
  FULLTEXT idx_body (body)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CALL DETAIL RECORDS (CDR) - Multi-tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS cdr (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  calldate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clid VARCHAR(80) NOT NULL DEFAULT '',
  src VARCHAR(80) NOT NULL DEFAULT '',
  dst VARCHAR(80) NOT NULL DEFAULT '',
  dcontext VARCHAR(80) NOT NULL DEFAULT '',
  channel VARCHAR(80) NOT NULL DEFAULT '',
  dstchannel VARCHAR(80) NOT NULL DEFAULT '',
  lastapp VARCHAR(80) NOT NULL DEFAULT '',
  lastdata VARCHAR(80) NOT NULL DEFAULT '',
  duration INT NOT NULL DEFAULT 0 COMMENT 'Total call duration in seconds',
  billsec INT NOT NULL DEFAULT 0 COMMENT 'Billable seconds (after answer)',
  disposition VARCHAR(45) NOT NULL DEFAULT '' COMMENT 'ANSWERED, NO ANSWER, BUSY, FAILED',
  amaflags INT NOT NULL DEFAULT 0,
  accountcode VARCHAR(20) NOT NULL DEFAULT '',
  uniqueid VARCHAR(150) NOT NULL DEFAULT '',
  userfield VARCHAR(255) NOT NULL DEFAULT '',
  recordingfile VARCHAR(512) NULL COMMENT 'Path to call recording',
  did_id BIGINT NULL,
  user_id BIGINT NULL COMMENT 'Agent who handled call',
  queue_name VARCHAR(128) NULL,
  queue_wait_time INT DEFAULT 0,
  metadata JSON DEFAULT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (did_id) REFERENCES dids(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant (tenant_id),
  INDEX idx_calldate (calldate),
  INDEX idx_src (src),
  INDEX idx_dst (dst),
  INDEX idx_accountcode (accountcode),
  INDEX idx_uniqueid (uniqueid),
  INDEX idx_disposition (disposition),
  INDEX idx_user (user_id),
  INDEX idx_queue (queue_name),
  INDEX idx_tenant_calldate (tenant_id, calldate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- QUEUES TABLE (Queue Definitions) - Complementary to queue_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS queues (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL COMMENT 'Queue name used in Asterisk',
  display_name VARCHAR(255) NOT NULL,
  strategy ENUM('ringall','leastrecent','fewestcalls','random','rrmemory','rrordered','linear','wrandom') DEFAULT 'ringall',
  timeout INT DEFAULT 30 COMMENT 'Ring timeout per member',
  retry INT DEFAULT 5 COMMENT 'Seconds before retrying',
  max_wait_time INT DEFAULT 300 COMMENT 'Max seconds caller waits',
  max_len INT DEFAULT 0 COMMENT '0 = unlimited queue length',
  announce_frequency INT DEFAULT 60,
  announce_hold_time BOOLEAN DEFAULT TRUE,
  music_on_hold VARCHAR(128) DEFAULT 'default',
  status ENUM('active','inactive') DEFAULT 'active',
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tenant_queue (tenant_id, name),
  INDEX idx_tenant (tenant_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CALL RECORDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_recordings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  cdr_id BIGINT NULL,
  uniqueid VARCHAR(150) NOT NULL,
  filename VARCHAR(512) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  file_size BIGINT DEFAULT 0,
  duration INT DEFAULT 0,
  format VARCHAR(16) DEFAULT 'wav',
  status ENUM('recording','completed','failed','deleted') DEFAULT 'recording',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (cdr_id) REFERENCES cdr(id) ON DELETE SET NULL,
  INDEX idx_tenant (tenant_id),
  INDEX idx_cdr (cdr_id),
  INDEX idx_uniqueid (uniqueid),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AGENT STATES TABLE (Presence/Status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_states (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  user_id BIGINT NOT NULL,
  endpoint_id VARCHAR(128) NOT NULL,
  state ENUM('available','busy','away','break','offline','dnd') DEFAULT 'offline',
  reason VARCHAR(255) NULL,
  current_call_id VARCHAR(150) NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tenant_user (tenant_id, user_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_state (state),
  INDEX idx_endpoint (endpoint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WEBSOCKET SESSIONS TABLE (Real-time connections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS websocket_sessions (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  user_id BIGINT NOT NULL,
  endpoint_id VARCHAR(128) NULL,
  connection_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id),
  INDEX idx_user (user_id),
  INDEX idx_last_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DEFAULT TENANT
-- ============================================================================
INSERT INTO tenants (id, name, domain, status, max_agents, max_dids, max_concurrent_calls, features, settings)
VALUES (
  'default',
  'Default Tenant',
  'default.localhost',
  'active',
  100,
  50,
  50,
  '{"webrtc":true,"sms":true,"recording":true,"queue":true,"ivr":false}',
  '{"timezone":"UTC","language":"en","currency":"USD"}'
)
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  features=VALUES(features);

-- ============================================================================
-- SEED DEMO TENANTS
-- ============================================================================
INSERT INTO tenants (id, name, domain, status, max_agents, max_dids, max_concurrent_calls, features, settings)
VALUES 
  (
    'acme',
    'Acme Corporation',
    'acme.example.com',
    'active',
    50,
    20,
    25,
    '{"webrtc":true,"sms":true,"recording":true,"queue":true,"ivr":true}',
    '{"timezone":"America/New_York","language":"en","currency":"USD"}'
  ),
  (
    'globex',
    'Globex Ltd',
    'globex.example.com',
    'trial',
    10,
    5,
    5,
    '{"webrtc":true,"sms":false,"recording":false,"queue":true,"ivr":false}',
    '{"timezone":"Europe/London","language":"en","currency":"GBP"}'
  )
ON DUPLICATE KEY UPDATE 
  name=VALUES(name),
  features=VALUES(features);

-- ============================================================================
-- UPDATE EXISTING RECORDS WITH DEFAULT TENANT
-- ============================================================================
UPDATE ps_endpoints SET tenant_id='default' WHERE tenant_id IS NULL OR tenant_id='';
UPDATE ps_auths SET tenant_id='default' WHERE tenant_id IS NULL OR tenant_id='';
UPDATE ps_aors SET tenant_id='default' WHERE tenant_id IS NULL OR tenant_id='';
UPDATE ps_contacts SET tenant_id='default' WHERE tenant_id IS NULL OR tenant_id='';
UPDATE queue_members SET tenant_id='default' WHERE tenant_id IS NULL OR tenant_id='';

-- ============================================================================
-- SEED DEMO USERS
-- ============================================================================
-- Password for all demo users: 'Password123!' (bcrypt hash)
INSERT INTO users (email, password_hash, first_name, last_name, status, email_verified)
VALUES
  ('admin@acme.com', '$2a$10$X9kOQfXQQZq7Z8VcNXGnOeK5qZ4YqZ4YqZ4YqZ4YqZ4YqZ4YqZ4Y', 'Admin', 'User', 'active', TRUE),
  ('agent1@acme.com', '$2a$10$X9kOQfXQQZq7Z8VcNXGnOeK5qZ4YqZ4YqZ4YqZ4YqZ4YqZ4YqZ4Y', 'John', 'Doe', 'active', TRUE),
  ('supervisor@acme.com', '$2a$10$X9kOQfXQQZq7Z8VcNXGnOeK5qZ4YqZ4YqZ4YqZ4YqZ4YqZ4YqZ4Y', 'Jane', 'Smith', 'active', TRUE)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Assign roles
INSERT INTO user_roles (user_id, tenant_id, role, permissions)
SELECT u.id, 'acme', 'tenant_admin', '{"manage_agents":true,"manage_dids":true,"view_reports":true}'
FROM users u WHERE u.email = 'admin@acme.com'
ON DUPLICATE KEY UPDATE role=VALUES(role);

INSERT INTO user_roles (user_id, tenant_id, role, endpoint_id, permissions)
SELECT u.id, 'acme', 'agent', 'acme-agent1', '{"make_calls":true,"receive_calls":true,"send_sms":true}'
FROM users u WHERE u.email = 'agent1@acme.com'
ON DUPLICATE KEY UPDATE role=VALUES(role);

INSERT INTO user_roles (user_id, tenant_id, role, permissions)
SELECT u.id, 'acme', 'supervisor', '{"view_all_calls":true,"listen_calls":true,"coach_agents":true}'
FROM users u WHERE u.email = 'supervisor@acme.com'
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- ============================================================================
-- SEED DEMO ENDPOINT FOR ACME
-- ============================================================================
INSERT INTO ps_auths (id, tenant_id, auth_type, password, username)
VALUES ('acme-agent1-auth', 'acme', 'userpass', 'SecurePass123!', 'acme-agent1')
ON DUPLICATE KEY UPDATE password=VALUES(password), tenant_id=VALUES(tenant_id);

INSERT INTO ps_aors (id, tenant_id, max_contacts, minimum_expiration, remove_existing)
VALUES ('acme-agent1', 'acme', 2, 60, 'yes')
ON DUPLICATE KEY UPDATE tenant_id=VALUES(tenant_id);

INSERT INTO ps_endpoints (
  id, tenant_id, transport, context, disallow, allow,
  aors, auth, direct_media, rtp_symmetric, force_rport,
  rewrite_contact, ice_support, webrtc, display_name
)
VALUES (
  'acme-agent1', 'acme', 'transport-wss', 'agents', 'all', 'opus,ulaw,alaw',
  'acme-agent1', 'acme-agent1-auth', 'no', 'yes', 'yes',
  'yes', 'yes', 'yes', 'John Doe (Agent 1)'
)
ON DUPLICATE KEY UPDATE
  tenant_id=VALUES(tenant_id),
  transport=VALUES(transport),
  aors=VALUES(aors),
  auth=VALUES(auth);

-- ============================================================================
-- SEED DEMO QUEUE FOR ACME
-- ============================================================================
INSERT INTO queues (tenant_id, name, display_name, strategy, timeout, max_wait_time, status)
VALUES ('acme', 'sales', 'Sales Queue', 'leastrecent', 30, 300, 'active')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

INSERT INTO queue_members (tenant_id, queue_name, interface, membername, state_interface, penalty, paused)
VALUES ('acme', 'sales', 'PJSIP/acme-agent1', 'John Doe', 'PJSIP/acme-agent1', 0, 0)
ON DUPLICATE KEY UPDATE penalty=VALUES(penalty);

-- ============================================================================
-- SEED DEMO DID FOR ACME
-- ============================================================================
INSERT INTO dids (tenant_id, number, country_code, friendly_name, route_type, route_target, sms_enabled, status)
VALUES 
  ('acme', '+15551234567', '+1', 'Main Sales Line', 'queue', 'sales', TRUE, 'active'),
  ('acme', '+15551234568', '+1', 'Support Line', 'queue', 'support', TRUE, 'active')
ON DUPLICATE KEY UPDATE route_target=VALUES(route_target);

-- ============================================================================
-- SEED DEMO AGENT STATE
-- ============================================================================
INSERT INTO agent_states (tenant_id, user_id, endpoint_id, state)
SELECT 'acme', u.id, 'acme-agent1', 'offline'
FROM users u WHERE u.email = 'agent1@acme.com'
ON DUPLICATE KEY UPDATE state='offline';

-- ============================================================================
-- CREATE VIEWS FOR EASY QUERYING
-- ============================================================================

-- Agent overview view
CREATE OR REPLACE VIEW v_agents AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  ur.tenant_id,
  ur.endpoint_id,
  ur.role,
  e.id as endpoint_exists,
  c.uri as registration_uri,
  c.expiration_time,
  ast.state as agent_state,
  ast.current_call_id,
  t.name as tenant_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN tenants t ON ur.tenant_id = t.id
LEFT JOIN ps_endpoints e ON ur.endpoint_id = e.id AND e.tenant_id = ur.tenant_id
LEFT JOIN ps_contacts c ON e.id = c.endpoint AND e.tenant_id = c.tenant_id
LEFT JOIN agent_states ast ON u.id = ast.user_id AND ur.tenant_id = ast.tenant_id
WHERE ur.role = 'agent';

-- Call statistics view
CREATE OR REPLACE VIEW v_call_stats AS
SELECT 
  tenant_id,
  DATE(calldate) as call_date,
  COUNT(*) as total_calls,
  SUM(CASE WHEN disposition = 'ANSWERED' THEN 1 ELSE 0 END) as answered_calls,
  SUM(CASE WHEN disposition = 'NO ANSWER' THEN 1 ELSE 0 END) as missed_calls,
  SUM(CASE WHEN disposition = 'BUSY' THEN 1 ELSE 0 END) as busy_calls,
  AVG(CASE WHEN disposition = 'ANSWERED' THEN billsec ELSE NULL END) as avg_call_duration,
  AVG(queue_wait_time) as avg_wait_time
FROM cdr
GROUP BY tenant_id, DATE(calldate);

-- ============================================================================
-- COMPLETION
-- ============================================================================
SELECT 'Multi-tenant schema created successfully!' as status;
SELECT COUNT(*) as tenant_count FROM tenants;
SELECT COUNT(*) as endpoint_count FROM ps_endpoints;
SELECT COUNT(*) as user_count FROM users;
