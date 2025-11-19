# Website-Centric Multi-Channel Architecture

**Date:** November 4, 2025  
**Status:** Design Complete - Ready for Implementation

---

## 🎯 Core Concept

**Every website/business can have MULTIPLE communication channels:**

```
Website 1: E-commerce Store (shop.example.com)
├─ Web Chat Widget
├─ WhatsApp Business (+1-555-0101)
├─ Facebook Messenger (@ShopPage)
└─ Instagram DM (@shop_official)

Website 2: Support Portal (support.example.com)
├─ Web Chat Widget
├─ WhatsApp Business (+1-555-0102)
└─ Telegram Bot (@support_bot)

Website 3: Marketing Site (www.example.com)
├─ Web Chat Widget
└─ Twitter DM (@example_company)
```

**Agents see in Unified Inbox:**
```
📥 Unified Inbox (Filtered by Website & Channel)

[Website 1 - Facebook] Customer A: "Where is my order?"
[Website 2 - WhatsApp] Customer B: "Need technical support"
[Website 1 - Instagram] Customer C: "Love your products!"
[Website 2 - Web] Customer D: "Can't login to my account"
[Website 3 - WhatsApp] Customer E: "Pricing question"
```

---

## 📊 Database Architecture

### Core Tables Structure

```
┌─────────────────────────────────────────────────────────────┐
│ TENANTS                                                     │
│ - One company/organization                                  │
│ - Can have multiple websites/brands                         │
└─────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────┐
│ WEBSITES (Business Properties)                              │
│ - Each website = a brand/business unit                      │
│ - Examples: shop.example.com, support.example.com          │
└─────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CHANNEL_CONNECTIONS                                         │
│ - Each website can have multiple channels                   │
│ - Types: web, whatsapp, facebook, instagram, telegram      │
│ - Each channel has its own credentials                      │
│                                                             │
│ Example Records:                                            │
│ ├─ Website 1 → Web Chat (widget_key: abc123)              │
│ ├─ Website 1 → WhatsApp (+1-555-0101)                     │
│ ├─ Website 1 → Facebook (page_id: 123456)                 │
│ ├─ Website 2 → Web Chat (widget_key: def456)              │
│ └─ Website 2 → WhatsApp (+1-555-0102)                     │
└─────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CHAT_SESSIONS (Conversations)                               │
│ - Each conversation belongs to:                             │
│   * A website                                               │
│   * A channel_connection                                    │
│   * A channel_type (for easy filtering)                     │
│                                                             │
│ Fields:                                                     │
│ - website_id: Which business                                │
│ - channel_connection_id: Which specific connection          │
│ - channel_type: 'web', 'whatsapp', 'facebook', etc.        │
│ - channel_user_id: User's ID in that channel               │
│ - channel_username: Display name from channel               │
│ - status: active, waiting, closed                           │
│ - assigned_agent_id: Which agent is handling                │
└─────────────────────────────────────────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CHAT_MESSAGES                                               │
│ - Individual messages in a conversation                     │
│ - channel_message_id: Original ID from source channel       │
│ - channel_metadata: Attachments, reactions, etc.            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Channel Connections Schema

### Table: `channel_connections`

```sql
CREATE TABLE channel_connections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36),
    website_id BIGINT,                    -- Which website this channel belongs to
    channel_type ENUM(...),               -- 'web', 'whatsapp', 'facebook', etc.
    channel_name VARCHAR(100),            -- "Main Store WhatsApp", "Support Facebook"
    
    credentials JSON,                     -- Channel-specific connection info
    
    is_active BOOLEAN,                    -- Is this channel enabled?
    auto_respond BOOLEAN,                 -- Enable AI auto-response?
    business_hours_only BOOLEAN,
    
    connection_status ENUM(...),          -- 'active', 'disconnected', 'error'
    last_connected_at TIMESTAMP,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Credentials Structure per Channel Type

#### Web Chat:
```json
{
  "widget_id": 123,
  "widget_key": "abc123def456",
  "primary_color": "#4F46E5",
  "position": "bottom-right"
}
```

#### WhatsApp Business:
```json
{
  "phone_number_id": "123456789",
  "access_token": "EAAxx...",
  "business_account_id": "987654321",
  "webhook_verify_token": "my_verify_token",
  "api_version": "v17.0"
}
```

#### Facebook Messenger:
```json
{
  "page_id": "123456789",
  "page_access_token": "EAAxx...",
  "app_id": "987654321",
  "app_secret": "abc123...",
  "webhook_verify_token": "fb_verify_token"
}
```

#### Instagram DM:
```json
{
  "instagram_account_id": "123456789",
  "access_token": "EAAxx...",
  "webhook_verify_token": "ig_verify_token"
}
```

#### Telegram:
```json
{
  "bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
  "bot_username": "my_support_bot",
  "webhook_url": "https://api.example.com/webhooks/telegram"
}
```

#### Twitter DM:
```json
{
  "api_key": "abc123...",
  "api_secret": "xyz789...",
  "access_token": "123-abc...",
  "access_token_secret": "xyz...",
  "webhook_url": "https://api.example.com/webhooks/twitter"
}
```

---

## 🎨 Unified Inbox UI Design

### Agent View with Filters

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📥 Unified Inbox                                    [John Agent ▼] [⚙️] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Filters:                                                                │
│ ┌─────────────────┐ ┌──────────────────┐ ┌────────────────┐           │
│ │ All Websites ▼  │ │ All Channels ▼   │ │ Status: All ▼  │           │
│ └─────────────────┘ └──────────────────┘ └────────────────┘           │
│                                                                         │
│ ┌─ Website 1: E-commerce Store ─────────────────────────────┐          │
│ │ ☑ Web Chat                                                 │          │
│ │ ☑ WhatsApp Business (+1-555-0101)                         │          │
│ │ ☑ Facebook Messenger                                      │          │
│ │ ☑ Instagram DM                                            │          │
│ └───────────────────────────────────────────────────────────┘          │
│                                                                         │
│ ┌─ Website 2: Support Portal ────────────────────────────────┐         │
│ │ ☑ Web Chat                                                 │          │
│ │ ☑ WhatsApp Business (+1-555-0102)                         │          │
│ │ ☑ Telegram Bot                                            │          │
│ └───────────────────────────────────────────────────────────┘          │
│                                                                         │
│ [Apply Filters]                                 5 conversations active │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Conversations:                                                          │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 🌐 Website 1 - Facebook                           2m ago        │   │
│ │ Customer: Sarah Johnson                                         │   │
│ │ "Where is my order #12345?"                          [Reply →] │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 📱 Website 2 - WhatsApp                           5m ago        │   │
│ │ Customer: +1-234-567-8900 (Mike)                                │   │
│ │ "Need help with login issue"                         [Reply →] │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 📷 Website 1 - Instagram                          8m ago        │   │
│ │ Customer: @happy_customer                                       │   │
│ │ "Love your new product line! 😍"                    [Reply →] │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 💬 Website 2 - Web                               12m ago        │   │
│ │ Customer: Anonymous User #ab3c                                  │   │
│ │ "Can't find the documentation"                       [Reply →] │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 📱 Website 3 - WhatsApp                          15m ago        │   │
│ │ Customer: +1-555-123-4567 (Emma)                                │   │
│ │ "What are your pricing plans?"                       [Reply →] │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Conversation Detail View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Inbox                                                     [⚙️] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 🌐 Website 1: E-commerce Store → 📘 Facebook Messenger                 │
│                                                                         │
│ Customer: Sarah Johnson (@sarah.johnson.fb)                             │
│ Facebook ID: 123456789                                                  │
│                                                                         │
│ Status: ● Active     Assigned to: John Agent     AI: Enabled           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Conversation:                                                           │
│                                                                         │
│ [14:30] Sarah Johnson (Facebook):                                       │
│ "Hi, where is my order #12345?"                                         │
│                                                                         │
│ [14:31] AI Assistant:                                                   │
│ "Let me check that for you! Order #12345 was shipped yesterday         │
│ and should arrive by Nov 6. Tracking: 1Z999AA1..."                     │
│                                                                         │
│ [14:32] Sarah Johnson (Facebook):                                       │
│ "Perfect! Thanks! 👍"                                                   │
│                                                                         │
│ [14:35] Sarah Johnson (Facebook):                                       │
│ "Actually, can I change the delivery address?"                          │
│ 🟢 Escalated to Agent                                                   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Reply:                                                                  │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Type your message...                                              │ │
│ │                                                                   │ │
│ │                                                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ [📎] [😀] [🤖 AI Suggest]                              [Send Message] │
│                                                                         │
│ Quick Actions:                                                          │
│ [Transfer to WhatsApp] [View Order History] [Close Conversation]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Channel-Specific Workflows

### Adding a New WhatsApp Channel to a Website

**Admin Flow:**

1. **Go to:** Omnichannel Chat → Websites & Properties
2. **Select:** "E-commerce Store"
3. **Click:** "Add Channel" button
4. **Select Channel Type:** WhatsApp Business
5. **Fill in Connection Details:**
   ```
   Channel Name: Main Store WhatsApp
   Phone Number: +1-555-0101
   Phone Number ID: 123456789 (from Meta Business)
   Access Token: EAAxx... (from Meta Business)
   Business Account ID: 987654321
   Webhook Verify Token: my_secure_token
   ```
6. **Configure:**
   - ☑ Enable AI Auto-Response
   - ☑ Business Hours Only (9 AM - 5 PM)
7. **Test Connection:** System verifies credentials
8. **Activate:** Channel goes live

**Backend Process:**
```sql
-- Creates new channel connection
INSERT INTO channel_connections (
    tenant_id, website_id, channel_type, channel_name,
    credentials, is_active, auto_respond, connection_status
) VALUES (
    'demo-tenant', 1, 'whatsapp', 'Main Store WhatsApp',
    '{"phone_number_id":"123456789",...}', TRUE, TRUE, 'active'
);

-- When message arrives from WhatsApp:
INSERT INTO chat_sessions (
    tenant_id, website_id, 
    channel_connection_id, channel_type,
    channel_user_id, channel_username,
    visitor_id, status
) VALUES (
    'demo-tenant', 1,
    15, 'whatsapp',
    '+15550101', 'Sarah Johnson',
    'whatsapp_+15550101', 'active'
);
```

---

## 📱 Per-Channel Configuration

### Website Channels Page UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Website: E-commerce Store (shop.example.com)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Communication Channels:                                    [+ Add Channel] │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 💬 Web Chat Widget                                    ● Active   │   │
│ │ Widget Key: abc123def456                                        │   │
│ │ AI Profile: E-commerce Support Bot                              │   │
│ │ Conversations today: 45                                         │   │
│ │ [Configure] [Get Embed Code] [Test]                            │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 📱 WhatsApp Business                                  ● Active   │   │
│ │ Phone: +1-555-0101                                              │   │
│ │ Business Account: shop_official                                 │   │
│ │ AI Auto-Response: Enabled                                       │   │
│ │ Conversations today: 23                                         │   │
│ │ [Configure] [Test Connection] [Disable]                         │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 📘 Facebook Messenger                                 ● Active   │   │
│ │ Page: @ShopPage                                                 │   │
│ │ Page ID: 123456789                                              │   │
│ │ AI Auto-Response: Enabled                                       │   │
│ │ Conversations today: 12                                         │   │
│ │ [Configure] [Test Connection] [Disable]                         │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐   │
│ │ 📷 Instagram DM                                       ○ Inactive │   │
│ │ Account: Not Connected                                          │   │
│ │ [Connect Instagram Account]                                     │   │
│ └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Unified Inbox Filtering Logic

### SQL Query for Filtered Conversations

```sql
-- Agent's unified inbox with filters
SELECT 
    cs.id,
    cs.visitor_name,
    cs.status,
    cs.created_at,
    cs.updated_at,
    
    -- Channel information
    cs.channel_type,
    cs.channel_username,
    cc.channel_name,
    
    -- Website information
    w.id as website_id,
    w.name as website_name,
    
    -- Display label
    CONCAT(w.name, ' - ', 
           CASE cs.channel_type
               WHEN 'web' THEN 'Web'
               WHEN 'whatsapp' THEN 'WhatsApp'
               WHEN 'facebook' THEN 'Facebook'
               WHEN 'instagram' THEN 'Instagram'
               WHEN 'telegram' THEN 'Telegram'
               WHEN 'twitter' THEN 'Twitter'
               ELSE 'Unknown'
           END) as display_label,
    
    -- Latest message
    (SELECT content FROM chat_messages 
     WHERE session_id = cs.id 
     ORDER BY created_at DESC LIMIT 1) as last_message

FROM chat_sessions cs
LEFT JOIN channel_connections cc ON cc.id = cs.channel_connection_id
LEFT JOIN websites w ON w.id = cs.website_id

WHERE cs.tenant_id = :tenant_id
  AND cs.status IN ('active', 'waiting', 'queued')
  
  -- Filter by website (if selected)
  AND (:website_id IS NULL OR cs.website_id = :website_id)
  
  -- Filter by channel type (if selected)
  AND (:channel_type IS NULL OR cs.channel_type = :channel_type)
  
  -- Filter by assigned agent
  AND (:agent_filter = 'all' 
       OR (:agent_filter = 'me' AND cs.assigned_agent_id = :current_agent_id)
       OR (:agent_filter = 'unassigned' AND cs.assigned_agent_id IS NULL))

ORDER BY cs.updated_at DESC;
```

### Filter Options

```typescript
interface InboxFilters {
  websiteIds: number[];        // [] = all websites
  channelTypes: string[];      // [] = all channels
  status: string[];            // ['active', 'waiting']
  assignedTo: 'all' | 'me' | 'unassigned';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Example usage:
const filters: InboxFilters = {
  websiteIds: [1, 2],          // Website 1 and 2
  channelTypes: ['whatsapp', 'facebook'],  // Only WhatsApp and Facebook
  status: ['active'],
  assignedTo: 'me'
};
```

---

## 🎯 Implementation Roadmap

### Phase 1: Database & Backend (Week 1-2)
- [x] Create migration 031_add_website_channels.sql
- [ ] Apply migration to database
- [ ] Create ChannelConnection model in Go
- [ ] Create API endpoints:
  - GET /api/v1/websites/:id/channels
  - POST /api/v1/websites/:id/channels
  - PUT /api/v1/channels/:id
  - DELETE /api/v1/channels/:id
  - POST /api/v1/channels/:id/test
- [ ] Update chat session creation to include channel info
- [ ] Create unified inbox API endpoint

### Phase 2: Frontend - Channel Management (Week 3)
- [ ] Create ChannelManagement.tsx page
- [ ] Website detail page with channels list
- [ ] Add Channel modal (per channel type)
- [ ] Channel configuration forms
- [ ] Test connection functionality

### Phase 3: Frontend - Unified Inbox (Week 4)
- [ ] Create UnifiedInbox.tsx page
- [ ] Multi-filter component
- [ ] Conversation list with channel indicators
- [ ] Conversation detail view
- [ ] Real-time updates via WebSocket

### Phase 4: WhatsApp Integration (Week 5-6)
- [ ] WhatsApp Business API webhook handler
- [ ] Message sending via WhatsApp API
- [ ] Media handling (images, documents)
- [ ] Template messages
- [ ] Business profile sync

### Phase 5: Facebook Messenger (Week 7-8)
- [ ] Facebook webhook handler
- [ ] Message sending via Graph API
- [ ] Attachment handling
- [ ] Quick replies
- [ ] Persistent menu

### Phase 6: Instagram & Others (Week 9-10)
- [ ] Instagram webhook handler
- [ ] Telegram Bot API integration
- [ ] Twitter DM integration
- [ ] SMS gateway integration

---

## 📊 Example Data Flow

### Scenario: Customer messages via WhatsApp

1. **Customer** sends message to +1-555-0101 (Website 1's WhatsApp)
2. **WhatsApp Cloud API** sends webhook to our backend:
   ```json
   POST /webhooks/whatsapp
   {
     "object": "whatsapp_business_account",
     "entry": [{
       "changes": [{
         "value": {
           "messages": [{
             "from": "15551234567",
             "text": {"body": "Where is my order?"},
             "timestamp": "1699123456"
           }]
         }
       }]
     }]
   }
   ```

3. **Backend** processes:
   ```go
   // Find channel connection
   channel := findChannelByPhoneNumber("+15550101")
   
   // Create or find session
   session := findOrCreateSession(
       channel.WebsiteID,
       channel.ID,
       "whatsapp",
       "+15551234567",
   )
   
   // Save message
   saveMessage(session.ID, "visitor", "Where is my order?")
   
   // Check if AI should respond
   if channel.AutoRespond {
       aiResponse := generateAIResponse(session, message)
       sendWhatsAppMessage("+15551234567", aiResponse)
   } else {
       // Notify agent via WebSocket
       notifyAgent(session.AssignedAgentID, session)
   }
   ```

4. **Agent** sees in Unified Inbox:
   ```
   [Website 1 - WhatsApp] +1-555-123-4567: "Where is my order?"
   ```

5. **Agent** replies, backend sends via WhatsApp API:
   ```go
   sendWhatsAppMessage("+15551234567", "Let me check that for you!")
   ```

---

## ✅ Success Metrics

### Technical Metrics:
- ✅ One database query to show all conversations from all channels
- ✅ Conversation retention with channel context
- ✅ Real-time updates across all channel types
- ✅ Consistent AI behavior across channels

### Business Metrics:
- Response time per channel
- Customer satisfaction per channel
- Channel usage distribution
- Agent productivity across channels
- AI automation rate per channel

---

## 🚀 Next Steps

1. **Review & Approve** this architecture
2. **Apply** migration 031 to database
3. **Implement** backend API for channel management
4. **Build** frontend channel configuration UI
5. **Integrate** first channel (WhatsApp)
6. **Test** end-to-end flow
7. **Deploy** to production

---

**This architecture provides:**
✅ Website-centric channel organization  
✅ Unified agent experience  
✅ Flexible channel addition  
✅ Proper filtering and routing  
✅ Scalable for any new channel type  

Ready to implement! 🎉
