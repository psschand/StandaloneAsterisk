# Architecture Simulation: Real-Time Scenario Analysis

## Simulation Objective
Test the proposed architecture (Metadata + Drill-down, no context switching) against real-world scenarios to identify blind spots, edge cases, and potential issues.

---

## Scenario 1: High-Volume Multi-Brand Day

### **Setup:**
**Acme Corp** operates:
- 🛒 **E-commerce Store** (store.acme.com)
- 🎧 **Support Portal** (support.acme.com)  
- 📱 **Marketing Site** (marketing.acme.com)

**Resources:**
- WhatsApp: +1-555-0100 (shared)
- Phone: +1-555-0200 (shared, main line)
- Phone: +1-555-0201 (support-only DID)
- Agents: Sarah, Mike, Lisa (all handle all brands)

### **Timeline:**

#### **9:00 AM - Rush Hour Begins**

```
Unified Inbox (Sarah's View):
┌────────────────────────────────────────────────────────────┐
│ 12 Active Conversations                                    │
├────────────────────────────────────────────────────────────┤
│ 💬 John • WhatsApp • 1 min      [🌐 E-commerce]          │
│ 💬 Mary • Web Chat • 2 min      [🌐 Support]             │
│ 📞 Tom • Call • Ringing         [🌐 ???]                  │ ← BLIND SPOT #1
│ 💬 Lisa • Instagram • 5 min     [🌐 Marketing]           │
│ 💬 Bob • WhatsApp • 8 min       [🌐 Support]             │
│ 💬 Alice • Facebook • 10 min    [🌐 Marketing]           │
└────────────────────────────────────────────────────────────┘
```

**❗ BLIND SPOT #1: Incoming Call - Which Website?**

**Problem:**
- Call comes in to +1-555-0200 (shared DID)
- Sarah sees "Incoming call" but doesn't know which website
- Cannot apply correct context until answered

**Current Behavior:**
```sql
-- When call comes in, we create session:
INSERT INTO chat_sessions (
    tenant_id,
    website_id,  -- What value goes here?
    channel_type,
    session_id
) VALUES (
    'acme-tenant',
    NULL,        -- ❌ Problem: We don't know yet
    'phone',
    'call-12345'
);
```

**Implications:**
- Agent answers blind - no website context
- AI doesn't know which knowledge base to use
- Can't show website-specific quick replies
- Metrics unclear initially

**Possible Solutions:**

**Option A: IVR-based routing**
```
Customer calls +1-555-0200
↓
IVR: "Press 1 for Store, 2 for Support, 3 for Marketing"
↓
System tags call with website_id before agent picks up
```
✅ Pros: Clear tagging before answer
❌ Cons: Extra friction for customer

**Option B: DID-per-website**
```
+1-555-0200 → E-commerce (dedicated)
+1-555-0201 → Support (dedicated)
+1-555-0202 → Marketing (dedicated)
```
✅ Pros: Automatic tagging by DID
❌ Cons: Need multiple phone numbers (cost)

**Option C: Manual tagging after answer**
```
Agent answers → Quick modal:
"Tag this call: [E-commerce] [Support] [Marketing]"
```
✅ Pros: Flexible, low cost
❌ Cons: Extra step for agent, delay

**Option D: Default + transfer**
```
All calls start with website_id = NULL (or primary website)
Agent can transfer to correct website queue if needed
System re-tags conversation
```
✅ Pros: No friction, correctable
❌ Cons: Metrics initially inaccurate

**🎯 RECOMMENDATION: Option D + IVR hybrid**
- Allow shared DIDs with default website
- Optional IVR for known brands
- Agent can re-tag during conversation
- Track "auto-tagged" vs "manually corrected"

---

#### **9:15 AM - WhatsApp Message Arrives**

```
Customer: "I need help with my order #12345"
WhatsApp: +1-555-0100 (shared number)
```

**Routing Logic:**
```javascript
// Keyword detection
const message = "I need help with my order #12345";
const keywords = {
  ecommerce: ["order", "shop", "buy", "product", "cart"],
  support: ["help", "ticket", "issue", "problem"],
  marketing: ["campaign", "promo", "newsletter"]
};

// Matches "order" and "help" - conflict!
const matches = {
  ecommerce: ["order"],
  support: ["help"]
};
```

**❗ BLIND SPOT #2: Keyword Conflicts**

**Problem:**
- "Help with my order" matches both E-commerce AND Support
- Which website gets the conversation?
- Wrong routing = wrong AI personality + wrong KB

**Current Logic:**
```javascript
// First match wins? Highest priority? Most matches?
if (matches.ecommerce.length > 0) {
  website_id = 1; // E-commerce
} else if (matches.support.length > 0) {
  website_id = 2; // Support
}
```

**Issues:**
- Order matters (brittle)
- Ambiguous messages misrouted
- No learning from mistakes

**Better Solution: Multi-factor Routing**
```javascript
function routeWhatsAppMessage(phoneNumber, message, history) {
  // Factor 1: Keyword scoring
  const scores = {
    ecommerce: scoreKeywords(message, ecommerceKeywords),
    support: scoreKeywords(message, supportKeywords),
    marketing: scoreKeywords(message, marketingKeywords)
  };
  
  // Factor 2: Customer history
  const lastWebsite = getLastWebsite(phoneNumber);
  if (lastWebsite) {
    scores[lastWebsite] += 0.5; // Boost previous context
  }
  
  // Factor 3: Recent activity
  const recentOrders = hasRecentOrders(phoneNumber);
  if (recentOrders) {
    scores.ecommerce += 0.3;
  }
  
  // Factor 4: Time-based (business hours)
  if (isAfterHours() && scores.support > 0.3) {
    scores.support += 0.2; // Boost support during off-hours
  }
  
  // Select highest score
  const website = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  // Confidence threshold
  const confidence = scores[website];
  if (confidence < 0.4) {
    // Low confidence - route to default or ask customer
    return { website: 'ecommerce', confidence: 'low' };
  }
  
  return { website, confidence: 'high' };
}
```

**🎯 RECOMMENDATION: Smart routing with confidence**
- Multi-factor scoring (keywords + history + context)
- Low confidence → Default website + agent can re-tag
- Track routing accuracy (agent corrections)
- ML learning over time

---

#### **9:30 AM - Agent Sarah Handling Multiple Chats**

```
Sarah's Active Conversations:
1. John (WhatsApp) [🌐 E-commerce] - "Where's my order?"
2. Mary (Web Chat) [🌐 Support] - "App won't open"
3. Bob (WhatsApp) [🌐 Support] - "Need refund"
```

**Sarah's Workflow:**
```
1. Reads John's message about order
2. Needs to check order status
3. Switches to internal CRM/admin panel
4. Searches for order #12345
```

**❗ BLIND SPOT #3: Admin Panel Website Context**

**Problem:**
When Sarah opens the admin panel to check order status:
- **Does the admin panel show ALL orders (all websites)?**
- **Or filtered by current conversation's website?**
- **What if she's handling 3 conversations from 3 different websites?**

**Example:**
```
Sarah clicks "Check Order #12345"
↓
Opens admin panel at: /admin/orders/12345
↓
Question: Should this show ONLY E-commerce orders?
Or ALL orders across all websites?
```

**Scenario A: No filtering**
```
Admin Panel shows:
- Order #12345 (E-commerce) ✓
- Order #12345 (Support Portal) - different item
- Order #12345 (Marketing) - promotional code

Sarah: "Wait, which order #12345 are they asking about?"
```

**Scenario B: Filtered by conversation context**
```
Sarah's current conversation: John (E-commerce)
Admin panel automatically filters: website_id = 1
Shows only: Order #12345 (E-commerce)

Problem: Sarah switches to Bob's chat (Support)
Admin panel still showing E-commerce filter
Sarah searches for Bob's ticket → Not found (wrong filter)
```

**❗ BLIND SPOT #3B: Context Stickiness**

**Issue:** If we auto-filter admin tools by conversation context:
- Context follows conversation selection
- Agent forgets what filter is active
- Creates confusion when switching between chats

**Better Solution: Side Panel Architecture**
```
┌─────────────────────────────────────────────────────────┐
│ Unified Inbox (Left 40%)                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ John [🌐 E-commerce]                              │ │ ← Selected
│ │ ☐ Mary [🌐 Support]                                 │ │
│ │ ☐ Bob [🌐 Support]                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Conversation Panel (Right 60%)                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💬 John • WhatsApp • [🌐 E-commerce Store]         │ │ ← Website visible
│ │                                                     │ │
│ │ John: "Where's my order #12345?"                   │ │
│ │                                                     │ │
│ │ [Quick Actions]:                                    │ │
│ │ • 🔍 Look up Order #12345 (E-commerce)             │ │ ← Context-aware
│ │ • 📦 Check Shipping Status                          │ │
│ │ • 💬 Quick Replies (E-commerce)                     │ │
│ │                                                     │ │
│ │ [Type message...] [Send]                           │ │
│ └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Quick actions automatically scoped to conversation's website
- ✅ Agent doesn't need to think about filtering
- ✅ Website badge always visible in conversation header
- ✅ "Look up Order" button knows it's E-commerce context
- ✅ Switching conversations updates quick actions automatically

**🎯 RECOMMENDATION: Context-aware quick actions**
- Admin tools launched from conversation panel inherit website context
- Context shown in modal/popup title: "Order #12345 (E-commerce)"
- Agent can manually override if needed
- Prevent silent filtering that causes confusion

---

#### **10:00 AM - Customer Contacts Multiple Websites**

```
Customer: Alice (alice@example.com, +1-555-0150)

Timeline:
9:00 AM - Chats on E-commerce via web widget → Order inquiry
9:30 AM - Messages WhatsApp (shared) → Support question
10:00 AM - DMs Instagram (Marketing account) → Promo question
```

**❗ BLIND SPOT #4: Customer Identity Across Websites**

**Problem:**
- Alice has 3 separate conversations
- Each tagged to different website
- Agent doesn't see full picture

**Sarah's View (Current):**
```
Unified Inbox:
│ 💬 Alice • Web • [🌐 E-commerce] • "Where's my order?"
│ 💬 +1-555-0150 • WhatsApp • [🌐 Support] • "Help!"
│ 💬 alice_insta • Instagram • [🌐 Marketing] • "Promo?"
```

**Issue:** Agent doesn't realize it's the same person!
- Email vs Phone vs Instagram handle - no linkage
- Duplicate effort answering similar questions
- Can't see cross-brand customer journey

**Better: Unified Customer Profile**
```
When Sarah clicks on Alice's chat:
┌─────────────────────────────────────────────────────────┐
│ 💬 Alice (alice@example.com)                            │
│ [🌐 E-commerce] • Web Chat                              │
│                                                          │
│ ⚠️ This customer has other active conversations:        │
│ • [🌐 Support] WhatsApp +1-555-0150 (30 min ago)       │
│ • [🌐 Marketing] Instagram @alice_insta (just now)     │
│                                                          │
│ 📊 Customer Summary:                                     │
│ • Total orders: 5 (E-commerce)                          │
│ • Support tickets: 2 (Support)                          │
│ • Campaign clicks: 3 (Marketing)                        │
│ • Lifetime value: $450                                  │
│ • Satisfaction: 4.5/5                                   │
└─────────────────────────────────────────────────────────┘
```

**Database Challenge:**
```sql
-- How do we link these?
contacts (
  id,
  tenant_id,
  email,
  phone,
  social_handles JSON -- {"instagram": "alice_insta", "twitter": "..."}
)

chat_sessions (
  id,
  tenant_id,
  website_id,
  contact_id, -- ← Link to unified contact
  channel_type,
  channel_identifier -- email / phone / @handle
)

-- Query: Get all sessions for a contact across websites
SELECT * FROM chat_sessions 
WHERE contact_id = 123
ORDER BY created_at DESC;
```

**🎯 RECOMMENDATION: Customer identity unification**
- Contact record = cross-website identity
- Link sessions by contact_id
- Show cross-brand activity in sidebar
- Flag when same customer contacts multiple times
- Track customer journey across brands

---

## Scenario 2: Configuration Tasks

### **11:00 AM - Admin John Sets Up New Instagram**

**Task:** Connect Instagram for Marketing website

**John's Journey:**

#### **Step 1: Navigate to Websites**
```
Sidebar → 🌐 Websites & Brands
```

#### **Step 2: List View**
```
┌────────────────────────────────────────────────────────┐
│ 🌐 Websites & Brands                                   │
│                                                        │
│ ┌──────────────────────────┐                         │
│ │ 🛒 E-commerce Store       │ [Configure]            │
│ │ 📊 3 channels, 145 chats  │                         │
│ └──────────────────────────┘                         │
│                                                        │
│ ┌──────────────────────────┐                         │
│ │ 🎧 Support Portal         │ [Configure]            │
│ │ 📊 2 channels, 75 chats   │                         │
│ └──────────────────────────┘                         │
│                                                        │
│ ┌──────────────────────────┐                         │
│ │ 📱 Marketing Site         │ [Configure] ← John clicks │
│ │ 📊 1 channel, 25 chats    │                         │
│ └──────────────────────────┘                         │
└────────────────────────────────────────────────────────┘
```

#### **Step 3: Website Detail (Drill-down)**
```
┌────────────────────────────────────────────────────────┐
│ 🌐 Marketing Site                        [← Back]     │
│                                                        │
│ Tabs: [Overview] [Channels] [Widget] [AI] [Analytics] │
│       ─────────  ────────                             │
│                                                        │
│ Current Channels:                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ ✅ Facebook: MarketingPage (Connected)           │ │
│ │ ❌ Instagram: (Not connected)                     │ │
│ │ ❌ Twitter: (Not connected)                       │ │
│ │ ✅ Web Chat: Widget enabled                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                        │
│ [+ Connect Instagram]                                 │
└────────────────────────────────────────────────────────┘
```

**John clicks "Connect Instagram"**

#### **Step 4: Instagram Connection Modal**
```
┌────────────────────────────────────────────────────────┐
│ Connect Instagram to Marketing Site                    │
│                                                        │
│ Instagram Username: [_______________]                  │
│ Access Token:       [_______________]                  │
│ Webhook URL:        [auto-generated]                   │
│                                                        │
│ ⚠️ This Instagram account will be exclusively linked   │
│    to Marketing Site. Messages will be tagged with     │
│    [🌐 Marketing] in the Unified Inbox.               │
│                                                        │
│ [Test Connection] [Cancel] [Save]                     │
└────────────────────────────────────────────────────────┘
```

**❗ BLIND SPOT #5: Duplicate Channel Prevention**

**Problem:**
What if John (or another admin) tries to connect the SAME Instagram account to multiple websites?

**Scenario:**
```
Marketing Site: Instagram @acme_marketing ✅ Connected
E-commerce: Instagram @acme_marketing ??? Try to connect
```

**Should we:**
A. **Allow it** - Same account serving multiple websites?
B. **Block it** - One Instagram account = one website?
C. **Warn and route** - Allow but route by keywords?

**Option A: Allow (with routing)**
```sql
channel_connections:
│ id │ type      │ identifier      │ website_id │
├────┼───────────┼─────────────────┼────────────┤
│ 1  │ instagram │ @acme_marketing │ 1          │ ← E-commerce
│ 2  │ instagram │ @acme_marketing │ 3          │ ← Marketing

-- When message arrives: "Help with order"
→ Route to website 1 (E-commerce)

-- When message arrives: "Promo code?"
→ Route to website 3 (Marketing)
```
✅ Pros: Flexible, one account serves all
❌ Cons: Routing complexity, duplicate config

**Option B: Block (exclusive)**
```javascript
// Before creating connection
const existing = await channelConnectionRepo.findByIdentifier(
  'instagram',
  '@acme_marketing'
);

if (existing && existing.website_id !== currentWebsiteId) {
  throw new Error(
    `Instagram account @acme_marketing is already connected to ${existing.website.name}.
     Please disconnect it first or use a different account.`
  );
}
```
✅ Pros: Clean, no ambiguity
❌ Cons: Need separate accounts per brand (common practice anyway)

**Option C: Warn + suggest**
```
⚠️ Warning: Instagram @acme_marketing is already connected to E-commerce.

You can:
• Disconnect from E-commerce and connect here
• Use a different Instagram account for Marketing
• Keep both and use keyword routing (advanced)

[Cancel] [Connect Anyway] [Use Different Account]
```

**🎯 RECOMMENDATION: Option B (Block) with migration**
- One channel identity = one website (clean model)
- Most brands have separate accounts anyway
- Provide "Transfer" button to move channel between websites
- Show where channel is currently connected before attempt

---

#### **Step 5: After Connection Success**

```
✅ Instagram connected successfully!

┌────────────────────────────────────────────────────────┐
│ ✅ Instagram: @acme_marketing (Connected)              │
│    • Webhook: Active                                   │
│    • Last sync: Just now                               │
│    • [Test] [Disconnect] [Settings]                    │
└────────────────────────────────────────────────────────┘
```

**New message arrives on Instagram:**
```
@customer_123: "What's the promo code?"
```

**Backend Processing:**
```javascript
// Webhook receives Instagram message
const message = {
  from: '@customer_123',
  text: 'What's the promo code?',
  timestamp: Date.now()
};

// Look up channel connection
const channel = await channelConnectionRepo.findByIdentifier(
  'instagram',
  '@acme_marketing'
);

// channel.website_id = 3 (Marketing)

// Create chat session
const session = await chatSessionRepo.create({
  tenant_id: channel.tenant_id,
  website_id: channel.website_id, // ← Automatically tagged as Marketing
  channel_type: 'instagram',
  contact_identifier: '@customer_123',
  widget_id: null // ← BLIND SPOT #6
});
```

**❗ BLIND SPOT #6: Widget ID for Non-Web Channels**

**Problem:**
- `chat_sessions.widget_id` is NOT NULL in current schema
- Instagram messages don't have a widget
- WhatsApp messages don't have a widget
- Phone calls don't have a widget

**Current Schema:**
```sql
CREATE TABLE chat_sessions (
  widget_id BIGINT NOT NULL, -- ❌ Problem!
  FOREIGN KEY (widget_id) REFERENCES chat_widgets(id)
);
```

**Insert fails:**
```
Error: Column 'widget_id' cannot be null
```

**Workarounds (Bad):**
1. Create dummy widgets for each non-web channel ❌
2. Use widget_id = 0 ❌
3. Reuse website's primary widget ❌

**Proper Solution:**
```sql
ALTER TABLE chat_sessions 
MODIFY COLUMN widget_id BIGINT NULL;

-- widget_id is:
-- - Set for web chat (from widget embed)
-- - NULL for Instagram, WhatsApp, Facebook, Phone, Email
```

**Better schema:**
```sql
chat_sessions (
  id,
  tenant_id NOT NULL,
  website_id NOT NULL,  -- Every session belongs to a website
  channel_type NOT NULL, -- 'web', 'instagram', 'whatsapp', 'phone'
  widget_id NULL,        -- Only for web chat
  channel_connection_id NULL, -- For Instagram, WhatsApp, etc.
  CONSTRAINT check_source CHECK (
    (channel_type = 'web' AND widget_id IS NOT NULL) OR
    (channel_type != 'web' AND channel_connection_id IS NOT NULL)
  )
);
```

**🎯 RECOMMENDATION: Make widget_id nullable + add channel_connection_id**
- Web chat: widget_id populated, channel_connection_id NULL
- Instagram/WhatsApp/etc: channel_connection_id populated, widget_id NULL
- Maintain referential integrity with CHECK constraints
- This is CRITICAL - already identified as a bug in previous docs

---

## Scenario 3: Agent Transfers & Escalations

### **2:00 PM - Complex Customer Issue**

**Customer:** Bob contacts Support via WhatsApp
**Initial routing:** → Support Portal (keyword: "help")
**Agent:** Lisa picks up the conversation

**Timeline:**

#### **2:00 PM - Initial Contact**
```
Bob: "I need help with my order, I can't find it in my account"
```

**Lisa's View:**
```
┌────────────────────────────────────────────────────────┐
│ 💬 Bob • WhatsApp • [🌐 Support Portal]               │
│                                                        │
│ Bob: "I need help with my order, I can't find it"     │
│                                                        │
│ [Quick Actions - Support Context]:                    │
│ • 🎫 Create Support Ticket                            │
│ • 📚 Search KB (Support articles)                     │
│ • 📞 Escalate to Manager                              │
└────────────────────────────────────────────────────────┘
```

**Problem:** Lisa realizes this is actually an E-commerce issue, not Support

#### **2:05 PM - Lisa Needs to Transfer**

**❗ BLIND SPOT #7: Cross-Website Transfer**

**Question:** How does Lisa transfer this conversation from Support to E-commerce?

**Option A: Simple website change**
```
Lisa clicks: "Transfer" button
→ Modal: "Transfer to which website?"
→ Options: [E-commerce] [Marketing]
→ Lisa selects E-commerce

Backend:
UPDATE chat_sessions 
SET website_id = 1  -- Changed from 2 (Support) to 1 (E-commerce)
WHERE id = 12345;
```

**Issues:**
- AI context changes (Support AI → E-commerce AI)
- Knowledge Base context changes
- What about conversation history?
- Should Support agents still see this conversation?

**Option B: Add to both websites**
```
-- Keep original tagging
website_id = 2 (Support)

-- Add cross-reference
related_websites = [1] (E-commerce)

-- Or track transfer history
transfer_history JSON:
[
  {from: 2, to: 1, agent: 'lisa', time: '2025-11-04T14:05:00Z', reason: 'Order issue'}
]
```

**Issues:**
- Which website's metrics count this conversation?
- Which AI should handle it now?
- Which KB to search?

**Better: Transfer with Context Preservation**
```
Transfer Modal:
┌────────────────────────────────────────────────────────┐
│ Transfer Conversation                                  │
│                                                        │
│ From: [🌐 Support Portal]                             │
│ To:   [🌐 E-commerce Store ▼]                         │
│                                                        │
│ Reason: [Order inquiry - wrong routing______]         │
│                                                        │
│ ☑ Keep conversation history visible in Support        │
│ ☑ Switch to E-commerce AI and KB                      │
│ ☐ Notify E-commerce team                             │
│                                                        │
│ [Cancel] [Transfer]                                   │
└────────────────────────────────────────────────────────┘

Backend:
-- Update primary website
UPDATE chat_sessions 
SET 
  website_id = 1,  -- Now E-commerce
  previous_website_id = 2,  -- Was Support
  transferred_at = NOW(),
  transferred_by = 'lisa',
  transfer_reason = 'Order inquiry - wrong routing'
WHERE id = 12345;

-- Track for both websites' metrics
INSERT INTO session_website_tags (session_id, website_id, tag_type)
VALUES 
  (12345, 2, 'originated'),  -- Support gets "originated here"
  (12345, 1, 'current');     -- E-commerce gets "currently handling"
```

**Agent View After Transfer:**
```
┌────────────────────────────────────────────────────────┐
│ 💬 Bob • WhatsApp • [🌐 E-commerce Store]             │
│ ℹ️ Transferred from Support Portal by Lisa            │
│                                                        │
│ Bob: "I need help with my order, I can't find it"     │
│                                                        │
│ [Quick Actions - E-commerce Context]: ← Changed!      │
│ • 🔍 Look Up Order                                     │
│ • 📦 Check Shipping                                    │
│ • 📚 Search KB (E-commerce articles)                  │
└────────────────────────────────────────────────────────┘
```

**🎯 RECOMMENDATION: Transfer with audit trail**
- Allow cross-website transfers
- Track transfer history (from, to, reason, agent)
- Update AI/KB context to new website
- Keep history visible in both websites' analytics
- Support metrics: "Transferred out (misrouted)"
- E-commerce metrics: "Transferred in (accepted)"

---

## Scenario 4: Reporting & Analytics

### **5:00 PM - End of Day Report**

**Manager Mike reviews daily performance:**

#### **Dashboard View**
```
┌────────────────────────────────────────────────────────┐
│ 📊 Dashboard - November 4, 2025                        │
│                                                        │
│ Overall (All Websites):                               │
│ • Total conversations: 342                            │
│ • Avg response time: 2m 15s                           │
│ • Customer satisfaction: 93%                          │
│ • Transfers: 28                                       │
└────────────────────────────────────────────────────────┘
```

**Mike clicks "View by Website"**

#### **Website Breakdown**
```
┌────────────────────────────────────────────────────────┐
│ 📊 Website Performance Breakdown                       │
│                                                        │
│ 🛒 E-commerce Store:                                   │
│    • Conversations: 145                                │
│    • Response time: 1m 45s ✅                          │
│    • CSAT: 95% ✅                                      │
│    • Transfers in: 12 (8 from Support)                │
│    • Transfers out: 5 (misrouted)                     │
│                                                        │
│ 🎧 Support Portal:                                     │
│    • Conversations: 128                                │
│    • Response time: 3m 20s ⚠️                          │
│    • CSAT: 89% ⚠️                                      │
│    • Transfers in: 3                                   │
│    • Transfers out: 15 (order issues) ← High!         │
│                                                        │
│ 📱 Marketing:                                          │
│    • Conversations: 69                                 │
│    • Response time: 2m 05s                            │
│    • CSAT: 94%                                        │
│    • Transfers in: 1                                   │
│    • Transfers out: 8 (qualified leads)               │
└────────────────────────────────────────────────────────┘
```

**❗ BLIND SPOT #8: Transfer Metrics Complexity**

**Problem:** How to count transferred conversations?

**Scenario:**
- Customer contacts Support via WhatsApp
- Transferred to E-commerce
- Handled successfully

**Metrics Questions:**
1. **Total conversations:**
   - Support: Count as 1?
   - E-commerce: Count as 1?
   - Total: 2 or 1?

2. **Response time:**
   - Support: From first message to transfer? (incomplete)
   - E-commerce: From transfer to resolution? (partial)
   - Total: First message to final resolution? (most accurate)

3. **CSAT score:**
   - Support: No rating (transferred)
   - E-commerce: Rating given (5 stars)
   - Which website gets credit?

4. **Agent performance:**
   - Lisa (Support): Transferred out (negative?)
   - Sarah (E-commerce): Resolved (positive)
   - Should Lisa be penalized for correct transfer?

**Current Implementation (Naive):**
```sql
-- Total conversations per website
SELECT website_id, COUNT(*) 
FROM chat_sessions 
GROUP BY website_id;

Result:
│ website_id │ count │
├────────────┼───────┤
│ 1          │ 150   │ ← Includes 12 transferred in
│ 2          │ 140   │ ← Includes 15 that were transferred out

Total: 290 conversations
Actual unique customers: 275
```

**Better: Segmented Metrics**
```sql
SELECT 
  website_id,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN previous_website_id IS NULL THEN 1 END) as originated_here,
  COUNT(CASE WHEN previous_website_id IS NOT NULL THEN 1 END) as transferred_in,
  (SELECT COUNT(*) FROM chat_sessions s2 
   WHERE s2.previous_website_id = s1.website_id) as transferred_out,
  AVG(CASE 
    WHEN previous_website_id IS NULL 
    THEN TIMESTAMPDIFF(SECOND, created_at, resolved_at)
    ELSE TIMESTAMPDIFF(SECOND, transferred_at, resolved_at)
  END) as avg_handling_time
FROM chat_sessions s1
GROUP BY website_id;
```

**Report Output:**
```
┌──────────────────────────────────────────────────────────────┐
│ 🛒 E-commerce Store                                          │
│                                                              │
│ Conversations:                                               │
│ • Originated: 133 (direct contacts)                         │
│ • Transferred in: 12 (8 from Support, 4 from Marketing)    │
│ • Total handled: 145                                        │
│                                                              │
│ Performance:                                                 │
│ • Avg handling time: 8m 30s (originated)                   │
│ • Avg handling time: 6m 15s (transferred) ← Faster!        │
│ • Resolution rate: 98%                                      │
│ • CSAT: 95% (140 responses)                                │
│                                                              │
│ Transfers:                                                   │
│ • Transferred out: 5 (3 to Support, 2 to Marketing)        │
│ • Transfer rate: 3.4% ← Low is good                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 🎧 Support Portal                                            │
│                                                              │
│ Conversations:                                               │
│ • Originated: 113                                           │
│ • Transferred in: 3                                         │
│ • Transferred out: 15 (13 to E-commerce, 2 to Marketing)   │
│ • Net handled: 101                                          │
│                                                              │
│ Analysis:                                                    │
│ ⚠️ High transfer-out rate: 13.3%                            │
│ Reason: Order inquiries being misrouted to Support          │
│                                                              │
│ Recommendation:                                              │
│ 💡 Improve WhatsApp routing keywords:                       │
│    Add "order", "purchase", "delivery" → E-commerce         │
└──────────────────────────────────────────────────────────────┘
```

**🎯 RECOMMENDATION: Multi-dimensional metrics**
- Separate originated, transferred-in, transferred-out
- Calculate routing accuracy (low transfer-out = good routing)
- Track transfer reasons for analysis
- Don't penalize agents for correct transfers
- Measure end-to-end customer experience across transfers
- Use transfer data to improve routing rules

---

## Scenario 5: Shared WhatsApp - Advanced Routing

### **All Day - WhatsApp Message Flow**

**Incoming messages to +1-555-0100:**

```
10:00 AM - "I want to buy shoes"        → E-commerce ✅
10:15 AM - "My order is delayed"        → E-commerce ✅
10:30 AM - "Help with login"            → Support? E-commerce? ❓
10:45 AM - "Do you have a promo?"       → Marketing? E-commerce? ❓
11:00 AM - "Track order #ABC123"        → E-commerce ✅
11:30 AM - "Reset my password"          → Support ✅
2:00 PM  - "Hi"                         → ??? ❓
2:15 PM  - "Same person: Track ABC123"  → E-commerce (context) ✅
```

**❗ BLIND SPOT #9: Vague / Short Messages**

**Problem:** Messages like "Hi", "Hello", "Help" have no keywords

**Current Routing:**
```javascript
const message = "Hi";
const keywords = detectKeywords(message); // []
const website = keywords.length > 0 ? route(keywords) : DEFAULT_WEBSITE;
```

**Issues:**
- Every vague message goes to default website
- Ignores conversation history
- No learning from context

**Better: Contextual Routing**
```javascript
async function routeWhatsAppMessage(phone, message, conversationId) {
  // Check for existing conversation in last 24 hours
  const recentConversation = await getRecentConversation(phone);
  
  if (recentConversation && recentConversation.age < 24 * 60 * 60) {
    // Continue same conversation, same website
    return recentConversation.website_id;
  }
  
  // New conversation - analyze message
  const keywords = detectKeywords(message);
  
  if (keywords.length === 0) {
    // Vague message - use customer history
    const customerHistory = await getCustomerWebsiteHistory(phone);
    
    if (customerHistory.length > 0) {
      // Route to most frequent website
      const mostFrequent = getMostFrequentWebsite(customerHistory);
      return mostFrequent.website_id;
    }
    
    // No history - prompt customer
    await sendMessage(phone, 
      "Hi! I'm the Acme assistant. How can I help you today?\n" +
      "1️⃣ Shop products\n" +
      "2️⃣ Get support\n" +
      "3️⃣ Learn about promotions"
    );
    
    // Wait for response and route based on selection
    return PENDING_ROUTING;
  }
  
  // Normal keyword routing
  return routeByKeywords(keywords);
}
```

**Example Flow:**
```
2:00 PM - Customer: "Hi"
System: "Hi! I'm the Acme assistant. How can I help you today?
         1️⃣ Shop products
         2️⃣ Get support
         3️⃣ Learn about promotions"

2:01 PM - Customer: "1"
System: Routes to E-commerce
        "Great! I'm connecting you to our shopping assistant..."
```

**🎯 RECOMMENDATION: Multi-strategy routing**
1. Check for active conversation (< 24h) → Continue same website
2. Try keyword detection
3. If vague → Check customer history → Most frequent website
4. If no history → Interactive menu (1, 2, 3)
5. Track routing decisions for ML improvement

---

## Scenario 6: Multi-Agent Collaboration

### **3:00 PM - Peak Hour, All Agents Busy**

**Current Situation:**
```
Agents Online:
• Sarah (Senior) - Handling 4 chats
• Mike (Junior) - Handling 3 chats
• Lisa (Senior) - Handling 5 chats
• Tom (Junior) - Handling 2 chats

Waiting Queue:
• 8 customers waiting (across all websites)
```

**❗ BLIND SPOT #10: Queue Management Across Websites**

**Problem:** How to distribute waiting customers fairly?

**Option A: Single Shared Queue (Current)**
```
Queue (FIFO):
1. Bob [🌐 E-commerce] - waiting 5m
2. Alice [🌐 Support] - waiting 4m
3. John [🌐 Marketing] - waiting 3m
4. Mary [🌐 E-commerce] - waiting 3m
...

Next available agent gets #1 (Bob, E-commerce)
```

✅ Pros: Fair, simple, fastest response
❌ Cons: No expertise matching

**Option B: Separate Queue per Website**
```
E-commerce Queue:
1. Bob - waiting 5m
2. Mary - waiting 3m

Support Queue:
1. Alice - waiting 4m

Marketing Queue:
1. John - waiting 3m

Problem: E-commerce has 2 waiting, but agent finishes Support chat
         Support queue is now empty, E-commerce queue still has 2
         Agent sits idle while E-commerce customers wait
```

❌ Cons: Inefficient, agents idle while others overloaded

**Option C: Skills-Based with Overflow**
```
Agents have preferences:
• Sarah: [E-commerce, Support, Marketing] - all
• Mike: [Support] - support specialist
• Lisa: [E-commerce, Marketing] - sales focus
• Tom: [Support, E-commerce] - technical

Routing logic:
1. Try to match agent skill to website
2. If no skilled agent available → Any agent
3. If agent idle → Can pick from any queue

Example:
Mike (Support specialist) finishes chat
→ Check Support queue first (0 waiting)
→ Check other queues (E-commerce: 2 waiting)
→ Assign Bob (E-commerce) to Mike
→ Mike can handle basic E-commerce questions
```

✅ Pros: Expertise matching, flexible overflow
✅ Cons: More complex logic

**Better: Smart Queue with Priority**
```javascript
function getNextCustomerForAgent(agent) {
  const queues = {
    ecommerce: getWaitingCustomers('ecommerce'),
    support: getWaitingCustomers('support'),
    marketing: getWaitingCustomers('marketing')
  };
  
  // Calculate priority scores for each waiting customer
  const prioritizedCustomers = [];
  
  for (const [website, customers] of Object.entries(queues)) {
    for (const customer of customers) {
      let score = 0;
      
      // Factor 1: Wait time (higher = more urgent)
      score += customer.waitTime / 60; // Minutes waiting
      
      // Factor 2: Agent skill match
      if (agent.skills.includes(website)) {
        score += 10; // Boost for skilled agent
      }
      
      // Factor 3: Customer value
      if (customer.lifetimeValue > 500) {
        score += 5; // VIP boost
      }
      
      // Factor 4: Previous interactions
      if (customer.previousAgent === agent.id) {
        score += 8; // Continuity boost
      }
      
      // Factor 5: Message urgency (detected by AI)
      if (customer.urgency === 'high') {
        score += 15;
      }
      
      prioritizedCustomers.push({ customer, score });
    }
  }
  
  // Sort by score descending
  prioritizedCustomers.sort((a, b) => b.score - a.score);
  
  // Return highest priority customer
  return prioritizedCustomers[0]?.customer;
}
```

**Example:**
```
Agent Sarah finishes chat, system calculates:

Waiting customers:
1. Bob [E-commerce] - 5m wait, $200 value, Sarah handled before
   Score: 5 (wait) + 10 (skill) + 0 (value) + 8 (continuity) = 23

2. Alice [Support] - 4m wait, $800 VIP, high urgency, new to Sarah
   Score: 4 (wait) + 10 (skill) + 5 (VIP) + 0 (new) + 15 (urgent) = 34 ← Highest!

3. John [Marketing] - 3m wait, $100 value, normal
   Score: 3 (wait) + 10 (skill) + 0 (value) + 0 (new) = 13

Sarah gets Alice (Support) even though Bob waited longer
→ Alice is VIP + urgent
```

**🎯 RECOMMENDATION: Smart priority queue**
- Single shared queue (efficient)
- Multi-factor scoring (fair + strategic)
- Skill matching when possible
- Overflow to any agent when needed
- VIP and urgency boosting
- Track queue performance per website

---

## Scenario 7: Customer Journey Across Time

### **Week 1:**
```
Monday: Alice contacts E-commerce web chat → "Looking for shoes"
        Session 1: [🌐 E-commerce] Widget #1
        Agent: Sarah
        Resolution: Purchased order #12345
        
Tuesday: Alice contacts WhatsApp → "Where's my order?"
         Session 2: [🌐 E-commerce] WhatsApp routing
         Agent: Mike
         Resolution: Tracking provided
```

### **Week 2:**
```
Monday: Alice contacts Support via email → "Shoes don't fit"
        Session 3: [🌐 Support] Email
        Agent: Lisa
        Resolution: Return initiated
        
Wednesday: Alice calls +1-555-0200 → "Return status?"
           Session 4: [🌐 ???] Phone call
           Agent: Tom
           Issue: Tom doesn't see previous context
```

**❗ BLIND SPOT #11: Cross-Website Customer Journey**

**Problem:** Tom (on phone) doesn't see Alice's full journey:
- E-commerce purchase
- E-commerce shipping inquiry
- Support return request

**Tom's View (Limited):**
```
┌────────────────────────────────────────────────────────┐
│ 📞 Alice • +1-555-0155 • [🌐 ???]                      │
│                                                        │
│ Alice: "I'm calling about a return"                    │
│                                                        │
│ Customer History:                                      │
│ • No previous calls                                    │
│ • No email address linked                             │
│ • Phone not in system                                 │
│                                                        │
│ ℹ️ Tom doesn't know about:                            │
│    - Order #12345                                     │
│    - Return already initiated                         │
│    - Previous conversations (2x E-commerce, 1x Support)│
└────────────────────────────────────────────────────────┘
```

**Better: Unified Customer Timeline**
```
┌────────────────────────────────────────────────────────┐
│ 📞 Alice • +1-555-0155                                 │
│ ℹ️ Customer identified by phone number                │
│                                                        │
│ 📊 Customer Timeline (All Websites):                  │
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ Week 1 - Monday                                    ││
│ │ 💬 Web Chat [🌐 E-commerce]                        ││
│ │ Topic: Product inquiry → Purchased order #12345    ││
│ │ Agent: Sarah • CSAT: 5/5                          ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ Week 1 - Tuesday                                   ││
│ │ 💬 WhatsApp [🌐 E-commerce]                        ││
│ │ Topic: Shipping status → Tracking provided         ││
│ │ Agent: Mike • CSAT: 4/5                           ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ Week 2 - Monday                                    ││
│ │ 📧 Email [🌐 Support]                              ││
│ │ Topic: Product return → RMA #789 created          ││
│ │ Agent: Lisa • Status: In Progress                 ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ Week 2 - Wednesday (NOW)                           ││
│ │ 📞 Phone Call [🌐 Support] ← Auto-tagged          ││
│ │ Topic: Return status inquiry                       ││
│ │ Agent: Tom                                         ││
│ │                                                    ││
│ │ 🤖 AI Suggestion:                                  ││
│ │ "Customer has active return RMA #789 for order    ││
│ │  #12345. Last update: Return received, refund     ││
│ │  processing (2-3 business days)"                  ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ [View Full Details] [View Order #12345] [View RMA #789]│
└────────────────────────────────────────────────────────┘
```

**Implementation:**
```sql
-- Contact identity resolution
contacts (
  id,
  tenant_id,
  email,
  phone,
  name,
  merged_from JSON -- Track identity merges
)

-- Session linking
chat_sessions (
  id,
  contact_id, -- ← Link to unified contact
  website_id,
  channel_type,
  topic TEXT, -- AI-generated summary
  outcome TEXT -- "Purchased", "Return initiated", etc.
)

-- Query: Get customer timeline
SELECT 
  s.created_at,
  s.channel_type,
  w.name as website,
  s.topic,
  s.outcome,
  a.name as agent_name
FROM chat_sessions s
LEFT JOIN websites w ON s.website_id = w.id
LEFT JOIN agents a ON s.agent_id = a.id
WHERE s.contact_id = 12345
ORDER BY s.created_at DESC;
```

**AI-Powered Context:**
```javascript
// When agent opens conversation
async function loadCustomerContext(contactId) {
  const sessions = await getCustomerSessions(contactId);
  const orders = await getCustomerOrders(contactId);
  const tickets = await getCustomerTickets(contactId);
  
  // AI summarization
  const summary = await aiService.summarize({
    sessions,
    orders,
    tickets
  });
  
  return {
    timeline: sessions,
    activeCases: [
      {
        type: 'return',
        id: 'RMA #789',
        status: 'In Progress',
        website: 'Support',
        details: 'Return received, refund processing'
      }
    ],
    aiSuggestion: summary.suggestedResponse,
    quickFacts: [
      'Customer since: Jan 2024',
      'Total orders: 3',
      'Lifetime value: $450',
      'Last contact: 2 days ago'
    ]
  };
}
```

**🎯 RECOMMENDATION: Cross-website customer intelligence**
- Unified contact records (link by email/phone)
- Customer timeline across all websites
- AI-generated topic/outcome summaries
- Active cases/orders shown prominently
- Agent sees full context regardless of current channel
- Critical for phone calls where no initial website context

---

## Summary of Blind Spots Found

### **Critical (Must Fix):**

1. **❗ Widget ID NOT NULL Constraint** (#6)
   - Status: KNOWN BUG
   - Impact: Instagram/WhatsApp sessions fail to create
   - Fix: Make widget_id nullable, add channel_connection_id
   - Priority: **IMMEDIATE**

2. **❗ Phone Call Website Tagging** (#1)
   - Impact: Calls have no initial website context
   - Fix: Default website + IVR + manual re-tagging
   - Priority: **HIGH**

3. **❗ Customer Identity Across Websites** (#4, #11)
   - Impact: Agents don't see full customer journey
   - Fix: Unified contact records, cross-website timeline
   - Priority: **HIGH**

### **Important (Should Address):**

4. **❗ WhatsApp Routing Conflicts** (#2)
   - Impact: Ambiguous messages misrouted
   - Fix: Multi-factor scoring, context-aware routing
   - Priority: **MEDIUM**

5. **❗ Cross-Website Transfers** (#7)
   - Impact: No clear process for misrouted conversations
   - Fix: Transfer UI with audit trail, context preservation
   - Priority: **MEDIUM**

6. **❗ Admin Tool Context** (#3)
   - Impact: Agent confusion when checking orders/tickets
   - Fix: Context-aware quick actions from conversation panel
   - Priority: **MEDIUM**

7. **❗ Transfer Metrics** (#8)
   - Impact: Unclear performance reporting
   - Fix: Multi-dimensional metrics (originated, transferred, net)
   - Priority: **MEDIUM**

### **Nice to Have:**

8. **❗ Duplicate Channel Prevention** (#5)
   - Impact: Same social account could be connected twice
   - Fix: Uniqueness check, transfer option
   - Priority: **LOW**

9. **❗ Vague Message Routing** (#9)
   - Impact: "Hi" messages default to one website
   - Fix: Contextual routing, interactive menu
   - Priority: **LOW**

10. **❗ Queue Management** (#10)
    - Impact: Inefficient agent utilization
    - Fix: Smart priority queue with multi-factor scoring
    - Priority: **LOW**

---

## Revised Architecture Recommendations

### **✅ Keep from Original:**
- Metadata approach (no forced context switching)
- Unified inbox shows all conversations
- Website badges on each conversation
- Drill-down configuration per website

### **➕ Add Based on Simulations:**

1. **Customer Identity Layer**
   ```
   contacts (unified across websites)
   ↓
   chat_sessions (tagged to website + contact)
   ↓
   Agent sees full timeline regardless of channel
   ```

2. **Flexible Channel Tagging**
   ```
   Web chat → widget_id (required)
   Phone/WhatsApp/Instagram → channel_connection_id + optional website_id
   Allow NULL initially, tag during conversation
   ```

3. **Transfer System**
   ```
   UI: Transfer button in conversation panel
   Backend: Track from/to/reason/agent
   Metrics: Originated, transferred, net handled
   ```

4. **Smart Routing Engine**
   ```
   WhatsApp → Multi-factor (keywords + history + context)
   Phone → Default website + IVR option + manual override
   Low confidence → Interactive menu or agent tag
   ```

5. **Context-Aware Quick Actions**
   ```
   Quick actions inherit conversation's website context
   "Look up Order" → Searches in conversation's website
   Admin tools show context in title/breadcrumb
   ```

---

## Final Validation: Does Architecture Hold?

### **✅ Scenario 1 (Multi-brand rush):** 
- Agents see all → ✅
- Website badges visible → ✅  
- Calls need tagging solution → ⚠️ Add default + re-tag

### **✅ Scenario 2 (Configuration):**
- Drill-down per website → ✅
- Clear intent → ✅
- Duplicate prevention → ⚠️ Add validation

### **✅ Scenario 3 (Transfers):**
- Cross-website transfer → ⚠️ Add transfer UI
- Context preservation → ⚠️ Add audit trail

### **✅ Scenario 4 (Reporting):**
- Website breakdown → ✅
- Transfer metrics → ⚠️ Add multi-dimensional tracking

### **✅ Scenario 5 (Routing):**
- Keyword routing → ✅
- Vague messages → ⚠️ Add contextual routing

### **✅ Scenario 6 (Queue):**
- Shared queue → ✅
- Skill matching → ⚠️ Add priority scoring

### **✅ Scenario 7 (Journey):**
- Cross-website history → ⚠️ Add unified timeline
- Agent context → ⚠️ Add customer intelligence panel

---

## Conclusion

**Core Architecture (Metadata + Drill-down) is SOUND** ✅

**Identified Gaps:**
- Customer identity unification
- Channel tagging flexibility
- Transfer mechanics
- Smart routing intelligence
- Context-aware tooling

**Next Steps:**
1. Fix widget_id NOT NULL bug (CRITICAL)
2. Implement unified contact records
3. Add transfer UI and audit trail
4. Enhance routing with multi-factor scoring
5. Build customer timeline view
6. Add context-aware quick actions

The architecture handles the core concept well, but needs these operational features to work in production. The blind spots are **solvable** without changing the fundamental approach.
