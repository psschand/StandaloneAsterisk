# Data Models Architecture Alignment

## Overview

This document shows how the Go models align with:
1. **Database Schema** (MySQL tables created earlier)
2. **API Responses** (DTOs for consistent API contracts)
3. **Backend Services** (Repository and service layers)

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                   TypeScript Interfaces                  │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 API Layer (DTOs)                         │
│  Request/Response Objects with Validation                │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)              │
│         Tenant isolation, RBAC, Business rules           │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│           Repository Layer (Data Access)                 │
│              CRUD operations with GORM                   │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│            Database Models (GORM Structs)                │
│         Direct mapping to database tables                │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 MySQL Database                           │
│              callcenter.* tables                         │
└─────────────────────────────────────────────────────────┘
```

## Model-to-Table Mapping

### Core Models ↔ Database Tables

| Go Model | Database Table | MySQL Schema Path |
|----------|----------------|-------------------|
| `core.Tenant` | `tenants` | `03-multi-tenant-schema.sql` |
| `core.User` | `users` | `03-multi-tenant-schema.sql` |
| `core.UserRole` | `user_roles` | `03-multi-tenant-schema.sql` |
| `core.Contact` | `contacts` | New table needed |
| `core.Tag` | `tags` | New table needed |
| `core.ContactTag` | `contact_tags` | New table needed |
| `core.AuditLog` | `audit_logs` | New table needed |

### Asterisk Models ↔ Database Tables

| Go Model | Database Table | MySQL Schema Path |
|----------|----------------|-------------------|
| `asterisk.DID` | `dids` | `03-multi-tenant-schema.sql` |
| `asterisk.Queue` | `queues` | `03-multi-tenant-schema.sql` |
| `asterisk.QueueMember` | `queue_members` | `01-asterisk-realtime.sql` |
| `asterisk.CDR` | `cdr` | `03-multi-tenant-schema.sql` |
| `asterisk.CallRecording` | `call_recordings` | `03-multi-tenant-schema.sql` |
| `asterisk.AgentState` | `agent_states` | `03-multi-tenant-schema.sql` |
| `asterisk.WebSocketSession` | `websocket_sessions` | `03-multi-tenant-schema.sql` |
| `asterisk.SMSMessage` | `sms_messages` | `03-multi-tenant-schema.sql` |
| `asterisk.Voicemail` | `voicemails` | New table needed |
| `asterisk.PsEndpoint` | `ps_endpoints` | `01-asterisk-realtime.sql` + `03-multi-tenant-schema.sql` |
| `asterisk.PsAuth` | `ps_auths` | `01-asterisk-realtime.sql` + `03-multi-tenant-schema.sql` |
| `asterisk.PsAor` | `ps_aors` | `01-asterisk-realtime.sql` + `03-multi-tenant-schema.sql` |
| `asterisk.PsContact` | `ps_contacts` | `01-asterisk-realtime.sql` + `03-multi-tenant-schema.sql` |

### Helpdesk Models ↔ Database Tables

| Go Model | Database Table | Status |
|----------|----------------|--------|
| `helpdesk.Ticket` | `tickets` | ⚠️ New table needed |
| `helpdesk.TicketMessage` | `ticket_messages` | ⚠️ New table needed |
| `helpdesk.TicketAttachment` | `ticket_attachments` | ⚠️ New table needed |
| `helpdesk.TicketTag` | `ticket_tags` | ⚠️ New table needed |
| `helpdesk.TicketTemplate` | `ticket_templates` | ⚠️ New table needed |
| `helpdesk.TicketSLA` | `ticket_slas` | ⚠️ New table needed |

### Chat Models ↔ Database Tables

| Go Model | Database Table | Status |
|----------|----------------|--------|
| `chat.ChatWidget` | `chat_widgets` | ⚠️ New table needed |
| `chat.ChatSession` | `chat_sessions` | ⚠️ New table needed |
| `chat.ChatMessage` | `chat_messages` | ⚠️ New table needed |
| `chat.ChatTransfer` | `chat_transfers` | ⚠️ New table needed |
| `chat.ChatAgent` | `chat_agents` | ⚠️ New table needed |

## API ↔ DTO Mapping

### Example: User Management Flow

```
HTTP Request (JSON)
    ↓
CreateUserRequest DTO (validation)
    ↓
UserService.CreateUser() (business logic)
    ↓
UserRepository.Create() (data access)
    ↓
User Model (GORM)
    ↓
MySQL users table
    ↓
User Model (GORM read)
    ↓
UserResponse DTO (transform)
    ↓
HTTP Response (JSON)
```

### DTOs by Feature

#### Authentication
```
Request:  LoginRequest → Service
Response: LoginResponse ← Service
Models:   User, UserRole, Tenant
```

#### Tenant Management
```
Request:  CreateTenantRequest → Service
Response: TenantResponse ← Service
Models:   Tenant
```

#### Phone Numbers (DIDs)
```
Request:  CreateDIDRequest → Service
Response: DIDResponse ← Service
Models:   DID, Tenant
```

#### Call Queues
```
Request:  CreateQueueRequest, AddQueueMemberRequest → Service
Response: QueueResponse, QueueMemberResponse ← Service
Models:   Queue, QueueMember, Tenant
```

#### Call Detail Records
```
Request:  CDRFilterRequest → Service
Response: CDRResponse, CDRStatsResponse ← Service
Models:   CDR, DID, User, Queue, Tenant
```

#### Tickets
```
Request:  CreateTicketRequest, AddTicketMessageRequest → Service
Response: TicketResponse, TicketMessageResponse ← Service
Models:   Ticket, TicketMessage, TicketAttachment, User, Tenant
```

#### Chat
```
Request:  CreateChatWidgetRequest, StartChatSessionRequest, SendChatMessageRequest → Service
Response: ChatWidgetResponse, ChatSessionResponse, ChatMessageResponse ← Service
Models:   ChatWidget, ChatSession, ChatMessage, ChatAgent, User, Tenant
```

## Repository Pattern

Each model should have a repository interface:

```go
// Example: User Repository
type UserRepository interface {
    Create(user *User) error
    FindByID(id int64) (*User, error)
    FindByEmail(email string) (*User, error)
    Update(user *User) error
    Delete(id int64) error
    List(tenantID string, filter UserFilter, pagination Pagination) ([]User, int64, error)
}

// Implementation
type userRepositoryImpl struct {
    db *gorm.DB
}

func (r *userRepositoryImpl) Create(user *User) error {
    return r.db.Create(user).Error
}

func (r *userRepositoryImpl) FindByID(id int64) (*User, error) {
    var user User
    err := r.db.Preload("Roles").First(&user, id).Error
    return &user, err
}
```

## Service Pattern

Each feature should have a service:

```go
// Example: User Service
type UserService interface {
    CreateUser(tenantID string, req dto.CreateUserRequest) (*dto.UserResponse, error)
    GetUser(tenantID string, userID int64) (*dto.UserResponse, error)
    UpdateUser(tenantID string, userID int64, req dto.UpdateUserRequest) (*dto.UserResponse, error)
    DeleteUser(tenantID string, userID int64) error
    ListUsers(tenantID string, filter dto.UserFilter) (*dto.ListResponse, error)
}

// Implementation
type userServiceImpl struct {
    userRepo UserRepository
    roleRepo UserRoleRepository
}

func (s *userServiceImpl) CreateUser(tenantID string, req dto.CreateUserRequest) (*dto.UserResponse, error) {
    // Validate tenant exists
    // Hash password
    // Create user
    // Create default role
    // Return DTO
}
```

## Middleware Stack

### 1. Authentication Middleware
```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := extractToken(c)
        claims, err := validateJWT(token)
        if err != nil {
            c.AbortWithStatus(401)
            return
        }
        c.Set("userID", claims.UserID)
        c.Set("tenantID", claims.TenantID)
        c.Next()
    }
}
```

### 2. Tenant Isolation Middleware
```go
func TenantMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := c.GetString("tenantID")
        // Inject tenant ID into all database queries
        c.Set("db", db.Where("tenant_id = ?", tenantID))
        c.Next()
    }
}
```

### 3. RBAC Middleware
```go
func RequirePermission(permission string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetInt64("userID")
        tenantID := c.GetString("tenantID")
        
        // Check if user has permission in this tenant
        hasPermission := checkUserPermission(userID, tenantID, permission)
        if !hasPermission {
            c.AbortWithStatus(403)
            return
        }
        c.Next()
    }
}
```

## Example API Handler

```go
// @Summary Create DID
// @Description Create a new phone number
// @Tags dids
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateDIDRequest true "DID data"
// @Success 201 {object} dto.DIDResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Router /api/v1/dids [post]
func CreateDID(service *DIDService) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get tenant ID from context (injected by middleware)
        tenantID := c.GetString("tenantID")
        
        // Parse and validate request
        var req dto.CreateDIDRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(400, dto.ErrorResponse{Error: "Invalid request", Message: err.Error()})
            return
        }
        
        // Call service layer
        did, err := service.CreateDID(tenantID, req)
        if err != nil {
            c.JSON(500, dto.ErrorResponse{Error: "Failed to create DID", Message: err.Error()})
            return
        }
        
        // Return DTO response
        c.JSON(201, did)
    }
}
```

## Integration Points

### With Asterisk
```
Asterisk ARA → MySQL → GORM Models
├── ps_endpoints → PsEndpoint
├── ps_auths → PsAuth
├── ps_aors → PsAor
└── ps_contacts → PsContact

Asterisk CDR → MySQL → GORM Models
└── cdr → CDR

Backend → Asterisk ARI → WebSocket Events
└── AgentState, WebSocketSession
```

### With Frontend
```
Frontend → HTTP API → DTOs → Services → Models → Database
Frontend ← HTTP API ← DTOs ← Services ← Models ← Database

WebSocket Events
├── Call events
├── Chat messages
├── Agent state changes
└── Ticket updates
```

### With Traefik
```
Traefik Reverse Proxy
├── /api/v1/* → Backend API
├── /ws/* → WebSocket Server
├── /chat/* → Chat Server
└── /* → Frontend (Next.js)
```

## Security Considerations

### 1. Tenant Isolation
Every query MUST include tenant_id:
```go
db.Where("tenant_id = ?", tenantID).Find(&results)
```

### 2. RBAC Checks
Before sensitive operations:
```go
if !user.HasPermission("manage_dids") {
    return errors.New("permission denied")
}
```

### 3. Input Validation
All DTOs have validation tags:
```go
type CreateDIDRequest struct {
    Number string `json:"number" binding:"required,e164"` // E.164 format
}
```

### 4. Password Security
```go
func HashPassword(password string) string {
    hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(hash)
}
```

## Testing Strategy

### 1. Model Tests
```go
func TestTenant_IsActive(t *testing.T) {
    tenant := Tenant{Status: TenantStatusActive}
    assert.True(t, tenant.IsActive())
}
```

### 2. Repository Tests
```go
func TestUserRepository_Create(t *testing.T) {
    db := setupTestDB()
    repo := NewUserRepository(db)
    
    user := &User{Email: "test@example.com"}
    err := repo.Create(user)
    
    assert.NoError(t, err)
    assert.NotZero(t, user.ID)
}
```

### 3. Service Tests
```go
func TestUserService_CreateUser(t *testing.T) {
    mockRepo := new(MockUserRepository)
    service := NewUserService(mockRepo)
    
    req := dto.CreateUserRequest{Email: "test@example.com"}
    resp, err := service.CreateUser("tenant1", req)
    
    assert.NoError(t, err)
    assert.NotNil(t, resp)
}
```

### 4. API Tests
```go
func TestCreateDID_Success(t *testing.T) {
    router := setupTestRouter()
    
    req := dto.CreateDIDRequest{Number: "+15551234567"}
    w := performRequest(router, "POST", "/api/v1/dids", req)
    
    assert.Equal(t, 201, w.Code)
}
```

## Performance Optimization

### 1. Database Indexing
Already defined in models:
```go
`gorm:"index:idx_tenant_id"` // Single-column index
`gorm:"uniqueIndex:idx_tenant_endpoint"` // Composite unique index
```

### 2. Query Optimization
Use Preload for relationships:
```go
db.Preload("Tenant").Preload("User").Find(&cdrs)
```

### 3. Pagination
Always paginate list endpoints:
```go
db.Offset((page - 1) * pageSize).Limit(pageSize).Find(&results)
```

### 4. Caching
Cache frequently accessed data:
```go
// Redis cache for agent states
cache.Set("agent:state:"+agentID, state, 30*time.Second)
```

## Deployment Checklist

- [ ] Run database migrations
- [ ] Seed initial data (default tenant, admin user)
- [ ] Configure environment variables
- [ ] Set up JWT secret
- [ ] Configure database connection pool
- [ ] Set up Traefik routing
- [ ] Configure CORS
- [ ] Set up logging
- [ ] Configure rate limiting
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure backup strategy
- [ ] Test multi-tenancy isolation
- [ ] Test RBAC permissions
- [ ] Load test API endpoints

## Next Implementation Steps

1. **Complete SQL Migrations** for missing tables (helpdesk, chat)
2. **Implement Repository Layer** for all models
3. **Implement Service Layer** with business logic
4. **Create API Handlers** using DTOs
5. **Generate Swagger Documentation** with swag
6. **Implement Middleware** (auth, tenant, RBAC)
7. **Set up WebSocket Server** for real-time features
8. **Integrate with Asterisk ARI** for call control
9. **Implement Chat Server** with socket.io or similar
10. **Create Frontend TypeScript Types** from DTOs

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Type safety throughout the stack
- ✅ Multi-tenant isolation
- ✅ RBAC enforcement
- ✅ Testability at every layer
- ✅ Scalability and maintainability
