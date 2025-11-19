# Multi-Website Architecture Strategy

## Current State Analysis

### Tenant Modes
```
Single Website Mode: 
- One website per tenant
- Simpler configuration
- All resources implicitly belong to that website

Multiple Website Mode:
- Multiple websites/brands per tenant
- Need clear resource scoping
- Shared vs. website-specific resources
```

### Current Database Structure

**Resources with `tenant_id` only (Tenant-scoped):**
- Call Center: queues, agents, cdrs, recordings, ivr_menus
- Communication: contacts, conversations, tickets
- Configuration: users, roles, schedules, blacklist
- Infrastructure: dids, voicemail, speed_dials

**Resources with both `tenant_id` + `website_id` (Website-scoped):**
- ai_agent_config
- channel_connections (WhatsApp, Facebook, etc.)
- chat_sessions
- chat_widgets
- websites

---

## Proposed Architecture Strategy

### 1. **Resource Classification**

#### **A. Website-Specific Resources** (Must have website_id)
These CANNOT be shared between websites:

1. **Digital Identity**
   - Website domain/URL
   - Chat widget (appearance, branding)
   - AI Agent configuration (personality, tone)
   - Knowledge Base tags/categories (optional scoping)

2. **Channel Connections**
   - Instagram Business Account (per brand)
   - Facebook Page (per brand)
   - Twitter Account (per brand)
   - Web chat widget
   - Each website = unique digital presence

3. **Customer Data**
   - Chat sessions originating from that website
   - Conversations tagged to that website
   - Website-specific analytics

**Database Pattern:**
```sql
CREATE TABLE resource (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    website_id BIGINT NOT NULL,  -- REQUIRED
    ...
    FOREIGN KEY (website_id) REFERENCES websites(id)
);
```

#### **B. Shared Resources** (Tenant-level only)
These CAN be used across all websites:

1. **Communication Infrastructure**
   - Phone numbers (DIDs)
   - WhatsApp Business Number (one number, all websites)
   - SMS gateway
   - VoIP trunks

2. **Human Resources**
   - Agents/Staff
   - Agent queues
   - Teams/Departments
   - Skills/Capabilities

3. **Business Data**
   - Contacts (customers can interact with multiple brands)
   - Knowledge Base (can be filtered by website tags)
   - Quick replies (can be tagged for specific websites)
   - Canned responses

4. **System Configuration**
   - User accounts
   - Roles & permissions
   - Business hours/schedules
   - Compliance rules (blacklist, call recording policies)

**Database Pattern:**
```sql
CREATE TABLE resource (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    website_id BIGINT NULL,  -- OPTIONAL (NULL = shared)
    ...
);
```

#### **C. Flexible Resources** (Can be both)
These can OPTIONALLY be website-specific or shared:

1. **Knowledge Base**
   - Shared KB: Common FAQs, company policies
   - Website-specific KB: Product-specific info
   ```sql
   knowledge_base (
       tenant_id,
       website_id NULL,  -- NULL = shared across all websites
       tags JSON  -- ["website:1", "website:2"] for multi-site
   )
   ```

2. **AI Agent Profiles**
   - Default tenant AI (fallback)
   - Website-specific AI (customized per brand)
   ```sql
   ai_agent_config (
       tenant_id,
       website_id NULL,  -- NULL = default for all websites
       priority INT  -- Higher priority overrides defaults
   )
   ```

3. **Quick Replies / Templates**
   ```sql
   quick_replies (
       tenant_id,
       website_id NULL,  -- NULL = available to all
       applicable_channels JSON  -- ["web", "whatsapp", "instagram"]
   )
   ```

---

## 2. **Navigation & UI Strategy**

### **Option A: Websites as High-Level Context Selector** ⭐ **RECOMMENDED**

```
┌─────────────────────────────────────────────┐
│ Dashboard Header                             │
│ ┌────────────────────────────────────────┐  │
│ │ 🏢 Tenant: Acme Corp                    │  │
│ │ 🌐 Website: [All Websites ▼]            │  │ ← Website Context Selector
│ │     • All Websites (Shared Resources)   │  │
│ │     • E-commerce Store                  │  │
│ │     • Support Portal                    │  │
│ │     • Marketing Site                    │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Modules:
├── Dashboard (shows aggregated or filtered by website)
├── Call Center (shared - agents work across all sites)
├── Omnichannel Chat
│   ├── Unified Inbox (filter by website)
│   ├── Chat Widgets (per website)
│   ├── Channel Connections (per website)
│   └── AI Settings (per website or shared)
├── Contacts (shared - with website tags)
├── Knowledge Base (filterable by website)
├── Settings
│   ├── Websites & Brands
│   ├── Agents & Teams (shared)
│   ├── Phone Numbers (shared)
│   └── Integrations
```

**Pros:**
- ✅ Context-aware filtering everywhere
- ✅ Easy mental model: "I'm working on X website"
- ✅ Shared resources clearly labeled as "All Websites"
- ✅ Dashboard shows relevant metrics per context
- ✅ Same navigation structure, content changes

**Cons:**
- ⚠️ Need to implement context switching
- ⚠️ Some confusion about shared vs. specific

---

### **Option B: Websites as Separate Module** (Current Approach)

```
Modules:
├── Dashboard
├── Call Center
├── Omnichannel Chat
│   ├── Websites & Properties ← Manage websites here
│   ├── Channel Management (per website)
│   ├── Widget Management (per website)
│   └── Unified Inbox (all channels)
├── Contacts
├── Settings
```

**Pros:**
- ✅ Clear separation: "Websites" is a thing you manage
- ✅ Easy to understand: Go to Websites → Configure
- ✅ No context switching complexity

**Cons:**
- ⚠️ Harder to see website context when working
- ⚠️ More navigation needed
- ⚠️ Shared resources not obvious

---

### **Option C: Hybrid Approach** ⭐ **BEST BALANCE**

```
┌─────────────────────────────────────────────┐
│ Dashboard Header                             │
│ ┌────────────────────────────────────────┐  │
│ │ Context Filter: [All Websites ▼]       │  │ ← Quick filter (top-right)
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Modules:
├── 📊 Dashboard (aggregated + filterable)
│
├── 🌐 Websites & Brands ← High-level module
│   ├── Website Management
│   ├── Channel Connections (per website)
│   ├── Widget Designer (per website)
│   └── AI Configuration (per website)
│
├── 📞 Call Center (Shared Resources)
│   ├── Live Calls
│   ├── Queues
│   ├── Agents
│   ├── Phone Numbers (DIDs)
│
├── 💬 Omnichannel Conversations
│   ├── Unified Inbox (filterable by website)
│   ├── Live Chats (filterable)
│   ├── WhatsApp (shared number, filterable)
│   ├── Social Media (per website)
│
├── 👥 Contacts (Shared, tagged)
│
├── 📚 Knowledge Base (Shared + filterable)
│
├── ⚙️ Settings
    ├── Users & Permissions
    ├── Integrations
    └── Business Hours
```

**Benefits:**
1. **"Websites & Brands"** becomes a dedicated high-level module
2. Resources clearly grouped by scope
3. Quick filter in header for context-aware views
4. Shared resources clearly in "Call Center" module
5. Conversations filterable by website

---

## 3. **Recommended Implementation Plan**

### **Phase 1: Database Schema Enhancement** ✅ (Already Done)

```sql
-- Already have:
websites (tenant_id)
ai_agent_config (tenant_id, website_id)
channel_connections (tenant_id, website_id)
chat_widgets (tenant_id, website_id)
chat_sessions (tenant_id, website_id)

-- Need to add:
ALTER TABLE knowledge_base 
ADD COLUMN website_id BIGINT NULL,
ADD COLUMN website_tags JSON NULL;

ALTER TABLE quick_replies
ADD COLUMN website_id BIGINT NULL,
ADD COLUMN applicable_websites JSON NULL;

ALTER TABLE contacts
ADD COLUMN website_tags JSON NULL; -- Track which websites they've interacted with
```

### **Phase 2: UI Reorganization** 🎯 **PRIORITY**

#### **A. Create "Websites & Brands" Top-Level Module**

Move from `Omnichannel Chat → Websites & Properties`
To: `Websites & Brands` (standalone module at top level)

```typescript
// frontend/src/config/modules.ts
{
  id: 'websites-brands',
  name: 'Websites & Brands',
  icon: Globe,
  description: 'Manage your digital properties',
  color: 'purple',
  roles: ['superadmin', 'tenant_admin', 'manager'],
  items: [
    { name: 'Overview', href: '/websites', icon: Globe },
    { name: 'Channel Connections', href: '/channels', icon: Link },
    { name: 'Chat Widgets', href: '/widget-management', icon: MessageSquare },
    { name: 'AI Configuration', href: '/ai-profiles', icon: Sparkles },
  ],
}
```

#### **B. Add Website Context Filter (Top Bar)**

```typescript
// New component: WebsiteContextSelector.tsx
<Select value={selectedWebsiteId} onChange={setWebsiteContext}>
  <option value="all">All Websites</option>
  <option value="1">E-commerce Store</option>
  <option value="2">Support Portal</option>
</Select>
```

Store in global state (zustand):
```typescript
interface WebsiteContextStore {
  selectedWebsiteId: number | 'all';
  websites: Website[];
  setContext: (id: number | 'all') => void;
}
```

#### **C. Make Components Context-Aware**

**Unified Inbox:**
```typescript
// Filter conversations by website context
const filteredSessions = sessions.filter(session => 
  websiteContext === 'all' || session.website_id === websiteContext
);
```

**Dashboard:**
```typescript
// Show metrics per website or aggregated
const metrics = websiteContext === 'all' 
  ? getAggregatedMetrics()
  : getWebsiteMetrics(websiteContext);
```

### **Phase 3: Backend API Enhancement**

Add `website_id` filter to all relevant endpoints:

```go
// Example: GET /api/v1/chat/sessions?website_id=1
// Example: GET /api/v1/chat/sessions?website_id=all

func (h *ChatHandler) ListSessions(c *gin.Context) {
    websiteID := c.Query("website_id")
    
    if websiteID == "all" || websiteID == "" {
        // Return all sessions for tenant
    } else {
        // Filter by website
        query = query.Where("website_id = ?", websiteID)
    }
}
```

---

## 4. **Data Model Examples**

### **Shared Resource: WhatsApp Number**

```json
{
  "channel_type": "whatsapp",
  "phone_number": "+1234567890",
  "tenant_id": "demo-tenant",
  "website_id": null,  // ← NULL = Shared across all websites
  "routing": {
    "strategy": "keyword_based",
    "rules": [
      {
        "keywords": ["ecommerce", "shop", "buy"],
        "route_to_website": 1
      },
      {
        "keywords": ["support", "help", "ticket"],
        "route_to_website": 2
      },
      {
        "default_website": 1
      }
    ]
  }
}
```

### **Website-Specific: Instagram**

```json
{
  "channel_type": "instagram",
  "account_username": "@acme_ecommerce",
  "tenant_id": "demo-tenant",
  "website_id": 1,  // ← REQUIRED: Instagram is per brand
  "credentials": {
    "access_token": "...",
    "page_id": "..."
  }
}
```

### **Flexible: AI Agent**

```json
// Default AI for all websites
{
  "profile_name": "Acme Support Bot",
  "tenant_id": "demo-tenant",
  "website_id": null,  // ← Default
  "tone": "professional",
  "model": "gemini-1.5-flash"
}

// Website-specific override
{
  "profile_name": "Friendly Ecommerce Bot",
  "tenant_id": "demo-tenant",
  "website_id": 1,  // ← E-commerce specific
  "tone": "casual and friendly",
  "model": "gemini-1.5-pro"
}
```

**Resolution Logic:**
```
When customer chats on website 1:
1. Check if website_id = 1 has AI config → Use it
2. Else, fallback to website_id = NULL (default)
3. Else, use system default
```

---

## 5. **User Experience Scenarios**

### **Scenario 1: Single-Website Tenant (Simple Mode)**

**Configuration:**
```sql
UPDATE tenants SET domain_mode = 'single', max_websites = 1;
```

**UI Behavior:**
- Website selector hidden (only one website)
- All resources automatically scoped to that website
- Simpler interface, no confusion

### **Scenario 2: Multi-Website Tenant (Complex Mode)**

**Configuration:**
```sql
UPDATE tenants SET domain_mode = 'multiple', max_websites = 10;
```

**UI Behavior:**
- Website selector visible in header
- "All Websites" shows aggregated view
- Selecting specific website filters everything
- Clear badges showing shared vs. specific resources

### **Scenario 3: Shared WhatsApp, Unique Widgets**

**Setup:**
```
WhatsApp: +1234567890 (shared)
├── Routes to Website 1 (based on keywords)
├── Routes to Website 2 (based on keywords)
└── Default → Website 1

Website 1: E-commerce
- Widget: Blue, casual tone
- AI: Product expert
- Instagram: @store

Website 2: Support
- Widget: Green, professional
- AI: Technical support
- Facebook: SupportPage
```

**Customer Journey:**
1. Customer sends "I need help with my order" to WhatsApp
2. Keyword "order" → Routes to Website 1
3. AI Agent uses Website 1's configuration
4. Agent sees conversation with Website 1 badge
5. History stored with website_id = 1

---

## 6. **Implementation Checklist**

### **Immediate (High Priority)**

- [ ] **Create "Websites & Brands" Module**
  - Move from Omnichannel submenu to top-level
  - Icon: Globe
  - Group all website-related config here

- [ ] **Add Website Context Selector**
  - Component in dashboard header
  - Global state management (zustand)
  - Persist selection in localStorage

- [ ] **Update Unified Inbox**
  - Add website filter dropdown
  - Show website badge on each conversation
  - Filter by selected context

- [ ] **Channel Management Enhancement**
  - Mark shared channels clearly
  - Show which websites use each channel
  - Routing configuration UI

### **Medium Priority**

- [ ] **Knowledge Base Website Tagging**
  - Add website_id column
  - Tag articles per website or "all"
  - Filter KB in widget based on website

- [ ] **Dashboard Context Awareness**
  - Show metrics per website or aggregated
  - Website performance comparison
  - Channel metrics per website

- [ ] **Agent Assignment Rules**
  - Route based on website expertise
  - Agent skills per website/brand

### **Future Enhancements**

- [ ] **White-label Mode**
  - Each website gets its own agent portal URL
  - Branding per website
  - Isolated views

- [ ] **Cross-Website Analytics**
  - Customer journey across brands
  - Upsell opportunities
  - Brand affinity analysis

---

## 7. **Recommended Approach: Hybrid Model**

**Final Recommendation:**

1. **Elevate "Websites & Brands" to top-level module** ⭐
   - Clearly shows it's a primary organizational unit
   - Groups all website-specific config
   
2. **Add website context selector in header**
   - Quick filtering without navigation
   - Context persists across modules
   
3. **Keep shared resources in appropriate modules**
   - Call Center = Shared telephony
   - Conversations = Filterable by website
   - Contacts = Shared with website tags

4. **Use visual indicators**
   - 🌐 Badge for website-specific
   - 🔗 Badge for shared resources
   - 🎯 Badge for context-filtered items

This gives you:
- ✅ **Flexibility**: Mix shared and specific resources
- ✅ **Clarity**: Clear grouping and labeling
- ✅ **Scalability**: Grows from 1 to 100 websites
- ✅ **Usability**: Context-aware without complexity
- ✅ **Efficiency**: Shared resources reduce duplication

---

## 8. **Database Schema Recommendations**

```sql
-- Flexible resource pattern
CREATE TABLE flexible_resource (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    website_id BIGINT NULL,  -- NULL = shared, value = specific
    scope ENUM('tenant', 'website') DEFAULT 'tenant',
    
    -- If shared but applicable to specific websites
    applicable_websites JSON NULL,  -- [1, 2, 5] or null for all
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (website_id) REFERENCES websites(id),
    
    INDEX idx_tenant_website (tenant_id, website_id)
);

-- Resolution helper view
CREATE VIEW resource_access AS
SELECT 
    r.*,
    CASE 
        WHEN r.website_id IS NULL THEN 'shared'
        ELSE 'specific'
    END as resource_scope,
    COALESCE(w.name, 'All Websites') as scope_name
FROM flexible_resource r
LEFT JOIN websites w ON r.website_id = w.id;
```

---

**Next Steps:**
1. Review and approve this strategy
2. Implement "Websites & Brands" module reorganization
3. Add context selector component
4. Update conversation filtering
5. Roll out progressively

This architecture supports growth from single-site simplicity to multi-brand complexity! 🚀
