-- Migration 031: Add Website-Specific Channel Configurations
-- Each website can have multiple communication channels (web widget, WhatsApp, Facebook, etc.)

-- Step 1: Create channel_connections table for social media integrations
CREATE TABLE IF NOT EXISTS channel_connections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(64) NOT NULL,
    website_id BIGINT NOT NULL COMMENT 'Which website/business this channel belongs to',
    channel_type ENUM('web', 'whatsapp', 'facebook', 'instagram', 'telegram', 'twitter', 'sms', 'email') NOT NULL,
    channel_name VARCHAR(100) NOT NULL COMMENT 'Friendly name: "Main Website Chat", "Support WhatsApp"',
    
    -- Connection credentials (encrypted in production)
    credentials JSON COMMENT 'Channel-specific connection details',
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    auto_respond BOOLEAN DEFAULT FALSE COMMENT 'Enable AI auto-response',
    business_hours_only BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_connected_at TIMESTAMP NULL,
    connection_status ENUM('active', 'disconnected', 'error', 'pending') DEFAULT 'pending',
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    INDEX idx_tenant_website (tenant_id, website_id),
    INDEX idx_channel_type (channel_type),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_website_channel (website_id, channel_type, channel_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Update chat_sessions to track channel source
ALTER TABLE chat_sessions 
ADD COLUMN channel_connection_id BIGINT DEFAULT NULL COMMENT 'Which channel this conversation came from',
ADD COLUMN website_id BIGINT DEFAULT NULL COMMENT 'Which website this conversation belongs to',
ADD COLUMN channel_type VARCHAR(50) DEFAULT 'web' COMMENT 'web, whatsapp, facebook, etc.',
ADD COLUMN channel_user_id VARCHAR(255) DEFAULT NULL COMMENT 'User ID from channel (WhatsApp number, FB ID, etc.)',
ADD COLUMN channel_username VARCHAR(255) DEFAULT NULL COMMENT 'Display name from channel',
ADD FOREIGN KEY (channel_connection_id) REFERENCES channel_connections(id) ON DELETE SET NULL,
ADD FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE SET NULL,
ADD INDEX idx_channel_connection (channel_connection_id),
ADD INDEX idx_website (website_id),
ADD INDEX idx_channel_type (channel_type);

-- Step 3: Update chat_messages to include channel context
ALTER TABLE chat_messages
ADD COLUMN channel_message_id VARCHAR(255) DEFAULT NULL COMMENT 'Original message ID from channel',
ADD COLUMN channel_metadata JSON COMMENT 'Channel-specific data (attachments, reactions, etc.)';

-- Step 4: Create web chat widget as a channel_connection (migrate existing widgets)
INSERT INTO channel_connections (tenant_id, website_id, channel_type, channel_name, is_active, credentials, connection_status)
SELECT 
    cw.tenant_id,
    cw.website_id,
    'web' as channel_type,
    CONCAT(w.name, ' - Web Chat') as channel_name,
    cw.enabled as is_active,
    JSON_OBJECT(
        'widget_id', cw.id,
        'widget_key', cw.widget_key,
        'primary_color', cw.primary_color,
        'position', cw.position
    ) as credentials,
    'active' as connection_status
FROM chat_widgets cw
JOIN websites w ON w.id = cw.website_id
WHERE cw.website_id IS NOT NULL;

-- Step 5: Create sample social media connections for demo
INSERT INTO channel_connections (tenant_id, website_id, channel_type, channel_name, is_active, credentials, connection_status, auto_respond)
SELECT 
    w.tenant_id,
    w.id as website_id,
    'whatsapp' as channel_type,
    CONCAT(w.name, ' - WhatsApp') as channel_name,
    FALSE as is_active,
    JSON_OBJECT(
        'phone_number_id', '',
        'access_token', '',
        'business_account_id', '',
        'webhook_verify_token', CONCAT('whatsapp_', w.id, '_verify')
    ) as credentials,
    'disconnected' as connection_status,
    TRUE as auto_respond
FROM websites w
WHERE w.tenant_id = 'demo-tenant'
LIMIT 2;

INSERT INTO channel_connections (tenant_id, website_id, channel_type, channel_name, is_active, credentials, connection_status, auto_respond)
SELECT 
    w.tenant_id,
    w.id as website_id,
    'facebook' as channel_type,
    CONCAT(w.name, ' - Facebook Messenger') as channel_name,
    FALSE as is_active,
    JSON_OBJECT(
        'page_id', '',
        'page_access_token', '',
        'app_id', '',
        'app_secret', '',
        'webhook_verify_token', CONCAT('fb_', w.id, '_verify')
    ) as credentials,
    'disconnected' as connection_status,
    TRUE as auto_respond
FROM websites w
WHERE w.tenant_id = 'demo-tenant'
LIMIT 2;

INSERT INTO channel_connections (tenant_id, website_id, channel_type, channel_name, is_active, credentials, connection_status)
SELECT 
    w.tenant_id,
    w.id as website_id,
    'instagram' as channel_type,
    CONCAT(w.name, ' - Instagram DM') as channel_name,
    FALSE as is_active,
    JSON_OBJECT(
        'instagram_account_id', '',
        'access_token', '',
        'webhook_verify_token', CONCAT('ig_', w.id, '_verify')
    ) as credentials,
    'disconnected' as connection_status
FROM websites w
WHERE w.tenant_id = 'demo-tenant'
LIMIT 1;

-- Step 6: Create indexes for unified inbox filtering
CREATE INDEX idx_sessions_website_channel ON chat_sessions(website_id, channel_type, status);
CREATE INDEX idx_sessions_agent_status ON chat_sessions(assigned_agent_id, status);
CREATE INDEX idx_sessions_created ON chat_sessions(created_at DESC);

-- Step 7: Add view for unified inbox
CREATE OR REPLACE VIEW unified_inbox AS
SELECT 
    cs.id as session_id,
    cs.tenant_id,
    cs.visitor_id,
    cs.visitor_name,
    cs.visitor_email,
    cs.status,
    cs.assigned_agent_id,
    cs.created_at,
    cs.updated_at,
    
    -- Channel information
    cs.channel_type,
    cs.channel_user_id,
    cs.channel_username,
    cc.channel_name,
    cc.connection_status,
    
    -- Website information
    w.id as website_id,
    w.name as website_name,
    w.domain as website_domain,
    
    -- AI Profile information
    cw.ai_agent_profile_id,
    aic.profile_name as ai_profile_name,
    
    -- Latest message
    (SELECT body FROM chat_messages 
     WHERE session_id = cs.id 
     ORDER BY created_at DESC LIMIT 1) as last_message,
    (SELECT created_at FROM chat_messages 
     WHERE session_id = cs.id 
     ORDER BY created_at DESC LIMIT 1) as last_message_at,
    (SELECT COUNT(*) FROM chat_messages 
     WHERE session_id = cs.id AND sender_type = 'visitor') as visitor_message_count
     
FROM chat_sessions cs
LEFT JOIN channel_connections cc ON cc.id = cs.channel_connection_id
LEFT JOIN websites w ON w.id = cs.website_id
LEFT JOIN chat_widgets cw ON cw.website_id = w.id
LEFT JOIN ai_agent_config aic ON aic.id = cw.ai_agent_profile_id
WHERE cs.status IN ('active', 'waiting', 'queued');

-- Step 8: Add comments for clarity
ALTER TABLE channel_connections COMMENT = 'Stores connection credentials for all communication channels per website';
ALTER TABLE chat_sessions COMMENT = 'Conversations from all channels - web, WhatsApp, Facebook, Instagram, etc.';

