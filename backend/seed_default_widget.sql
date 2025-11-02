-- Create default widget for public chat API
-- This allows the web chat widget to work without requiring manual widget setup

INSERT INTO chat_widgets (
    tenant_id,
    name,
    widget_key,
    enabled,
    primary_color,
    title,
    subtitle,
    welcome_message,
    offline_message,
    position,
    settings
) VALUES (
    'demo-tenant',
    'Default Public Widget',
    'default-widget',
    1,
    '#4F46E5',
    'Chat with us',
    'We typically reply instantly',
    'Hi! How can I help you today?',
    'Sorry, we are currently offline. Please leave a message.',
    'bottom-right',
    JSON_OBJECT(
        'show_agent_typing', true,
        'show_read_receipts', true,
        'allow_file_upload', false,
        'require_email', false
    )
)
ON DUPLICATE KEY UPDATE
    updated_at = NOW(),
    enabled = 1;

-- Verify the widget was created
SELECT 
    id,
    tenant_id,
    name,
    widget_key,
    enabled,
    created_at
FROM chat_widgets
WHERE widget_key = 'default-widget';
