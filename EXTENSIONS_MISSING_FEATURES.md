# Extension Management - Missing Call Center Features

## Current State
The Extensions UI has basic CRUD operations but is missing essential **call center features** that make it production-ready.

## ❌ Missing Features

### 1. **Voicemail Configuration**
**Current**: Not implemented  
**Needed**:
- ✅ Enable/Disable voicemail per extension
- ✅ Voicemail box number
- ✅ PIN code for voicemail access  
- ✅ Email notification settings
- ✅ Voicemail-to-email (audio attachment)
- ✅ Greeting message management
- ✅ Message retention (days)

**UI Example**:
```
┌─────────────────────────────────────┐
│ Voicemail Settings                  │
├─────────────────────────────────────┤
│ ☑️ Enable Voicemail                 │
│ Mailbox: 1001                       │
│ PIN: [****]                         │
│ Email: john@company.com             │
│ ☑️ Email notification               │
│ ☑️ Attach audio file                │
│ Keep messages: [30] days            │
└─────────────────────────────────────┘
```

### 2. **Call Forwarding**
**Current**: Not implemented  
**Needed**:
- ✅ Forward on Busy (to extension/voicemail/external)
- ✅ Forward on No Answer (with timeout)
- ✅ Forward Always (unconditional)
- ✅ Forward to mobile/external number
- ✅ Selective forwarding (time-based rules)

**UI Example**:
```
┌─────────────────────────────────────┐
│ Call Forwarding                     │
├─────────────────────────────────────┤
│ On Busy: [1002] or ☑️ Voicemail     │
│ No Answer: [1003] Timeout: [20]s    │
│ Always Forward: [+15551234567]      │
│                                     │
│ Schedule Rules:                     │
│ • After hours → +15559876543        │
│ • Weekends → Voicemail              │
└─────────────────────────────────────┘
```

### 3. **Do Not Disturb (DND)**
**Current**: Not implemented  
**Needed**:
- ✅ Enable/Disable DND
- ✅ DND status indicator in UI
- ✅ DND schedule (auto-enable/disable)
- ✅ DND action (busy tone vs. voicemail)

**UI Example**:
```
┌─────────────────────────────────────┐
│ Do Not Disturb                      │
├─────────────────────────────────────┤
│ ☐ Enable DND                        │
│ When DND active:                    │
│ • Send to voicemail                 │
│ • Play busy tone                    │
│                                     │
│ Auto-Enable Schedule:               │
│ Monday-Friday: 12:00 PM - 1:00 PM  │
└─────────────────────────────────────┘
```

### 4. **Call Recording**
**Current**: Not implemented  
**Needed**:
- ✅ Enable/Disable recording per extension
- ✅ Record all calls / On-demand only
- ✅ Announcement before recording
- ✅ Storage location (local/cloud)
- ✅ Retention policy
- ✅ Recording access permissions

**UI Example**:
```
┌─────────────────────────────────────┐
│ Call Recording                      │
├─────────────────────────────────────┤
│ ☑️ Enable Call Recording            │
│ Mode: • All calls ○ On-demand       │
│ ☑️ Play announcement                │
│ Retention: [90] days                │
│ Format: [WAV] / MP3                 │
│ Access: ☑️ Agent ☑️ Supervisor      │
└─────────────────────────────────────┘
```

### 5. **Queue Membership**
**Current**: Not implemented  
**Needed**:
- ✅ View queues this extension is member of
- ✅ Add/remove from queues
- ✅ Set penalty (priority) per queue
- ✅ Pause/Unpause in queue
- ✅ Wrapup time configuration
- ✅ Max concurrent calls per agent

**UI Example**:
```
┌─────────────────────────────────────┐
│ Queue Memberships                   │
├─────────────────────────────────────┤
│ ✅ Sales Queue     Penalty: [0]     │
│    Status: Active  Wrapup: 30s      │
│                                     │
│ ✅ Support Queue   Penalty: [1]     │
│    Status: Paused  Wrapup: 45s      │
│                                     │
│ + Add to Queue                      │
│ Max Concurrent: [2] calls           │
└─────────────────────────────────────┘
```

### 6. **Advanced Call Features**
**Current**: Basic settings only  
**Needed**:
- ✅ Call Waiting (enable/disable)
- ✅ Call Transfer Permissions
- ✅ Three-way calling
- ✅ Call Park
- ✅ Call Pickup groups
- ✅ Hot desking
- ✅ Presence/BLF (Busy Lamp Field)

**UI Example**:
```
┌─────────────────────────────────────┐
│ Call Features                       │
├─────────────────────────────────────┤
│ ☑️ Call Waiting                     │
│ ☑️ Call Transfer (supervised)       │
│ ☑️ Three-way calling                │
│ ☑️ Call Park                        │
│ Pickup Group: [1]                   │
│ ☐ Hot Desking                       │
│ BLF Keys: [1002,1003,1004]         │
└─────────────────────────────────────┘
```

### 7. **Security & Restrictions**
**Current**: Not implemented  
**Needed**:
- ✅ International calling (allow/deny)
- ✅ Premium rate restrictions
- ✅ Dial pattern restrictions
- ✅ IP whitelist/blacklist
- ✅ SIP password policy
- ✅ Maximum call duration limits
- ✅ Concurrent call limits

**UI Example**:
```
┌─────────────────────────────────────┐
│ Security & Restrictions             │
├─────────────────────────────────────┤
│ International Calling:               │
│ • Allow all                         │
│ • Allow specific: [US,CA,UK]        │
│ • Deny all                          │
│                                     │
│ ☐ Block premium rate (900, 976)    │
│ Max call duration: [120] minutes    │
│ Max concurrent: [2] calls           │
│                                     │
│ IP Restrictions:                    │
│ Whitelist: [192.168.1.0/24]        │
└─────────────────────────────────────┘
```

### 8. **Extension Statistics**
**Current**: Not implemented  
**Needed**:
- ✅ Calls today/this week/this month
- ✅ Average talk time
- ✅ Total talk time
- ✅ Missed calls
- ✅ Last call timestamp
- ✅ Utilization rate
- ✅ First call resolution rate

**UI Example**:
```
┌─────────────────────────────────────┐
│ Statistics (Today)                  │
├─────────────────────────────────────┤
│ 📞 Calls Handled: 23                │
│ ⏱️ Avg Talk Time: 4:23              │
│ ⏰ Total Talk Time: 1h 40m          │
│ ❌ Missed: 2                         │
│ 🕐 Last Call: 10 minutes ago        │
│ 📊 Utilization: 68%                 │
│                                     │
│ [View Detailed Report] →            │
└─────────────────────────────────────┘
```

### 9. **Real-time Status**
**Current**: Basic online/offline only  
**Needed**:
- ✅ Registration status (Registered/Unregistered)
- ✅ IP address & port
- ✅ User agent (phone model)
- ✅ Last registration time
- ✅ Registration expiry
- ✅ Network quality (jitter, packet loss)
- ✅ Current call status

**UI Example**:
```
┌─────────────────────────────────────┐
│ Real-time Status                    │
├─────────────────────────────────────┤
│ 🟢 Registered                        │
│ IP: 192.168.1.105:5060              │
│ Device: Yealink SIP-T46G            │
│ Registered: 2 hours ago             │
│ Expires: in 58 minutes              │
│                                     │
│ Network Quality:                    │
│ Jitter: 2ms  Loss: 0.1%  ✅ Good    │
│                                     │
│ Current Status: On Call (4:23)      │
│ Caller: +1555123456                 │
└─────────────────────────────────────┘
```

### 10. **Bulk Operations**
**Current**: One-by-one only  
**Needed**:
- ✅ Bulk import from CSV
- ✅ Bulk password reset
- ✅ Bulk feature enable/disable
- ✅ Export extension list
- ✅ Bulk delete with confirmation
- ✅ Apply templates to multiple extensions

**UI Example**:
```
┌─────────────────────────────────────┐
│ Bulk Actions                        │
├─────────────────────────────────────┤
│ Selected: 12 extensions             │
│                                     │
│ [Import CSV]  [Export CSV]          │
│ [Reset Passwords]                   │
│ [Enable Recording]                  │
│ [Disable Call Waiting]              │
│ [Add to Queue: Sales]               │
│ [Apply Template: Agent Profile]     │
│ [Delete Selected]                   │
└─────────────────────────────────────┘
```

## 🎯 Enhanced Table View

### Current Table Columns:
- Extension
- Display Name
- Context
- Codecs
- Status
- Actions

### **Proposed Enhanced Table**:
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Extension │ Name       │ Status  │ Features                │ Stats     │ Actions      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🟢 1001   │ John Doe   │ On Call │ 📧 🎙️ ➡️ 🚫             │ 23 calls  │ ✏️ 🔑 🗑️   │
│           │ Sales      │ 2:34    │ VM Rec Fwd DND          │ Avg: 4:23 │             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🟢 1002   │ Jane Smith │ Idle    │ 📧 ➡️                   │ 18 calls  │ ✏️ 🔑 🗑️   │
│           │ Support    │         │ VM Fwd                  │ Avg: 5:12 │             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔴 1003   │ Mike Jones │ Offline │ 📧 🎙️ 🚫               │ 0 calls   │ ✏️ 🔑 🗑️   │
│           │ Manager    │         │ VM Rec DND              │ Today     │             │
└────────────────────────────────────────────────────────────────────────────────────────┘

Legend:
📧 = Voicemail  🎙️ = Recording  ➡️ = Forwarding  🚫 = DND  
🟢 = Online  🟡 = Busy  🔴 = Offline
```

## 📋 Enhanced Modal Form

### Current Form: Single page with basic fields

### **Proposed Tabbed Form**:

#### Tab 1: Basic Settings
- Extension Number
- Password
- Display Name
- Department
- Email
- Context
- Max Contacts

#### Tab 2: Phone Settings
- Codecs
- DTMF Mode
- NAT Settings
- Encryption
- Video Support
- Fax Support

#### Tab 3: Call Features
- Voicemail (enable + config)
- Call Recording
- Call Waiting
- Call Transfer
- Three-way Calling
- Call Park

#### Tab 4: Call Forwarding
- Forward on Busy
- Forward on No Answer
- Forward Always
- Time-based Rules

#### Tab 5: Queue Membership
- Available Queues (checkbox list)
- Penalty per queue
- Wrapup time
- Max concurrent

#### Tab 6: Security
- International Calling
- Premium Rate Blocking
- IP Restrictions
- Max Call Duration
- Password Policy

## 🏗️ Implementation Priority

### Phase 1: Essential Features (High Priority)
1. ✅ Voicemail configuration
2. ✅ Call Forwarding (all types)
3. ✅ Queue membership management
4. ✅ Enhanced status display
5. ✅ Extension statistics

**Estimated Time**: 16-20 hours

### Phase 2: Advanced Features (Medium Priority)
1. ✅ Call Recording settings
2. ✅ DND configuration
3. ✅ Security restrictions
4. ✅ Real-time status details
5. ✅ Bulk operations

**Estimated Time**: 12-16 hours

### Phase 3: Professional Features (Nice to Have)
1. ✅ Hot desking
2. ✅ BLF configuration
3. ✅ Network quality monitoring
4. ✅ Extension templates
5. ✅ Advanced reporting

**Estimated Time**: 8-12 hours

## 🔌 Backend API Requirements

The backend needs to support these additional fields:

```typescript
// Backend Extension Model Enhancement
interface ExtensionConfig {
  // Existing
  id: string;
  display_name: string;
  context: string;
  codecs: string;
  max_contacts: number;
  
  // ADD: Voicemail
  voicemail_enabled: boolean;
  voicemail_box: string;
  voicemail_pin: string;
  voicemail_email: string;
  voicemail_attach: boolean;
  
  // ADD: Call Forwarding
  forward_busy: string | null;
  forward_no_answer: string | null;
  forward_always: string | null;
  no_answer_timeout: number;
  
  // ADD: Features
  call_recording: boolean;
  call_waiting: boolean;
  dnd_enabled: boolean;
  three_way_calling: boolean;
  call_transfer: boolean;
  
  // ADD: Security
  international_calling: boolean;
  premium_rate_block: boolean;
  max_call_duration: number;
  max_concurrent_calls: number;
  ip_whitelist: string[];
  
  // ADD: Queue Membership
  queue_memberships: QueueMembership[];
  
  // ADD: Statistics (read-only)
  calls_today: number;
  calls_this_week: number;
  avg_talk_time: number;
  total_talk_time: number;
  missed_calls: number;
  last_call_time: string;
  utilization_rate: number;
}

interface QueueMembership {
  queue_id: number;
  queue_name: string;
  penalty: number;
  paused: boolean;
  wrapup_time: number;
}
```

## 📊 Database Schema Changes Required

```sql
-- Add columns to ps_endpoints
ALTER TABLE ps_endpoints ADD COLUMN voicemail_box VARCHAR(50);
ALTER TABLE ps_endpoints ADD COLUMN voicemail_context VARCHAR(50);
ALTER TABLE ps_endpoints ADD COLUMN mailboxes VARCHAR(255);

-- Add call forwarding columns
ALTER TABLE ps_endpoints ADD COLUMN call_forward_busy VARCHAR(50);
ALTER TABLE ps_endpoints ADD COLUMN call_forward_no_answer VARCHAR(50);
ALTER TABLE ps_endpoints ADD COLUMN call_forward_always VARCHAR(50);
ALTER TABLE ps_endpoints ADD COLUMN no_answer_timeout INT DEFAULT 20;

-- Add feature flags
ALTER TABLE ps_endpoints ADD COLUMN call_recording BOOLEAN DEFAULT FALSE;
ALTER TABLE ps_endpoints ADD COLUMN call_waiting BOOLEAN DEFAULT TRUE;
ALTER TABLE ps_endpoints ADD COLUMN dnd_enabled BOOLEAN DEFAULT FALSE;

-- Create extension_config table for advanced settings
CREATE TABLE extension_config (
    endpoint_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    international_calling BOOLEAN DEFAULT FALSE,
    premium_rate_block BOOLEAN DEFAULT TRUE,
    max_call_duration INT DEFAULT 0,
    max_concurrent_calls INT DEFAULT 2,
    ip_whitelist TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (endpoint_id) REFERENCES ps_endpoints(id) ON DELETE CASCADE
);

-- Create extension_stats table (populated by CDR aggregation)
CREATE TABLE extension_stats (
    endpoint_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    calls_today INT DEFAULT 0,
    calls_this_week INT DEFAULT 0,
    calls_this_month INT DEFAULT 0,
    avg_talk_time INT DEFAULT 0,
    total_talk_time_today INT DEFAULT 0,
    missed_calls_today INT DEFAULT 0,
    last_call_time TIMESTAMP NULL,
    utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (endpoint_id) REFERENCES ps_endpoints(id) ON DELETE CASCADE
);
```

## 🎨 UI/UX Improvements

### Visual Indicators
- 🟢 Green dot = Online & Available
- 🟡 Yellow dot = Online & Busy (on call)
- 🔴 Red dot = Offline
- ⏸️ Pause icon = On Break/DND

### Feature Icons
- 📧 = Voicemail enabled
- 🎙️ = Recording enabled
- ➡️ = Call forwarding active
- 🚫 = DND enabled
- 👥 = In multiple queues
- 🔒 = Has restrictions

### Action Buttons
- ✏️ = Edit extension
- 🔑 = Reset password
- 📊 = View statistics
- 📞 = Test call
- 🗑️ = Delete

## 🚀 Quick Wins (Can Implement Immediately)

1. **Add Feature Icons to Table** - 2 hours
2. **Enhanced Status Display** - 2 hours
3. **Statistics Panel** - 4 hours
4. **Queue Membership View** - 4 hours
5. **Call Forwarding UI** - 6 hours

**Total Quick Wins**: 18 hours for significant improvement

---

## Summary

The current Extensions UI is a **basic management interface**. To make it production-ready for a call center, it needs:

1. ✅ **Voicemail management**
2. ✅ **Call forwarding** (busy/no answer/always)
3. ✅ **Queue membership** integration
4. ✅ **Call recording** configuration
5. ✅ **DND settings**
6. ✅ **Security restrictions**
7. ✅ **Real-time statistics**
8. ✅ **Enhanced status indicators**
9. ✅ **Bulk operations**
10. ✅ **Advanced call features**

**Estimated Total Effort**: 36-48 hours for complete call center-grade implementation

Would you like me to implement any specific feature first?
