# Quick Reference Guide

## Table of Contents
- [Model Categories](#model-categories)
- [Common Patterns](#common-patterns)
- [API Endpoints Blueprint](#api-endpoints-blueprint)
- [Database Tables](#database-tables)
- [Quick Examples](#quick-examples)

## Model Categories

### 🏢 Core Models
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Tenant` | Multi-tenant organization | ID, Name, Domain, Status, Features |
| `User` | User accounts | ID, Email, PasswordHash, Status |
| `UserRole` | RBAC assignments | UserID, TenantID, Role, Permissions |
| `Contact` | Contact management | FirstName, LastName, Email, Phone |
| `Tag` | Categorization | Name, Color |
| `AuditLog` | Audit trail | Action, EntityType, Changes |

### 📞 Asterisk/Telephony Models
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `DID` | Phone numbers | Number, RouteType, RouteTarget |
| `Queue` | Call queues | Name, Strategy, Timeout |
| `QueueMember` | Queue assignments | QueueName, Interface, Penalty |
| `CDR` | Call records | CallDate, Src, Dst, Duration, Disposition |
| `CallRecording` | Recording files | FilePath, Duration, Format |
| `AgentState` | Agent status | State, EndpointID, CurrentCallID |
| `SMSMessage` | SMS messages | Sender, Recipient, Body, Status |
| `Voicemail` | Voicemail messages | CallerID, Duration, FilePath |
| `PsEndpoint` | PJSIP endpoints | ID, Transport, Allow, Context |
| `PsAuth` | PJSIP auth | Username, Password, AuthType |
| `PsAor` | PJSIP AOR | MaxContacts, DefaultExpiration |
| `PsContact` | SIP registrations | URI, ExpirationTime, UserAgent |

### 🎫 Helpdesk Models
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Ticket` | Support tickets | TicketNumber, Subject, Status, Priority |
| `TicketMessage` | Ticket replies | Body, IsInternal, SenderName |
| `TicketAttachment` | File attachments | Filename, FilePath, MimeType |
| `TicketTemplate` | Ticket templates | Name, Subject, Description |
| `TicketSLA` | SLA rules | FirstResponseTime, ResolutionTime |

### 💬 Chat Models
| Model | Purpose | Key Fields |
|-------|---------|------------|
| `ChatWidget` | Widget config | WidgetKey, WelcomeMessage, Colors |
| `ChatSession` | Chat conversations | SessionKey, Status, VisitorName |
| `ChatMessage` | Chat messages | SenderType, Body, MessageType |
| `ChatTransfer` | Chat transfers | FromUserID, ToUserID, Reason |
| `ChatAgent` | Agent settings | IsAvailable, MaxConcurrentChats |

## Common Patterns

### Multi-Tenancy
Every tenant-scoped model includes:
```go
TenantID string `gorm:"column:tenant_id;type:varchar(64);not null;index" json:"tenant_id"`
```

### Timestamps
Standard timestamp pattern:
```go
CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"` // Optional
```

### Status Fields
Use enums for controlled values:
```go
Status common.UserStatus `gorm:"column:status;type:enum('active','inactive','suspended');default:active;index" json:"status"`
```

### Metadata Fields
Flexible JSON fields:
```go
Metadata common.JSONMap `gorm:"column:metadata;type:json" json:"metadata,omitempty"`
```

## API Endpoints Blueprint

### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/change-password
```

### Tenants
```
GET    /api/v1/tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PUT    /api/v1/tenants/:id
DELETE /api/v1/tenants/:id
GET    /api/v1/tenants/:id/stats
```

### Users
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/me
PUT    /api/v1/users/me
```

### Contacts
```
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
POST   /api/v1/contacts/import
GET    /api/v1/contacts/export
```

### DIDs (Phone Numbers)
```
GET    /api/v1/dids
POST   /api/v1/dids
GET    /api/v1/dids/:id
PUT    /api/v1/dids/:id
DELETE /api/v1/dids/:id
```

### Queues
```
GET    /api/v1/queues
POST   /api/v1/queues
GET    /api/v1/queues/:id
PUT    /api/v1/queues/:id
DELETE /api/v1/queues/:id
GET    /api/v1/queues/:id/members
POST   /api/v1/queues/:id/members
DELETE /api/v1/queues/:id/members/:memberid
GET    /api/v1/queues/:id/stats
```

### CDR (Call Records)
```
GET    /api/v1/cdr
GET    /api/v1/cdr/:id
GET    /api/v1/cdr/stats
GET    /api/v1/cdr/export
```

### Calls
```
POST   /api/v1/calls/originate
POST   /api/v1/calls/:id/hangup
POST   /api/v1/calls/:id/transfer
POST   /api/v1/calls/:id/hold
POST   /api/v1/calls/:id/record
GET    /api/v1/calls/active
```

### Agent State
```
GET    /api/v1/agents/state
PUT    /api/v1/agents/state
GET    /api/v1/agents/:id/state
PUT    /api/v1/agents/:id/state
```

### SMS
```
GET    /api/v1/sms
POST   /api/v1/sms
GET    /api/v1/sms/:id
```

### Voicemail
```
GET    /api/v1/voicemails
GET    /api/v1/voicemails/:id
PUT    /api/v1/voicemails/:id/read
DELETE /api/v1/voicemails/:id
GET    /api/v1/voicemails/:id/download
```

### Endpoints (SIP)
```
GET    /api/v1/endpoints
POST   /api/v1/endpoints
GET    /api/v1/endpoints/:id
PUT    /api/v1/endpoints/:id
DELETE /api/v1/endpoints/:id
GET    /api/v1/endpoints/:id/status
```

### Tickets
```
GET    /api/v1/tickets
POST   /api/v1/tickets
GET    /api/v1/tickets/:id
PUT    /api/v1/tickets/:id
DELETE /api/v1/tickets/:id
POST   /api/v1/tickets/:id/messages
GET    /api/v1/tickets/:id/messages
POST   /api/v1/tickets/:id/attachments
GET    /api/v1/tickets/:id/attachments/:attachmentid
GET    /api/v1/tickets/stats
```

### Chat Widgets
```
GET    /api/v1/chat/widgets
POST   /api/v1/chat/widgets
GET    /api/v1/chat/widgets/:id
PUT    /api/v1/chat/widgets/:id
DELETE /api/v1/chat/widgets/:id
GET    /api/v1/chat/widgets/:id/embed-code
```

### Chat Sessions
```
GET    /api/v1/chat/sessions
POST   /api/v1/chat/sessions
GET    /api/v1/chat/sessions/:id
PUT    /api/v1/chat/sessions/:id/end
POST   /api/v1/chat/sessions/:id/messages
GET    /api/v1/chat/sessions/:id/messages
POST   /api/v1/chat/sessions/:id/transfer
GET    /api/v1/chat/stats
```

### Chat Agents
```
GET    /api/v1/chat/agents
GET    /api/v1/chat/agents/:id
PUT    /api/v1/chat/agents/:id
GET    /api/v1/chat/agents/available
```

## Database Tables

### Core Tables
1. `tenants` - Organizations
2. `users` - User accounts
3. `user_roles` - Role assignments
4. `contacts` - Contact directory
5. `tags` - Tag definitions
6. `contact_tags` - Contact-tag relationships
7. `audit_logs` - Audit trail

### Asterisk Tables
8. `dids` - Phone numbers
9. `queues` - Call queues
10. `queue_members` - Queue membership
11. `cdr` - Call detail records
12. `call_recordings` - Recording files
13. `agent_states` - Agent status
14. `websocket_sessions` - WebSocket connections
15. `sms_messages` - SMS messages
16. `voicemails` - Voicemail messages
17. `ps_endpoints` - PJSIP endpoints (ARA)
18. `ps_auths` - PJSIP auth (ARA)
19. `ps_aors` - PJSIP AORs (ARA)
20. `ps_contacts` - PJSIP contacts (ARA)

### Helpdesk Tables
21. `tickets` - Support tickets
22. `ticket_messages` - Ticket replies
23. `ticket_attachments` - File attachments
24. `ticket_tags` - Ticket-tag relationships
25. `ticket_templates` - Ticket templates
26. `ticket_slas` - SLA configurations

### Chat Tables
27. `chat_widgets` - Widget configurations
28. `chat_sessions` - Chat conversations
29. `chat_messages` - Chat messages
30. `chat_transfers` - Chat transfers
31. `chat_agents` - Agent chat settings

## Quick Examples

### Creating a Tenant
```go
tenant := &core.Tenant{
    ID:       "acme-corp",
    Name:     "Acme Corporation",
    Status:   common.TenantStatusActive,
    MaxAgents: 50,
    MaxDIDs:  20,
    Features: common.TenantFeatures{
        WebRTC:    true,
        SMS:       true,
        Recording: true,
        Queue:     true,
        IVR:       true,
        Chat:      true,
        Helpdesk:  true,
    },
}
db.Create(&tenant)
```

### Creating a User with Role
```go
user := &core.User{
    Email:        "agent@acme.com",
    PasswordHash: hashedPassword,
    FirstName:    ptr("John"),
    LastName:     ptr("Doe"),
    Status:       common.UserStatusActive,
}
db.Create(&user)

role := &core.UserRole{
    UserID:     user.ID,
    TenantID:   "acme-corp",
    Role:       common.RoleAgent,
    EndpointID: ptr("acme-agent1"),
    Permissions: common.Permissions{
        CanMakeCalls:    true,
        CanReceiveCalls: true,
        CanSendSMS:      true,
    },
}
db.Create(&role)
```

### Creating a DID
```go
did := &asterisk.DID{
    TenantID:     "acme-corp",
    Number:       "+15551234567",
    CountryCode:  ptr("+1"),
    FriendlyName: ptr("Main Sales Line"),
    RouteType:    common.RouteTypeQueue,
    RouteTarget:  "sales",
    SMSEnabled:   true,
    Status:       common.DIDStatusActive,
}
db.Create(&did)
```

### Creating a Queue
```go
queue := &asterisk.Queue{
    TenantID:          "acme-corp",
    Name:              "sales",
    DisplayName:       "Sales Queue",
    Strategy:          "leastrecent",
    Timeout:           30,
    MaxWaitTime:       300,
    AnnounceHoldTime:  true,
    Status:            "active",
}
db.Create(&queue)
```

### Creating an Endpoint (WebRTC)
```go
// Auth
auth := &asterisk.PsAuth{
    ID:       "acme-agent1-auth",
    TenantID: "acme-corp",
    AuthType: ptr("userpass"),
    Username: ptr("acme-agent1"),
    Password: ptr("SecurePass123!"),
}
db.Create(&auth)

// AOR
aor := &asterisk.PsAor{
    ID:          "acme-agent1",
    TenantID:    "acme-corp",
    MaxContacts: ptr(2),
    RemoveExisting: ptr("yes"),
}
db.Create(&aor)

// Endpoint
endpoint := &asterisk.PsEndpoint{
    ID:              "acme-agent1",
    TenantID:        "acme-corp",
    DisplayName:     ptr("John Doe (Agent 1)"),
    Transport:       ptr("transport-wss"),
    Aors:            ptr("acme-agent1"),
    Auth:            ptr("acme-agent1-auth"),
    Context:         ptr("agents"),
    Disallow:        ptr("all"),
    Allow:           ptr("opus,ulaw,alaw"),
    DirectMedia:     ptr("no"),
    RtpSymmetric:    ptr("yes"),
    ForceRport:      ptr("yes"),
    RewriteContact:  ptr("yes"),
    IceSupport:      ptr("yes"),
    Webrtc:          ptr("yes"),
}
db.Create(&endpoint)
```

### Creating a Ticket
```go
ticket := &helpdesk.Ticket{
    TenantID:       "acme-corp",
    TicketNumber:   "ACME-00001",
    Subject:        "Cannot make outbound calls",
    Status:         common.TicketStatusOpen,
    Priority:       common.TicketPriorityHigh,
    Category:       ptr("Technical"),
    RequesterID:    5,
    RequesterName:  ptr("Jane Customer"),
    RequesterEmail: ptr("jane@customer.com"),
    AssignedToID:   ptr(int64(1)),
    Source:         "email",
}
db.Create(&ticket)
```

### Creating a Chat Widget
```go
widget := &chat.ChatWidget{
    TenantID:       "acme-corp",
    WidgetKey:      "wgt_" + generateRandomKey(),
    Name:           "Main Website Chat",
    IsEnabled:      true,
    PrimaryColor:   "#0084FF",
    SecondaryColor: "#FFFFFF",
    WidgetPosition: "bottom-right",
    WelcomeMessage: "Hi! How can we help you today?",
    RequireName:    true,
    AutoAssign:     true,
}
db.Create(&widget)
```

### Query Examples

#### Get active agents
```go
var agents []core.UserRole
db.Where("tenant_id = ? AND role = ?", tenantID, common.RoleAgent).
   Preload("User").
   Find(&agents)
```

#### Get today's CDRs
```go
var cdrs []asterisk.CDR
db.Where("tenant_id = ? AND DATE(calldate) = ?", tenantID, time.Now().Format("2006-01-02")).
   Order("calldate DESC").
   Find(&cdrs)
```

#### Get open tickets
```go
var tickets []helpdesk.Ticket
db.Where("tenant_id = ? AND status IN ?", tenantID, []string{"open", "in_progress"}).
   Order("priority DESC, created_at ASC").
   Find(&tickets)
```

#### Get active chat sessions
```go
var sessions []chat.ChatSession
db.Where("tenant_id = ? AND status = ?", tenantID, common.ChatSessionStatusActive).
   Preload("AssignedTo").
   Find(&sessions)
```

## Import in Your Project

```go
import (
    "github.com/yourusername/callcenter/backend-models/common"
    "github.com/yourusername/callcenter/backend-models/core"
    "github.com/yourusername/callcenter/backend-models/asterisk"
    "github.com/yourusername/callcenter/backend-models/helpdesk"
    "github.com/yourusername/callcenter/backend-models/chat"
    "github.com/yourusername/callcenter/backend-models/dto"
)
```

## Migration Command

```go
db.AutoMigrate(
    // Core
    &core.Tenant{},
    &core.User{},
    &core.UserRole{},
    &core.Contact{},
    &core.Tag{},
    &core.ContactTag{},
    &core.AuditLog{},
    
    // Asterisk
    &asterisk.DID{},
    &asterisk.Queue{},
    &asterisk.QueueMember{},
    &asterisk.CDR{},
    &asterisk.CallRecording{},
    &asterisk.AgentState{},
    &asterisk.WebSocketSession{},
    &asterisk.SMSMessage{},
    &asterisk.Voicemail{},
    &asterisk.PsEndpoint{},
    &asterisk.PsAuth{},
    &asterisk.PsAor{},
    &asterisk.PsContact{},
    
    // Helpdesk
    &helpdesk.Ticket{},
    &helpdesk.TicketMessage{},
    &helpdesk.TicketAttachment{},
    &helpdesk.TicketTag{},
    &helpdesk.TicketTemplate{},
    &helpdesk.TicketSLA{},
    
    // Chat
    &chat.ChatWidget{},
    &chat.ChatSession{},
    &chat.ChatMessage{},
    &chat.ChatTransfer{},
    &chat.ChatAgent{},
)
```

## Helper Function

```go
func ptr[T any](v T) *T {
    return &v
}
```

---

**Next Steps:**
1. Copy models to your Go backend
2. Run `go mod tidy`
3. Run database migrations
4. Implement repository layer
5. Implement service layer
6. Create API handlers using DTOs
7. Generate Swagger documentation
