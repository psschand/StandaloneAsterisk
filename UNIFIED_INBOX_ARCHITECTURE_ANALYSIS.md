# Unified Inbox & Call Center: Cross-Website Architecture Analysis

## Your Key Insight

> "Call center and unified inbox serve all websites and may not need context switching. One/multiple agents can deal with all website chats and calls."

**You're absolutely right!** This is a critical distinction that changes the recommended architecture.

---

## The Reality: Agent-Centric vs. Website-Centric Views

### **Two Different User Personas:**

#### **1. Agent/Manager (Unified Operations)**
**Mental Model:** "I handle all customer interactions, regardless of which website they came from"

**Needs:**
- ✅ See ALL conversations in one inbox
- ✅ Handle calls from ALL phone numbers
- ✅ Work across ALL brands seamlessly
- ❌ Does NOT need to switch context constantly
- ✅ Wants to filter/tag by website, but not isolate

**Use Cases:**
```
Agent Sarah's Day:
9:00 AM - Answers call from DID +1234567890 (could be any website)
9:15 AM - Responds to WhatsApp message (shared number, multiple sites)
9:30 AM - Picks up web chat from E-commerce site
10:00 AM - Handles Instagram DM from Marketing brand
10:30 AM - Answers email from Support portal

Sarah doesn't think "Now I'm working on Website 1"
Sarah thinks "I'm helping customers, regardless of which brand they contacted"
```

#### **2. Admin/Business Owner (Configuration)**
**Mental Model:** "I need to configure widgets, channels, AI per brand"

**Needs:**
- ✅ Clearly see which website has what config
- ✅ Manage channel connections per website
- ✅ Customize widget appearance per brand
- ✅ Configure AI personality per website
- ✅ Set up routing rules

**Use Cases:**
```
Admin John's Tasks:
- Set up Instagram for the E-commerce brand
- Configure a friendly AI for the Store widget
- Create a professional widget for Support portal
- Connect Facebook to Marketing website
- Review analytics per brand

John DOES think in terms of "configuring Website 1 vs Website 2"
```

---

## Revised Architecture: Operation vs Configuration

### **Option C Revised: Role-Based Views** ⭐ **BETTER FIT**

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Header                                             │
│                                                              │
│ 🎯 NO WEBSITE CONTEXT SELECTOR FOR OPERATIONS               │
│    ↳ Agents see everything by default                       │
│    ↳ Filter available, not forced context switching         │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════╗
║ OPERATIONAL MODULES (Agent View)                          ║
╚═══════════════════════════════════════════════════════════╝

├── 📊 Dashboard
│   └── Shows: Total calls, chats, metrics across ALL websites
│       Optional filters: "Show only Website 1" (but not forced)

├── 💬 Unified Inbox ← CORE: No context switching needed
│   ├── All Conversations (default view)
│   ├── Filter by:
│   │   • Channel (WhatsApp, Web, Instagram, Phone)
│   │   • Status (Open, Pending, Resolved)
│   │   • Agent (Assigned to me, Unassigned)
│   │   • Website (OPTIONAL filter, not context)
│   │   • Priority
│   ├── Visual: Website badge on each conversation
│   └── Agent picks any conversation, sees website context

├── 📞 Call Center ← CORE: All calls in one place
│   ├── Live Calls (all DIDs, all websites)
│   ├── Call History (filterable by website badge)
│   ├── Queues (shared across websites)
│   └── Agent Status

├── 👥 Contacts
│   └── Shows: All contacts, tagged with websites they've interacted with
│       Example: John Doe [🌐 E-commerce] [🌐 Support]

╔═══════════════════════════════════════════════════════════╗
║ CONFIGURATION MODULES (Admin/Setup View)                  ║
╚═══════════════════════════════════════════════════════════╝

├── 🌐 Websites & Brands ← Configuration lives here
│   ├── Website List
│   │   └── Click into specific website → Configure that site
│   │
│   ├── Per Website Config (drill-down):
│   │   ├── Channel Connections (Instagram for THIS site)
│   │   ├── Widget Designer (appearance for THIS site)
│   │   ├── AI Configuration (personality for THIS site)
│   │   └── Analytics (performance of THIS site)
│   │
│   └── Shared Resources (visible here):
│       ├── WhatsApp Number (one number, routing to websites)
│       ├── Phone Numbers (DIDs can ring all agents)
│       └── Routing Rules

├── 📚 Knowledge Base
│   └── Articles can be tagged: "All Sites" or "Specific Site"
│       Agent searching sees relevant articles automatically

├── ⚙️ Settings
    ├── Agents & Teams (shared across sites)
    ├── Business Hours
    └── Integrations
```

---

## Key Differences from Original Option C

### **What Changed:**

| Aspect | Original Option C | **Revised Option C** |
|--------|------------------|---------------------|
| **Website Context Selector** | In header, always visible | ❌ **REMOVED** from operational views |
| **Unified Inbox** | Filtered by context | ✅ Shows ALL by default, optional filter |
| **Call Center** | Context-aware | ✅ Shows ALL calls, website badge visible |
| **Dashboard** | Context-aware metrics | ✅ Aggregated by default, drill-down available |
| **Configuration** | Context switching | ✅ Per-website drill-down (not global context) |

### **Why This Works Better:**

1. **Agents don't context-switch** - They see all work in one view
2. **Website info is metadata** - Badge/tag, not isolation
3. **Filtering is optional** - "Show me only E-commerce chats" when needed
4. **Configuration is per-site** - When setting up, you explicitly work on one site
5. **Natural workflow** - Matches how agents actually work

---

## Unified Inbox Design (Revised)

### **Conversation List View:**

```
┌────────────────────────────────────────────────────────────┐
│ 💬 Unified Inbox                                           │
│                                                            │
│ [All] [Open] [Assigned to Me]   🔍 Search                │
│                                                            │
│ Filters (Optional):                                        │
│ Channel: [All ▼] Website: [All ▼] Priority: [All ▼]      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 💬 John Doe                        [🌐 E-commerce]  │  │ ← Website badge
│ │ WhatsApp • 2 min ago                                │  │
│ │ "I need help with my order..."                      │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 📞 Sarah Smith                      [🌐 Support]    │  │
│ │ Phone Call • 5 min ago • +1234567890                │  │
│ │ Duration: 3:45                                       │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 💬 Anonymous User                  [🌐 Marketing]   │  │
│ │ Web Chat • 10 min ago                                │  │
│ │ "Do you offer enterprise plans?"                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 📱 Mike Johnson                     [🌐 E-commerce]  │  │
│ │ Instagram DM • 1 hour ago                            │  │
│ │ "Is this product available?"                         │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ All conversations visible by default
- ✅ Website shown as badge (context, not filter)
- ✅ Agent can filter IF NEEDED ("show only E-commerce")
- ✅ Agent can pick any conversation regardless of website
- ✅ Channel type visible (WhatsApp, Phone, Web, Instagram)

### **Conversation Detail View:**

```
┌────────────────────────────────────────────────────────────┐
│ 💬 John Doe                                                │
│ [🌐 E-commerce Store] • WhatsApp: +1234567890             │ ← Website context at top
│ Customer since: Jan 2024 • Previous chats: 3               │
│                                                            │
│ Also contacted:                                            │
│ • [🌐 Support Portal] - 2 tickets last month               │ ← Cross-site history
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Chat History...                                            │
│ [AI suggestions based on E-commerce KB] ← Website-aware AI │
└────────────────────────────────────────────────────────────┘
```

---

## Configuration vs Operations: The Drill-Down Approach

### **Configuration: "Websites & Brands" Module**

Instead of context switching, use **drill-down navigation**:

```
Step 1: List View
┌────────────────────────────────────────────────────────────┐
│ 🌐 Websites & Brands                                       │
│                                                            │
│ ┌─────────────────────────────┐ ┌──────────────────────┐ │
│ │ 🛒 E-commerce Store          │ │ 📊 This Month        │ │
│ │ store.example.com            │ │ • 450 chats          │ │
│ │                              │ │ • 120 calls          │ │
│ │ Channels: 3 active           │ │ • 92% satisfaction   │ │
│ │ Widget: Enabled              │ │                      │ │
│ │ AI: Friendly Mode            │ │ [Configure →]        │ │
│ └─────────────────────────────┘ └──────────────────────┘ │
│                                                            │
│ ┌─────────────────────────────┐ ┌──────────────────────┐ │
│ │ 🎧 Support Portal            │ │ 📊 This Month        │ │
│ │ support.example.com          │ │ • 280 tickets        │ │
│ │                              │ │ • 95 calls           │ │
│ │ Channels: 2 active           │ │ • 88% satisfaction   │ │
│ │ Widget: Enabled              │ │                      │ │
│ │ AI: Professional Mode        │ │ [Configure →]        │ │
│ └─────────────────────────────┘ └──────────────────────┘ │
└────────────────────────────────────────────────────────────┘

Step 2: Click "Configure" → Drill down to THAT website
┌────────────────────────────────────────────────────────────┐
│ 🌐 E-commerce Store                          [← Back]      │
│                                                            │
│ Tabs:                                                      │
│ • Overview                                                 │
│ • Channel Connections ← Configure Instagram, Facebook      │
│ • Chat Widget ← Design appearance                          │
│ • AI Configuration ← Set personality                       │
│ • Analytics                                                │
│                                                            │
│ Currently viewing: Channel Connections                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Instagram: @store_official ✅ Connected              │ │
│ │ Facebook: StorePage ✅ Connected                      │ │
│ │ Twitter: (Not connected)                              │ │
│ └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**This is BETTER than context switching because:**
- ✅ Clear intent: "I'm configuring THIS specific website"
- ✅ No accidental changes to wrong site
- ✅ All settings for that site in one place
- ✅ Easy to compare: Go back, open another site
- ❌ No confusion about "what context am I in?"

---

## Shared Resources: How They Work

### **WhatsApp Number (Shared)**

**Configuration:**
```
┌────────────────────────────────────────────────────────────┐
│ 🌐 Websites & Brands → Shared Resources                   │
│                                                            │
│ WhatsApp Business Number: +1234567890                     │
│ Status: ✅ Connected                                       │
│                                                            │
│ Routing Strategy: Keyword-based                           │
│                                                            │
│ Rules:                                                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Keywords: "shop", "buy", "order", "product"          │ │
│ │ Route to: [🌐 E-commerce Store]                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Keywords: "support", "help", "ticket", "issue"       │ │
│ │ Route to: [🌐 Support Portal]                        │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Default (no match):                                  │ │
│ │ Route to: [🌐 E-commerce Store] (primary)           │ │
│ └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Agent's View (Unified Inbox):**
```
💬 Customer: "I need help with my order"
   WhatsApp: +1234567890 • [🌐 E-commerce]  ← Routed correctly
   AI: Uses E-commerce AI profile
   KB: Searches E-commerce knowledge base

💬 Customer: "I have a support ticket"
   WhatsApp: +1234567890 • [🌐 Support Portal]  ← Different routing
   AI: Uses Support AI profile
   KB: Searches support knowledge base
```

Agent sees both, handles both, doesn't care about switching context.

---

## Dashboard: Aggregated by Default

### **Dashboard View (No Context):**

```
┌────────────────────────────────────────────────────────────┐
│ 📊 Dashboard                                               │
│                                                            │
│ Today's Overview (All Websites)                           │
│                                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │ 245         │ │ 128         │ │ 94%         │         │
│ │ Total Chats │ │ Total Calls │ │ CSAT Score  │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                            │
│ By Website (Breakdown):                                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 🛒 E-commerce:  145 chats, 45 calls  (60%)           │ │
│ │ 🎧 Support:      75 chats, 55 calls  (30%)           │ │
│ │ 📱 Marketing:    25 chats, 28 calls  (10%)           │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ Active Agents (All Sites): 8 online, 2 on call           │
│                                                            │
│ [View Detailed Analytics per Website →]                   │
└────────────────────────────────────────────────────────────┘
```

**If agent wants details:**
- Click on "🛒 E-commerce" → Drills down to that site's analytics
- NOT a context switch, just a detail view
- Can go back to see all sites again

---

## Summary: Why This Approach Works

### **✅ Addresses Your Concern:**

1. **Unified Inbox doesn't need context switching**
   - Agents see all conversations by default
   - Website is metadata (badge), not isolation
   - Filter available but optional

2. **Call Center is cross-website**
   - All calls in one queue
   - DIDs can ring all agents
   - Website tagged on conversation, not forced context

3. **Agents work across all sites seamlessly**
   - No mental burden of "switching contexts"
   - Pick any conversation, handle it
   - System knows which website, shows relevant info

### **✅ Still Provides Clarity:**

1. **Configuration is per-website**
   - Drill down to configure specific site
   - No accidental changes to wrong site
   - Clear intent when setting up

2. **Shared resources clearly marked**
   - WhatsApp, DIDs shown as "Shared"
   - Routing rules visible
   - Easy to understand what's global vs. specific

3. **Visual indicators everywhere**
   - [🌐 Website Name] badge on conversations
   - Channel type icons
   - Clear labeling

---

## Comparison: Context Switching vs. Metadata

| Approach | Context Switching (Original C) | **Metadata + Drill-down (Revised)** |
|----------|-------------------------------|-------------------------------------|
| **Unified Inbox** | Header: "Viewing Website 1" → Shows only that site | Shows ALL, badge indicates website |
| **Agent Mental Model** | "I'm working on Website 1 now" | "I'm handling all customers" |
| **Configuration** | Header context affects what you see | Click into website → Configure THAT site |
| **Complexity** | Need to remember what context you're in | No context, just pick what to work on |
| **Risk** | Might edit wrong site if context wrong | Low risk: Explicit drill-down |
| **Agent Efficiency** | Lower: Need to switch contexts | Higher: See everything at once |
| **Setup Clarity** | Medium: Context applies everywhere | High: Explicit "I'm configuring Site X" |

---

## Final Recommendation: **Revised Option C**

### **For Operations (Agents/Managers):**
- ❌ NO website context selector in header
- ✅ Unified inbox shows ALL conversations
- ✅ Website badge/tag on each item
- ✅ Optional filters (not forced context)
- ✅ Cross-website by default

### **For Configuration (Admins):**
- ✅ "Websites & Brands" module at top level
- ✅ Drill-down per website to configure
- ✅ Shared resources in dedicated section
- ✅ Clear per-site tabs (Channels, Widget, AI, Analytics)
- ❌ NO global context affecting multiple modules

### **Result:**
- Agents work efficiently across all sites
- Admins configure clearly per site
- No confusion about "what context am I in?"
- Website info is metadata, not isolation
- Shared resources (WhatsApp, DIDs) work naturally

**This architecture matches how call centers actually work!** 🎯

---

## Next Steps

1. **Approve this revised approach**
2. **Keep current structure:**
   - Unified Inbox: No changes needed (already shows all)
   - Call Center: No changes needed (already cross-site)
   - Dashboard: Add breakdown by website (not filter)

3. **Enhance "Websites & Brands" module:**
   - Drill-down per website
   - Per-site configuration tabs
   - Shared resources section

4. **Add visual indicators:**
   - Website badges on conversations
   - Shared resource labels
   - Channel type icons

5. **Keep it simple for agents:**
   - Don't add context selector
   - Don't force filtering
   - Let them see everything
