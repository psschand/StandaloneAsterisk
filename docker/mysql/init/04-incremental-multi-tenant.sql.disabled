-- Incremental Multi-tenant Enhancements
-- Adds missing columns and tables to complete the multi-tenant architecture

USE callcenter;

-- ============================================================================
-- UPDATE TENANTS TABLE - Add resource limits and features
-- ============================================================================
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS max_agents INT DEFAULT 10 AFTER status,
  ADD COLUMN IF NOT EXISTS max_dids INT DEFAULT 5 AFTER max_agents,
  ADD COLUMN IF NOT EXISTS max_concurrent_calls INT DEFAULT 10 AFTER max_dids,
  ADD COLUMN IF NOT EXISTS features JSON DEFAULT NULL COMMENT '{"webrtc":true,"sms":true,"recording":true}' AFTER max_concurrent_calls;

-- Update settings to JSON if it's longtext
ALTER TABLE tenants MODIFY COLUMN settings JSON DEFAULT NULL;

-- ============================================================================
-- UPDATE PHONE_NUMBERS TABLE - Add routing capabilities
-- ============================================================================
ALTER TABLE phone_numbers
  ADD COLUMN IF NOT EXISTS friendly_name VARCHAR(255) AFTER number,
  ADD COLUMN IF NOT EXISTS route_type ENUM('queue','endpoint','ivr','webhook','external','voicemail') DEFAULT 'queue' AFTER capabilities,
  ADD COLUMN IF NOT EXISTS route_target VARCHAR(255) NULL COMMENT 'Queue name, endpoint ID, webhook URL' AFTER route_type,
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT FALSE AFTER route_target,
  ADD COLUMN IF NOT EXISTS sms_webhook_url VARCHAR(512) NULL AFTER sms_enabled;

-- ============================================================================
-- UPDATE USERS TABLE - Add missing auth fields
-- ============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER password,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE AFTER phone,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL AFTER email_verified;

-- ============================================================================
-- CREATE USER_ROLES TABLE - Separate roles from users for multi-tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
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
-- CREATE CDR TABLE - Call Detail Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS cdr (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
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
  did_id VARCHAR(36) NULL,
  user_id VARCHAR(36) NULL COMMENT 'Agent who handled call',
  queue_name VARCHAR(128) NULL,
  queue_wait_time INT DEFAULT 0,
  metadata JSON DEFAULT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (did_id) REFERENCES phone_numbers(id) ON DELETE SET NULL,
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
-- UPDATE QUEUES TABLE - Add tenant_id if missing
-- ============================================================================
ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36) NOT NULL AFTER id,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS strategy ENUM('ringall','leastrecent','fewestcalls','random','rrmemory','rrordered','linear','wrandom') DEFAULT 'ringall' AFTER display_name,
  ADD COLUMN IF NOT EXISTS timeout INT DEFAULT 30 AFTER strategy,
  ADD COLUMN IF NOT EXISTS max_wait_time INT DEFAULT 300 AFTER timeout,
  ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_tenant (tenant_id);

-- Add foreign key if not exists (check first to avoid error)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'queues' 
  AND CONSTRAINT_NAME = 'queues_ibfk_1');

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE queues ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
  'SELECT "Foreign key already exists" as message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- CREATE CALL_RECORDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS call_recordings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
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
-- CREATE AGENT_STATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_states (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
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
-- CREATE WEBSOCKET_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS websocket_sessions (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
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
-- UPDATE SMS_MESSAGES TABLE - Enhance with tenant support
-- ============================================================================
-- Table already has: id, tenant_id, direction, from_number, to_number, message, status, provider_message_id, error_message, created_at
ALTER TABLE sms_messages
  ADD COLUMN IF NOT EXISTS did_id VARCHAR(36) NULL AFTER tenant_id,
  ADD COLUMN IF NOT EXISTS segments INT DEFAULT 1 AFTER message,
  ADD COLUMN IF NOT EXISTS cost DECIMAL(10,4) DEFAULT 0 AFTER segments,
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) NULL COMMENT 'Agent who sent/received' AFTER cost,
  ADD COLUMN IF NOT EXISTS provider VARCHAR(64) DEFAULT 'internal' AFTER user_id,
  ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT NULL AFTER provider_message_id,
  ADD INDEX IF NOT EXISTS idx_did (did_id),
  ADD INDEX IF NOT EXISTS idx_user (user_id);

-- Add foreign keys if not exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'sms_messages' 
  AND CONSTRAINT_NAME = 'sms_messages_ibfk_1');

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE sms_messages ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE',
  'SELECT "FK tenant_id already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'sms_messages' 
  AND CONSTRAINT_NAME = 'sms_messages_ibfk_2');

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE sms_messages ADD FOREIGN KEY (did_id) REFERENCES phone_numbers(id) ON DELETE SET NULL',
  'SELECT "FK did_id already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- UPDATE DEFAULT TENANT WITH FEATURES
-- ============================================================================
UPDATE tenants 
SET 
  max_agents = 100,
  max_dids = 50,
  max_concurrent_calls = 50,
  features = JSON_OBJECT(
    'webrtc', true,
    'sms', true,
    'recording', true,
    'queue', true,
    'ivr', true
  ),
  settings = JSON_OBJECT(
    'timezone', 'UTC',
    'language', 'en',
    'currency', 'USD'
  )
WHERE id = 'default-tenant-id';

-- ============================================================================
-- SEED ACME TENANT (Demo)
-- ============================================================================
INSERT INTO tenants (id, name, domain, status, max_agents, max_dids, max_concurrent_calls, features, settings)
VALUES (
  'acme',
  'Acme Corporation',
  'acme.example.com',
  'active',
  50,
  20,
  25,
  JSON_OBJECT(
    'webrtc', true,
    'sms', true,
    'recording', true,
    'queue', true,
    'ivr', true
  ),
  JSON_OBJECT(
    'timezone', 'America/New_York',
    'language', 'en',
    'currency', 'USD'
  )
)
ON DUPLICATE KEY UPDATE 
  features = VALUES(features),
  settings = VALUES(settings);

-- ============================================================================
-- MIGRATE EXISTING USER ROLES TO user_roles TABLE
-- ============================================================================
INSERT INTO user_roles (user_id, tenant_id, role, permissions)
SELECT 
  u.id,
  u.tenant_id,
  CASE 
    WHEN u.role = 'admin' THEN 'tenant_admin'
    WHEN u.role = 'agent' THEN 'agent'
    ELSE 'viewer'
  END,
  JSON_OBJECT('migrated', true)
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.tenant_id = u.tenant_id
);

-- ============================================================================
-- CREATE VIEWS FOR EASY QUERYING
-- ============================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_agents;
DROP VIEW IF EXISTS v_call_stats;

-- Agent overview view
CREATE VIEW v_agents AS
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
CREATE VIEW v_call_stats AS
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
SELECT 'Incremental multi-tenant schema applied successfully!' as status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'callcenter' 
AND TABLE_NAME IN ('tenants', 'users', 'user_roles', 'cdr', 'agent_states', 'websocket_sessions', 'call_recordings')
ORDER BY TABLE_NAME;
