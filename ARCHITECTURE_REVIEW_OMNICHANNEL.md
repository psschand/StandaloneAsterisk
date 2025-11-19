# Architecture Review: Omnichannel Strategy

**Review Date:** November 4, 2025  
**Question:** Should Websites and AI Profiles be moved from "Agentic AI" module to "Omnichannel" module?

---

## 🎯 High-Level Business Strategy

### What Every Business Needs:
1. **Multi-Channel Support**
   - Website live chat
   - Social media integration (Facebook, WhatsApp, Twitter)
   - Email/Ticketing system
   - Phone support (call center)

2. **Unified Customer Experience**
   - One platform to manage all channels
   - Customer context across channels
   - Consistent AI responses

3. **Per-Website/Brand Configuration**
   - Different websites = different branding
   - Different AI personalities per brand
   - Different knowledge bases per product line

---

## 📊 Current Architecture Analysis

### Current Module Structure:

```
┌─────────────────────────────────────────┐
│ AGENTIC AI MODULE                       │
├─────────────────────────────────────────┤
│ • AI Agents (Bot creation)              │
│ • AI Profiles ⚠️                        │
│ • Websites ⚠️                           │
│ • Knowledge Base                        │
│ • Training (coming soon)                │
│ • Analytics (coming soon)               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ OMNICHANNEL CHAT MODULE                 │
├─────────────────────────────────────────┤
│ • Live Chats                            │
│ • Chat History                          │
│ • Widget Designer                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ HELPDESK MODULE                         │
├─────────────────────────────────────────┤
│ • Tickets                               │
│ • SLA Management                        │
│ • Categories                            │
└─────────────────────────────────────────┘
```

---

## 🤔 The Problem

### Current Issues:

1. **Fragmented User Journey**
   ```
   Admin wants to set up live chat:
   1. Go to "Omnichannel Chat" → Widget Designer (configure widget)
   2. Go to "Agentic AI" → Websites (create website)
   3. Go to "Agentic AI" → AI Profiles (create AI profile)
   4. Link them together
   ```
   **Result:** Confusing! User has to jump between modules.

2. **Module Purpose Confusion**
   - "Agentic AI" sounds like ML/AI development (training models, tuning)
   - "Websites" is about business properties, not AI
   - "AI Profiles" is about channel configuration, not AI research

3. **Logical Grouping**
   - Websites = Communication Channels (like phone, social media)
   - AI Profiles = Channel-specific AI behavior
   - These belong with other channel management

---

## ✅ Recommended Architecture

### Proposed Module Structure:

```
┌─────────────────────────────────────────────────────┐
│ OMNICHANNEL SUPPORT MODULE (RENAMED & EXPANDED)     │
├─────────────────────────────────────────────────────┤
│ CHANNELS                                            │
│ ├─ Websites & Properties ✨ MOVED HERE              │
│ ├─ Chat Widgets ✨ (Widget Designer)                │
│ ├─ Social Media (Coming Soon)                       │
│ │  ├─ WhatsApp Business                             │
│ │  ├─ Facebook Messenger                            │
│ │  ├─ Instagram DM                                  │
│ │  └─ Twitter DM                                    │
│ ├─ Email/Support Email                              │
│ └─ SMS/Text                                         │
│                                                      │
│ CHANNEL CONFIGURATION                               │
│ ├─ AI Profiles ✨ MOVED HERE                        │
│ │  (AI behavior per channel/website)                │
│ ├─ Chat Routing Rules                               │
│ ├─ Business Hours                                   │
│ └─ Auto-Responses                                   │
│                                                      │
│ CONVERSATIONS                                       │
│ ├─ Live Chats (Active)                              │
│ ├─ Chat History                                     │
│ └─ Unified Inbox (All Channels)                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ AGENTIC AI MODULE (FOCUSED ON AI INTELLIGENCE)     │
├─────────────────────────────────────────────────────┤
│ INTELLIGENCE                                        │
│ ├─ Knowledge Base (Content repository)              │
│ ├─ Document Upload (RAG ingestion)                  │
│ ├─ FAQ Management                                   │
│ └─ Content Categories/Tags                          │
│                                                      │
│ AI DEVELOPMENT (Advanced)                           │
│ ├─ Model Training                                   │
│ ├─ Fine-tuning                                      │
│ ├─ Prompt Engineering                               │
│ └─ AI Analytics & Performance                       │
│                                                      │
│ AUTOMATION (Future)                                 │
│ ├─ Workflow Automation                              │
│ ├─ Intent Detection Rules                           │
│ └─ Smart Routing                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ HELPDESK MODULE (TICKET MANAGEMENT)                 │
├─────────────────────────────────────────────────────┤
│ • Tickets (Queue)                                   │
│ • SLA Management                                    │
│ • Categories                                        │
│ • Priority Rules                                    │
│ • Escalation Workflows                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CALL CENTER MODULE (VOICE)                          │
├─────────────────────────────────────────────────────┤
│ • Active Calls                                      │
│ • Queues                                            │
│ • Agents                                            │
│ • CDRs                                              │
│ • Softphone                                         │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Naming Suggestions

### Option 1: "Omnichannel Support" (Recommended)
- Clear: indicates multi-channel customer support
- Professional: common industry term
- Comprehensive: covers all communication channels

### Option 2: "Customer Channels"
- Simple and clear
- Customer-centric
- Less technical sounding

### Option 3: "Communication Hub"
- Modern and friendly
- Implies centralization
- Good for unified inbox concept

### Option 4: "Engagement Platform"
- Marketing-friendly term
- Broader scope (pre-sales + support)
- Future-proof for CRM features

---

## 🔄 Recommended Changes

### Phase 1: Reorganize Navigation (IMMEDIATE)

**Move to Omnichannel Module:**
1. ✅ Websites → Omnichannel Support > Websites & Properties
2. ✅ AI Profiles → Omnichannel Support > Channel AI Settings
3. ✅ Widget Designer → Omnichannel Support > Chat Widgets

**Keep in Agentic AI Module:**
1. ✅ Knowledge Base (content management)
2. ✅ Document Upload / RAG
3. ✅ AI Training (future)
4. ✅ AI Analytics (future)

### Phase 2: Add User Journey Flow (SOON)

Create a guided setup wizard in Omnichannel module:

```
🧙 Setup Wizard
┌─────────────────────────────────────┐
│ Step 1: Add Your Website/Property  │
│ → Name: E-commerce Store            │
│ → Domain: shop.example.com          │
│                                     │
│ Step 2: Create Chat Widget         │
│ → Colors, position, welcome message │
│                                     │
│ Step 3: Configure AI Behavior      │
│ → Select AI profile or create new  │
│ → Choose knowledge base tags       │
│                                     │
│ Step 4: Get Installation Code      │
│ → Copy widget embed code           │
│ → Test on your website             │
└─────────────────────────────────────┘
```

### Phase 3: Unified Inbox (FUTURE)

```
┌─────────────────────────────────────────┐
│ 💬 Unified Inbox                        │
├─────────────────────────────────────────┤
│ [🌐 Web] Customer A - shop.example.com  │
│ [📱 WhatsApp] Customer B                │
│ [✉️ Email] Customer C                   │
│ [🐦 Twitter] Customer D                 │
│ [📞 Call] Customer E (on hold)          │
└─────────────────────────────────────────┘
```

---

## 📋 Migration Checklist

### Code Changes Required:

**Frontend:**
- [ ] Update `frontend/src/config/modules.ts`
  - Rename "Omnichannel Chat" → "Omnichannel Support"
  - Move "Websites" from Agentic AI to Omnichannel Support
  - Move "AI Profiles" from Agentic AI to Omnichannel Support (rename to "Channel AI Settings")
  - Keep "Knowledge Base" in Agentic AI

**Backend:**
- [ ] No API changes needed (routes stay the same)
- [ ] Update API documentation grouping

**Database:**
- [ ] No schema changes needed (perfect as-is!)

**Documentation:**
- [ ] Update TESTING_GUIDE.md with new navigation paths
- [ ] Update README.md with new module structure
- [ ] Create "Setup Guide" for new users

---

## 💡 User Personas & Workflows

### Persona 1: Business Owner (Tenant Admin)
**Goal:** Set up live chat on my e-commerce site

**Current Flow (Confusing):**
```
Dashboard → Agentic AI → Websites → Add Website
         → Agentic AI → AI Profiles → Create Profile
         → Omnichannel Chat → Widget Designer → Create Widget
         → Link everything together (how??)
```

**Proposed Flow (Clear):**
```
Dashboard → Omnichannel Support
         → "Quick Setup" button
         → Wizard walks through all steps
         → Done! Copy embed code
```

---

### Persona 2: Support Manager
**Goal:** Monitor all customer conversations

**Current Flow:**
```
Omnichannel Chat → Live Chats (only web chat)
Call Center → Active Calls (only voice)
Helpdesk → Tickets (only email)
```

**Proposed Flow:**
```
Omnichannel Support → Unified Inbox
                   → See ALL conversations from all channels
                   → Single pane of glass
```

---

### Persona 3: AI Administrator
**Goal:** Manage knowledge base content

**Current Flow (OK):**
```
Agentic AI → Knowledge Base
          → Upload documents
          → Tag content
```

**Proposed Flow (Same - No change needed):**
```
Agentic AI → Knowledge Base (stays here - perfect!)
```

---

## 🎯 Database Design Validation

### Current Schema (EXCELLENT!)

```sql
-- ✅ Websites = Business Properties/Channels
CREATE TABLE websites (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    name VARCHAR(100),           -- "E-commerce Store", "Support Portal"
    domain VARCHAR(255),          -- "shop.example.com"
    is_active BOOLEAN
);

-- ✅ AI Profiles = Channel-specific AI configuration
CREATE TABLE ai_agent_config (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    profile_name VARCHAR(100),    -- "E-commerce Bot"
    website_id BIGINT,            -- ← Links to channel
    kb_tags JSON,                 -- Filter knowledge base by tags
    temperature DECIMAL,
    max_tokens INT,
    is_default BOOLEAN
);

-- ✅ Chat Widgets = Embeddable UI for websites
CREATE TABLE chat_widgets (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    website_id BIGINT,            -- ← Links to website
    ai_agent_profile_id BIGINT,   -- ← Links to AI profile
    primary_color VARCHAR(20),
    position VARCHAR(20),
    welcome_message TEXT
);

-- ✅ Knowledge Base = AI Intelligence (stays in Agentic AI module)
CREATE TABLE knowledge_base (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    title VARCHAR(255),
    content TEXT,
    tags JSON,                    -- ["products", "shipping", "returns"]
    is_active BOOLEAN
);
```

**Relationships:**
```
Tenant
  ├─ Websites (multiple properties/brands)
  │   └─ Chat Widgets (multiple widgets per website)
  │       └─ AI Profile (which AI behavior to use)
  │           └─ KB Tags (which knowledge to use)
  │
  └─ Knowledge Base (shared content pool)
```

**This design is PERFECT for omnichannel!** ✅

---

## 🚀 Implementation Plan

### Priority 1: Immediate UX Fix (2 hours)
✅ Move nav items to correct module
✅ Update menu labels
✅ Test navigation flow
✅ Rebuild Docker frontend

### Priority 2: Setup Wizard (1 day)
- [ ] Create "Quick Setup" page in Omnichannel module
- [ ] Step-by-step wizard component
- [ ] Auto-link website → widget → AI profile
- [ ] Generate embed code

### Priority 3: Social Media Channels (Future Sprints)
- [ ] WhatsApp Business API integration
- [ ] Facebook Messenger integration
- [ ] Instagram DM integration
- [ ] Twitter DM integration
- [ ] Unified inbox view

### Priority 4: Advanced Features (Future)
- [ ] Cross-channel customer identity
- [ ] Conversation routing by channel
- [ ] Channel-specific SLAs
- [ ] Multi-channel analytics dashboard

---

## ✅ Final Recommendation

**YES! You are absolutely right!**

### Changes Needed:

1. **Rename Module:**
   - "Omnichannel Chat" → "Omnichannel Support"

2. **Move Items:**
   - ✅ Websites → Omnichannel Support (they are communication channels!)
   - ✅ AI Profiles → Omnichannel Support (they configure channel behavior!)
   - ✅ Widget Designer → Omnichannel Support (already there)

3. **Keep in Agentic AI:**
   - ✅ Knowledge Base (content/intelligence)
   - ✅ Document Upload
   - ✅ Training (future)
   - ✅ Analytics (future)

4. **Future Additions to Omnichannel:**
   - Social media channels (WhatsApp, Facebook, Instagram, Twitter)
   - SMS/Text messaging
   - Email support
   - Unified inbox

---

## 🎯 Strategic Vision

```
OMNICHANNEL SUPPORT = Where you COMMUNICATE with customers
├─ All channels (web, social, email, SMS, phone)
├─ Channel configuration (widgets, AI profiles, routing)
└─ Conversations (live chat, history, unified inbox)

AGENTIC AI = Where you BUILD INTELLIGENCE
├─ Content management (knowledge base, documents)
├─ AI training and tuning
└─ Analytics and insights

HELPDESK = Where you TRACK ISSUES
├─ Ticket queue
├─ SLA management
└─ Escalations

CALL CENTER = Where you HANDLE VOICE
├─ Active calls
├─ Agent management
└─ Call analytics
```

This separation is **CLEAN**, **LOGICAL**, and **USER-FRIENDLY**! 🎉

---

**Action Required:** Shall I proceed with reorganizing the navigation? It's a quick change that will significantly improve user experience!
