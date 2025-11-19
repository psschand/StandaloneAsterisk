-- Migration 030: Add Multi-Website Support with Tenant Domain Mode
-- This migration adds flexible single/multi-domain support per tenant

-- Step 1: Add domain mode configuration to tenants
ALTER TABLE tenants 
ADD COLUMN domain_mode ENUM('single', 'multiple') DEFAULT 'multiple' COMMENT 'single=one website only, multiple=unlimited websites',
ADD COLUMN max_websites INT DEFAULT NULL COMMENT 'NULL = unlimited, number = max websites allowed';

-- Step 2: Create websites table for organizing tenant web properties
CREATE TABLE IF NOT EXISTS websites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'Friendly name: E-commerce Store, Support Portal',
    domain VARCHAR(255) COMMENT 'Domain: shop.example.com',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    INDEX idx_tenant_active (tenant_id, is_active),
    INDEX idx_domain (domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Enhance AI Agent Config for profiles
ALTER TABLE ai_agent_config 
ADD COLUMN profile_name VARCHAR(100) NOT NULL DEFAULT 'Default Profile',
ADD COLUMN description TEXT,
ADD COLUMN website_id BIGINT DEFAULT NULL COMMENT 'Link profile to specific website (optional)',
ADD COLUMN is_default BOOLEAN DEFAULT FALSE COMMENT 'Default profile for tenant',
ADD COLUMN kb_tags JSON COMMENT 'Array of tags to filter knowledge base articles',
ADD FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE SET NULL,
ADD INDEX idx_tenant_profile (tenant_id, is_default);

-- Step 4: Link chat widgets to websites and AI profiles
ALTER TABLE chat_widgets
ADD COLUMN website_id BIGINT DEFAULT NULL COMMENT 'Website this widget belongs to',
ADD COLUMN ai_agent_profile_id BIGINT DEFAULT NULL COMMENT 'AI profile to use for this widget',
ADD FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
ADD FOREIGN KEY (ai_agent_profile_id) REFERENCES ai_agent_config(id) ON DELETE SET NULL,
ADD INDEX idx_website (website_id),
ADD INDEX idx_ai_profile (ai_agent_profile_id);

-- Step 5: Add tags support to knowledge base
ALTER TABLE knowledge_base 
ADD COLUMN tags JSON COMMENT 'Array of tags for filtering: ["products", "shipping", "returns"]';

-- Step 6: Migrate existing data (set demo-tenant as multiple domain mode)
UPDATE tenants 
SET domain_mode = 'multiple', max_websites = NULL 
WHERE id = 'demo-tenant';

-- Step 7: Create default website for existing tenant
INSERT INTO websites (tenant_id, name, domain, description, is_active)
SELECT 
    id as tenant_id,
    CONCAT(name, ' - Main Website') as name,
    'demo.example.com' as domain,
    'Default website created during migration' as description,
    TRUE as is_active
FROM tenants
WHERE id = 'demo-tenant';

-- Step 8: Update existing AI config with profile metadata
UPDATE ai_agent_config 
SET 
    profile_name = 'Default AI Assistant',
    description = 'General purpose customer service AI assistant',
    is_default = TRUE,
    kb_tags = JSON_ARRAY('general', 'support')
WHERE tenant_id = 'demo-tenant';

-- Step 9: Link existing widget to website and AI profile
UPDATE chat_widgets cw
LEFT JOIN websites w ON w.tenant_id = cw.tenant_id
LEFT JOIN ai_agent_config aic ON aic.tenant_id = cw.tenant_id AND aic.is_default = TRUE
SET 
    cw.website_id = w.id,
    cw.ai_agent_profile_id = aic.id
WHERE cw.tenant_id = 'demo-tenant';

-- Step 10: Add sample tags to existing knowledge base
UPDATE knowledge_base 
SET tags = CASE 
    WHEN category = 'Products' THEN JSON_ARRAY('products', 'general')
    WHEN category = 'Shipping' THEN JSON_ARRAY('shipping', 'logistics')
    WHEN category = 'Returns' THEN JSON_ARRAY('returns', 'refunds')
    WHEN category = 'Support' THEN JSON_ARRAY('support', 'general')
    WHEN category = 'Account' THEN JSON_ARRAY('account', 'billing')
    ELSE JSON_ARRAY('general')
END
WHERE tenant_id = 'demo-tenant';

-- Step 11: Activate knowledge base articles (they were all inactive!)
UPDATE knowledge_base 
SET is_active = 1 
WHERE tenant_id = 'demo-tenant';
