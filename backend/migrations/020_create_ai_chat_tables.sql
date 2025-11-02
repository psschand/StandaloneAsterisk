-- AI Chat System Tables
-- Migration: 020_create_ai_chat_tables.sql

-- Chat Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    customer_id BIGINT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    channel ENUM('web', 'whatsapp', 'facebook', 'instagram', 'twitter', 'sms', 'telegram') NOT NULL DEFAULT 'web',
    external_id VARCHAR(255), -- WhatsApp phone, Facebook user ID, etc.
    status ENUM('queued', 'bot', 'agent', 'closed', 'resolved') DEFAULT 'bot',
    assigned_agent_id BIGINT,
    assigned_queue_id BIGINT,
    language VARCHAR(10) DEFAULT 'en',
    bot_confidence FLOAT DEFAULT 1.0, -- AI confidence score (0-1)
    bot_message_count INT DEFAULT 0, -- Number of bot messages sent
    handoff_reason VARCHAR(255), -- Why transferred to human
    handoff_triggered_by ENUM('bot', 'customer', 'rule', 'timeout', 'agent') DEFAULT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    tags JSON, -- ["billing", "complaint", "vip"]
    customer_context JSON, -- Previous orders, account info, preferences
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    first_response_at TIMESTAMP NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution_time INT, -- Seconds from start to close
    customer_rating TINYINT, -- 1-5 stars
    customer_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_agent (assigned_agent_id),
    INDEX idx_channel (channel, status),
    INDEX idx_external_id (channel, external_id),
    INDEX idx_customer (customer_id),
    INDEX idx_last_message (last_message_at),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_queue_id) REFERENCES queues(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Messages
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_type ENUM('customer', 'agent', 'bot', 'system') NOT NULL,
    sender_id BIGINT, -- user_id if agent, NULL if bot
    sender_name VARCHAR(255),
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'template', 'quick_reply') DEFAULT 'text',
    media_url VARCHAR(500),
    media_mime_type VARCHAR(100),
    media_size INT,
    is_read BOOLEAN DEFAULT FALSE,
    is_internal_note BOOLEAN DEFAULT FALSE, -- Agent-only notes
    intent VARCHAR(100), -- Detected intent by AI: "refund_request", "product_inquiry"
    sentiment FLOAT, -- -1 to 1 (negative to positive)
    entities JSON, -- Extracted entities: {"product": "iPhone", "issue": "broken screen"}
    confidence FLOAT, -- Bot confidence for this response
    metadata JSON, -- Additional data: templates used, quick replies
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    
    INDEX idx_conversation (conversation_id, sent_at),
    INDEX idx_unread (conversation_id, is_read),
    INDEX idx_sender (sender_type, sender_id),
    INDEX idx_intent (intent),
    FULLTEXT idx_content (content),
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Agent Knowledge Base (RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT, -- Comma-separated for quick search
    embedding JSON, -- Vector embeddings for semantic search (future: use pgvector)
    language VARCHAR(10) DEFAULT 'en',
    source_url VARCHAR(500), -- Reference URL for this knowledge
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE, -- Public or internal-only
    usage_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    last_used_at TIMESTAMP NULL,
    priority INT DEFAULT 0, -- Higher priority shown first
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_category (tenant_id, category),
    INDEX idx_active (tenant_id, is_active),
    INDEX idx_usage (usage_count DESC),
    FULLTEXT idx_question_answer (question, answer, keywords),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Agent Handoff Rules
CREATE TABLE IF NOT EXISTS handoff_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_type ENUM('keyword', 'intent', 'sentiment', 'timeout', 'confidence', 'message_count', 'manual', 'no_answer') NOT NULL,
    trigger_value VARCHAR(255), -- e.g., "refund", "angry", "60" (seconds), "0.5" (confidence)
    trigger_operator ENUM('equals', 'contains', 'less_than', 'greater_than', 'between') DEFAULT 'contains',
    priority INT DEFAULT 0, -- Higher priority rules checked first
    target_queue_id BIGINT, -- Which queue to route to
    message_template TEXT, -- Message to send when transferring: "Let me connect you with a specialist..."
    notify_agent BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    execution_count INT DEFAULT 0,
    last_executed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_active (tenant_id, is_active),
    INDEX idx_priority (priority DESC),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (target_queue_id) REFERENCES queues(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Channel Integrations (WhatsApp, Facebook, etc.)
CREATE TABLE IF NOT EXISTS channel_integrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    channel ENUM('whatsapp', 'facebook', 'instagram', 'twitter', 'telegram', 'web', 'sms') NOT NULL,
    name VARCHAR(100), -- Friendly name: "Main WhatsApp", "Support Facebook Page"
    credentials JSON NOT NULL, -- Store API keys, tokens, secrets (encrypted)
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    verify_token VARCHAR(255), -- For Facebook webhook verification
    phone_number VARCHAR(50), -- For WhatsApp/SMS
    page_id VARCHAR(100), -- For Facebook/Instagram
    is_active BOOLEAN DEFAULT TRUE,
    is_bot_enabled BOOLEAN DEFAULT TRUE, -- Enable AI bot for this channel
    welcome_message TEXT,
    offline_message TEXT,
    business_hours JSON, -- {"monday": {"start": "09:00", "end": "17:00"}}
    last_sync_at TIMESTAMP NULL,
    last_message_at TIMESTAMP NULL,
    message_count INT DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_channel (tenant_id, channel, phone_number),
    INDEX idx_active (is_active),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Agent Configuration per Tenant
CREATE TABLE IF NOT EXISTS ai_agent_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    model VARCHAR(50) DEFAULT 'gemini-pro', -- gemini-pro, gpt-4, claude-3, llama3
    api_key_encrypted TEXT, -- Tenant can use their own API key
    system_prompt TEXT,
    personality VARCHAR(50) DEFAULT 'professional', -- friendly, professional, casual, empathetic
    max_tokens INT DEFAULT 500,
    temperature FLOAT DEFAULT 0.7, -- 0-1, higher = more creative
    auto_handoff_enabled BOOLEAN DEFAULT TRUE,
    handoff_confidence_threshold FLOAT DEFAULT 0.5, -- Below this, transfer to human
    handoff_message_count INT DEFAULT 10, -- Max bot messages before auto-handoff
    handoff_timeout_seconds INT DEFAULT 300, -- 5 minutes
    response_delay_ms INT DEFAULT 1000, -- Simulate typing
    collect_email BOOLEAN DEFAULT TRUE,
    collect_phone BOOLEAN DEFAULT TRUE,
    collect_name BOOLEAN DEFAULT TRUE,
    business_hours_only BOOLEAN DEFAULT FALSE,
    fallback_message TEXT,
    greeting_message TEXT,
    rag_enabled BOOLEAN DEFAULT TRUE, -- Enable RAG knowledge base search
    rag_similarity_threshold FLOAT DEFAULT 0.7, -- Minimum similarity score
    rag_max_results INT DEFAULT 3,
    sentiment_analysis_enabled BOOLEAN DEFAULT TRUE,
    intent_detection_enabled BOOLEAN DEFAULT TRUE,
    language_detection_enabled BOOLEAN DEFAULT FALSE,
    supported_languages JSON, -- ["en", "es", "fr"]
    analytics_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation Tags (for categorization)
CREATE TABLE IF NOT EXISTS conversation_tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color
    description VARCHAR(255),
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_name (tenant_id, name),
    INDEX idx_active (tenant_id, is_active),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quick Replies / Canned Responses
CREATE TABLE IF NOT EXISTS quick_replies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    category VARCHAR(100),
    shortcut VARCHAR(50) NOT NULL, -- e.g., "/greeting", "/refund"
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_global BOOLEAN DEFAULT FALSE, -- Available to all agents
    created_by BIGINT,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY idx_tenant_shortcut (tenant_id, shortcut),
    INDEX idx_category (tenant_id, category),
    INDEX idx_usage (usage_count DESC),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default AI config for existing tenants
INSERT INTO ai_agent_config (tenant_id, is_enabled, model, system_prompt, greeting_message)
SELECT id, TRUE, 'gemini-pro',
    'You are a helpful customer service AI assistant. Be friendly, professional, and concise. 
    If you cannot answer a question with confidence, politely offer to connect the customer with a human agent.
    Always prioritize customer satisfaction and provide accurate information based on the knowledge base.',
    'Hello! I''m your AI assistant. How can I help you today?'
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM ai_agent_config);

-- Insert default handoff rules
INSERT INTO handoff_rules (tenant_id, name, trigger_type, trigger_value, priority, message_template)
SELECT id, 'Customer Requests Human', 'keyword', 'agent,human,person,representative,speak to someone', 100,
    'Of course! Let me connect you with one of our team members who can assist you personally.'
FROM tenants;

INSERT INTO handoff_rules (tenant_id, name, trigger_type, trigger_value, priority, message_template)
SELECT id, 'Low Confidence Response', 'confidence', '0.5', 90,
    'I want to make sure you get the best help. Let me connect you with a specialist.'
FROM tenants;

INSERT INTO handoff_rules (tenant_id, name, trigger_type, trigger_value, priority, message_template)
SELECT id, 'Negative Sentiment', 'sentiment', '-0.6', 80,
    'I understand your frustration. Let me connect you with someone who can help resolve this immediately.'
FROM tenants;

INSERT INTO handoff_rules (tenant_id, name, trigger_type, trigger_value, priority, message_template)
SELECT id, 'Too Many Messages', 'message_count', '10', 70,
    'Let me connect you with a human agent who can provide more detailed assistance.'
FROM tenants;
