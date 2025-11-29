-- Create channel_connections table for omnichannel integration
CREATE TABLE IF NOT EXISTS channel_connections (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  website_id BIGINT NOT NULL COMMENT 'Which website/business this channel belongs to',
  channel_type ENUM('web','whatsapp','facebook','instagram','telegram','twitter','sms','email') NOT NULL,
  channel_name VARCHAR(100) NOT NULL COMMENT 'Friendly name: "Main Website Chat", "Support WhatsApp"',
  credentials JSON DEFAULT NULL COMMENT 'Channel-specific connection details',
  is_active BOOLEAN DEFAULT TRUE,
  auto_respond BOOLEAN DEFAULT FALSE COMMENT 'Enable AI auto-response',
  business_hours_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_connected_at TIMESTAMP NULL DEFAULT NULL,
  connection_status ENUM('active','disconnected','error','pending') DEFAULT 'pending',
  
  UNIQUE KEY unique_website_channel (website_id, channel_type, channel_name),
  INDEX idx_tenant_website (tenant_id, website_id),
  INDEX idx_channel_type (channel_type),
  INDEX idx_active (is_active),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
