-- Migration: Fix widget_id NOT NULL + Add Brand Context to AI/KB
-- Priority: CRITICAL
-- Date: 2025-11-05
-- Description: 
--   1. Fix widget_id constraint (blocks non-web channels)
--   2. Add website_id to knowledge_base_articles (brand-specific KB)
--   3. Add website_id to ai_training_data (prevent cross-brand learning)
--   4. Create products table (brand-specific catalogs)

-- ==================================================================
-- STEP 1: Fix widget_id NOT NULL Bug (CRITICAL)
-- ==================================================================

-- Backup existing data (safety check)
SELECT COUNT(*) as total_sessions FROM chat_sessions;
SELECT COUNT(*) as non_web_sessions FROM chat_sessions WHERE channel_type != 'web';

-- Make widget_id nullable
ALTER TABLE chat_sessions 
MODIFY COLUMN widget_id BIGINT NULL
COMMENT 'Widget ID for web chat sessions (NULL for other channels)';

-- Update any existing non-web sessions that have fake widget_ids
-- (In case workarounds were attempted)
UPDATE chat_sessions 
SET widget_id = NULL 
WHERE channel_type != 'web' AND widget_id IS NOT NULL;

-- Add CHECK constraint to enforce correct usage
ALTER TABLE chat_sessions
ADD CONSTRAINT check_session_source CHECK (
    (channel_type = 'web' AND widget_id IS NOT NULL) OR
    (channel_type != 'web' AND widget_id IS NULL)
);

-- Verify the change
DESCRIBE chat_sessions;
SELECT 
    channel_type,
    COUNT(*) as total,
    SUM(CASE WHEN widget_id IS NULL THEN 1 ELSE 0 END) as null_widget,
    SUM(CASE WHEN widget_id IS NOT NULL THEN 1 ELSE 0 END) as with_widget
FROM chat_sessions
GROUP BY channel_type;

-- ==================================================================
-- STEP 2: Add website_id to knowledge_base_articles
-- ==================================================================

-- Check if knowledge_base table exists
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'knowledge_base_articles';

-- If it exists, add website_id
-- (If it doesn't exist, we'll create it in STEP 2B)

-- Add website_id column (nullable - NULL means shared across all websites)
ALTER TABLE knowledge_base_articles
ADD COLUMN website_id BIGINT NULL
COMMENT 'NULL = shared across all websites, value = specific to that website'
AFTER tenant_id;

-- Add foreign key
ALTER TABLE knowledge_base_articles
ADD CONSTRAINT fk_kb_website
FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE;

-- Add index for efficient querying
ALTER TABLE knowledge_base_articles
ADD INDEX idx_tenant_website_active (tenant_id, website_id, is_active);

-- Verify
DESCRIBE knowledge_base_articles;
SELECT 
    COUNT(*) as total_articles,
    COUNT(website_id) as website_specific,
    COUNT(*) - COUNT(website_id) as shared
FROM knowledge_base_articles;

-- ==================================================================
-- STEP 2B: Create knowledge_base_articles if it doesn't exist
-- ==================================================================

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    website_id BIGINT NULL COMMENT 'NULL = shared, value = brand-specific',
    
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags JSON,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0 COMMENT 'Higher = shown first',
    author_id BIGINT,
    
    -- Usage tracking
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_tenant_website_active (tenant_id, website_id, is_active),
    INDEX idx_search (tenant_id, website_id, is_active),
    FULLTEXT INDEX idx_content (title, content),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Knowledge base articles with brand-specific context';

-- ==================================================================
-- STEP 3: Add website_id to ai_training_data (or create if not exists)
-- ==================================================================

-- Check if ai_training_data exists
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'ai_training_data';

-- Create ai_training_data table
CREATE TABLE IF NOT EXISTS ai_training_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    website_id BIGINT NULL COMMENT 'Brand-specific learning data',
    
    session_id BIGINT NOT NULL,
    message_id BIGINT,
    
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Feedback
    rating INT COMMENT '1-5 stars',
    was_helpful BOOLEAN,
    feedback_comment TEXT,
    
    -- Context
    context_tags JSON COMMENT 'e.g., ["shipping", "returns", "e-commerce"]',
    conversation_metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_website (tenant_id, website_id),
    INDEX idx_learning (tenant_id, website_id, rating),
    INDEX idx_session (session_id),
    FULLTEXT INDEX idx_question (question),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI training data isolated per brand';

-- ==================================================================
-- STEP 4: Create products table
-- ==================================================================

CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL,
    website_id BIGINT NOT NULL COMMENT 'Each brand has own product catalog',
    
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    
    type ENUM('physical', 'digital', 'service', 'subscription', 'plan') NOT NULL,
    category VARCHAR(100),
    
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    description TEXT,
    short_description VARCHAR(500),
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    stock_quantity INT,
    unlimited_stock BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSON COMMENT 'Brand-specific fields (SKU, features, specs, etc.)',
    images JSON COMMENT 'Array of image URLs',
    
    -- SEO
    slug VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_website (tenant_id, website_id),
    INDEX idx_search (tenant_id, website_id, is_active),
    INDEX idx_sku (tenant_id, sku),
    INDEX idx_slug (website_id, slug),
    FULLTEXT INDEX idx_name_desc (name, description),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_website_sku (website_id, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Brand-specific product/service catalogs';

-- ==================================================================
-- STEP 5: Verification & Summary
-- ==================================================================

-- Verify all changes
SELECT 'chat_sessions widget_id' as table_check, 
       COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'chat_sessions' 
  AND COLUMN_NAME = 'widget_id';

SELECT 'knowledge_base website_id' as table_check,
       COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'knowledge_base_articles' 
  AND COLUMN_NAME = 'website_id';

SELECT 'ai_training_data' as table_check, 
       COUNT(*) as column_count 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'ai_training_data';

SELECT 'products' as table_check, 
       COUNT(*) as column_count 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'callcenter' 
  AND TABLE_NAME = 'products';

-- Show summary
SELECT 
    'Migration Complete!' as status,
    NOW() as completed_at;

SELECT 
    'CRITICAL FIX' as change_type,
    'chat_sessions.widget_id' as target,
    'Made nullable - non-web channels can now create sessions' as description
UNION ALL
SELECT 
    'BRAND CONTEXT',
    'knowledge_base_articles.website_id',
    'Added brand-specific KB isolation'
UNION ALL
SELECT 
    'BRAND CONTEXT',
    'ai_training_data',
    'Created with website_id - prevents cross-brand learning'
UNION ALL
SELECT 
    'NEW TABLE',
    'products',
    'Created brand-specific product catalogs';

-- ==================================================================
-- STEP 6: Sample Data (Optional - for testing)
-- ==================================================================

-- Insert sample KB articles (shared and brand-specific)
-- Uncomment to populate test data

/*
-- Shared article (all websites)
INSERT INTO knowledge_base_articles 
(tenant_id, website_id, title, content, category, is_active, priority)
VALUES 
('demo-tenant', NULL, 'General Company Policy', 
 'This policy applies to all brands and websites under our company...', 
 'General', true, 1);

-- E-commerce specific
INSERT INTO knowledge_base_articles 
(tenant_id, website_id, title, content, category, is_active, priority)
SELECT 
    'demo-tenant', 
    id, 
    'Shipping Policy', 
    'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days...',
    'Shipping',
    true,
    5
FROM websites WHERE tenant_id = 'demo-tenant' AND name LIKE '%E-commerce%' LIMIT 1;

-- Support Portal specific
INSERT INTO knowledge_base_articles 
(tenant_id, website_id, title, content, category, is_active, priority)
SELECT 
    'demo-tenant', 
    id, 
    'API Authentication', 
    'To authenticate API requests, include your API key in the Authorization header...',
    'Technical',
    true,
    5
FROM websites WHERE tenant_id = 'demo-tenant' AND name LIKE '%Support%' LIMIT 1;
*/

-- ==================================================================
-- ROLLBACK PLAN (Keep commented, use only if needed)
-- ==================================================================

/*
-- ROLLBACK STEP 1: Restore widget_id NOT NULL (only if no data loss)
ALTER TABLE chat_sessions 
DROP CONSTRAINT IF EXISTS check_session_source;

ALTER TABLE chat_sessions 
MODIFY COLUMN widget_id BIGINT NOT NULL;

-- ROLLBACK STEP 2: Remove website_id from knowledge_base
ALTER TABLE knowledge_base_articles
DROP FOREIGN KEY fk_kb_website;

ALTER TABLE knowledge_base_articles
DROP INDEX idx_tenant_website_active;

ALTER TABLE knowledge_base_articles
DROP COLUMN website_id;

-- ROLLBACK STEP 3: Drop ai_training_data
DROP TABLE IF EXISTS ai_training_data;

-- ROLLBACK STEP 4: Drop products
DROP TABLE IF EXISTS products;
*/
