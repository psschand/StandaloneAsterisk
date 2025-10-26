# Implementation Plan: Backend + Frontend

## Overview
Building a production-ready multi-tenant call center application with:
- **Backend**: Go REST API with clean architecture
- **Frontend**: Next.js 14+ with App Router
- **Real-time**: WebSocket server for chat & notifications
- **Database**: MySQL 8.0+ (already configured)
- **Asterisk**: ARA integration (already configured)

---

## Phase 1: Backend Implementation (Go)

### Project Structure
```
backend/
├── cmd/
│   ├── api/              # Main API server
│   │   └── main.go
│   ├── migrate/          # Database migration tool
│   │   └── main.go
│   └── worker/           # Background jobs
│       └── main.go
├── internal/
│   ├── config/           # Configuration management
│   ├── database/         # Database connection & migrations
│   ├── middleware/       # HTTP middleware (auth, tenant, RBAC)
│   ├── repository/       # Data access layer (interfaces + implementations)
│   ├── service/          # Business logic layer
│   ├── handler/          # HTTP handlers (controllers)
│   ├── websocket/        # WebSocket server for real-time
│   ├── asterisk/         # Asterisk ARI integration
│   └── utils/            # Helper functions
├── pkg/                  # Public packages
│   ├── jwt/              # JWT token handling
│   ├── validator/        # Request validation
│   ├── errors/           # Custom error types
│   └── response/         # API response formatters
├── migrations/           # SQL migration files
├── tests/                # Integration & unit tests
├── go.mod
├── go.sum
├── .env.example
└── Dockerfile
```

### Backend Components to Build

#### 1. Configuration (internal/config/)
- ✅ Load from .env
- ✅ Database connection settings
- ✅ JWT secret
- ✅ Asterisk ARI settings
- ✅ Server port & CORS

#### 2. Database Setup (internal/database/)
- ✅ GORM connection
- ✅ Connection pooling
- ✅ Health checks
- ✅ Migration runner

#### 3. Middleware (internal/middleware/)
- ✅ Authentication (JWT validation)
- ✅ Tenant isolation (extract tenant_id)
- ✅ RBAC (role-based access control)
- ✅ Request logging
- ✅ Rate limiting
- ✅ CORS
- ✅ Error recovery

#### 4. Repository Layer (internal/repository/)
For each model domain:
- ✅ Interface definitions
- ✅ GORM implementations
- ✅ CRUD operations
- ✅ Complex queries
- ✅ Transaction support

Repositories needed:
- TenantRepository
- UserRepository
- RoleRepository
- DIDRepository
- QueueRepository
- EndpointRepository
- CDRRepository
- AgentStateRepository
- TicketRepository
- ChatWidgetRepository
- ChatSessionRepository

#### 5. Service Layer (internal/service/)
Business logic for:
- ✅ Authentication (login, register, refresh token)
- ✅ Tenant management
- ✅ User management
- ✅ DID management
- ✅ Queue management
- ✅ Endpoint management
- ✅ Call management
- ✅ Ticket management
- ✅ Chat management
- ✅ Analytics & reporting

#### 6. HTTP Handlers (internal/handler/)
REST endpoints:
- ✅ /api/v1/auth/* (login, register, refresh, logout)
- ✅ /api/v1/tenants/* (CRUD)
- ✅ /api/v1/users/* (CRUD)
- ✅ /api/v1/dids/* (CRUD)
- ✅ /api/v1/queues/* (CRUD)
- ✅ /api/v1/endpoints/* (CRUD)
- ✅ /api/v1/cdr/* (list, filter, stats)
- ✅ /api/v1/tickets/* (CRUD)
- ✅ /api/v1/chat/* (CRUD)
- ✅ /api/v1/analytics/* (reports)

#### 7. WebSocket Server (internal/websocket/)
- ✅ Connection management
- ✅ Room/channel management
- ✅ Agent presence
- ✅ Chat messages
- ✅ Typing indicators
- ✅ Call notifications

#### 8. Asterisk Integration (internal/asterisk/)
- ✅ ARI client setup
- ✅ Call origination
- ✅ Call control (hangup, transfer, hold)
- ✅ Event listeners (call events)
- ✅ Queue metrics

#### 9. Migrations (migrations/)
SQL files for:
- ✅ 001_core_tables.sql (tenants, users, roles)
- ✅ 002_asterisk_tables.sql (DIDs, queues, endpoints)
- ✅ 003_helpdesk_tables.sql (tickets, messages)
- ✅ 004_chat_tables.sql (widgets, sessions, messages)
- ✅ 005_indexes.sql (performance indexes)

---

## Phase 2: Frontend Implementation (Next.js)

### Project Structure
```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 14+)
│   │   ├── (auth)/            # Auth layout group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Dashboard layout group
│   │   │   ├── layout.tsx     # Shared dashboard layout
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── tenants/       # Tenant management
│   │   │   ├── users/         # User management
│   │   │   ├── dids/          # DID management
│   │   │   ├── queues/        # Queue management
│   │   │   ├── endpoints/     # Endpoint management
│   │   │   ├── cdr/           # Call reports
│   │   │   ├── tickets/       # Helpdesk
│   │   │   ├── chat/          # Chat dashboard
│   │   │   └── settings/      # Settings
│   │   ├── api/               # API routes (proxy to backend)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── tables/           # Data tables
│   │   ├── charts/           # Analytics charts
│   │   ├── chat/             # Chat components
│   │   └── shared/           # Shared components
│   ├── lib/                   # Utilities
│   │   ├── api/              # API client
│   │   ├── auth/             # Auth helpers
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utility functions
│   │   └── validators/       # Form validation
│   ├── types/                 # TypeScript types
│   │   └── api.ts            # API response types
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── TenantContext.tsx
│   │   └── WebSocketContext.tsx
│   └── styles/                # Global styles
│       └── globals.css
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local
```

### Frontend Components to Build

#### 1. Authentication
- ✅ Login page
- ✅ Register page
- ✅ Forgot password
- ✅ Auth context provider
- ✅ Protected routes

#### 2. Dashboard Layout
- ✅ Sidebar navigation
- ✅ Top navbar
- ✅ Breadcrumbs
- ✅ User menu
- ✅ Notifications

#### 3. Tenant Management
- ✅ Tenant list with pagination
- ✅ Create tenant modal
- ✅ Edit tenant form
- ✅ Resource limits config
- ✅ Feature flags toggles

#### 4. User Management
- ✅ User list with filters
- ✅ Create user form
- ✅ Edit user form
- ✅ Role assignment
- ✅ User status toggle

#### 5. DID Management
- ✅ DID list
- ✅ Add DID form
- ✅ Routing configuration
- ✅ SMS settings

#### 6. Queue Management
- ✅ Queue list
- ✅ Queue configuration form
- ✅ Member management
- ✅ Real-time queue stats

#### 7. Endpoint Management
- ✅ Endpoint list
- ✅ Create endpoint wizard
- ✅ PJSIP configuration
- ✅ Registration status

#### 8. Call Reports (CDR)
- ✅ CDR list with advanced filters
- ✅ Date range picker
- ✅ Export to CSV
- ✅ Call statistics charts
- ✅ Recording playback

#### 9. Helpdesk
- ✅ Ticket list with filters
- ✅ Create ticket form
- ✅ Ticket detail view
- ✅ Message thread
- ✅ File attachments
- ✅ Status/priority selectors

#### 10. Chat Dashboard
- ✅ Active chats list
- ✅ Chat conversation view
- ✅ Message input with file upload
- ✅ Transfer modal
- ✅ Chat history
- ✅ Widget configuration

#### 11. Analytics & Reports
- ✅ Dashboard with KPIs
- ✅ Call volume charts
- ✅ Agent performance
- ✅ Ticket metrics
- ✅ Chat metrics

---

## Phase 3: Integration & Deployment

### 1. Docker Compose Updates
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql://...
      - JWT_SECRET=...
    depends_on:
      - mysql
      - asterisk
    networks:
      - call-center-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - NEXT_PUBLIC_WS_URL=ws://backend:8000/ws
    depends_on:
      - backend
    networks:
      - call-center-network

  # ... existing services (asterisk, mysql, adminer)
```

### 2. Nginx/Caddy Reverse Proxy
- Frontend: https://yourdomain.com
- Backend API: https://yourdomain.com/api
- WebSocket: wss://yourdomain.com/ws
- Asterisk ARI: http://asterisk:8088 (internal only)

### 3. Testing Strategy
- Unit tests (Go: testify, Frontend: Jest)
- Integration tests (API endpoints)
- E2E tests (Playwright)
- Load testing (k6)

---

## Timeline Estimate

### Backend (Go) - 2-3 weeks
- Week 1: Core setup, database, repositories, middleware
- Week 2: Services, handlers, WebSocket
- Week 3: Asterisk integration, testing, documentation

### Frontend (Next.js) - 2-3 weeks
- Week 1: Setup, auth, layout, tenant/user management
- Week 2: DID/queue/endpoint management, CDR
- Week 3: Helpdesk, chat, analytics, polish

### Integration & Testing - 1 week
- Docker compose setup
- E2E testing
- Documentation
- Deployment scripts

**Total: 5-7 weeks for full implementation**

---

## Development Order (Recommended)

### Sprint 1: Foundation (Week 1)
1. ✅ Backend project setup
2. ✅ Database connection & migrations
3. ✅ Auth middleware & JWT
4. ✅ Frontend project setup
5. ✅ API client library
6. ✅ Auth pages (login/register)

### Sprint 2: Core Features (Week 2)
1. ✅ Tenant management (backend + frontend)
2. ✅ User management (backend + frontend)
3. ✅ Dashboard layout
4. ✅ RBAC implementation

### Sprint 3: Telephony (Week 3)
1. ✅ DID management
2. ✅ Queue management
3. ✅ Endpoint management
4. ✅ CDR & reporting
5. ✅ Asterisk ARI integration

### Sprint 4: Helpdesk (Week 4)
1. ✅ Ticket CRUD
2. ✅ Message threading
3. ✅ File attachments
4. ✅ SLA monitoring

### Sprint 5: Chat (Week 5)
1. ✅ Widget configuration
2. ✅ WebSocket server
3. ✅ Chat interface
4. ✅ Agent dashboard
5. ✅ Chat analytics

### Sprint 6: Polish & Testing (Week 6-7)
1. ✅ E2E tests
2. ✅ Performance optimization
3. ✅ Documentation
4. ✅ Deployment
5. ✅ Monitoring setup

---

## Technology Stack Summary

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin (HTTP) + Gorilla WebSocket
- **ORM**: GORM
- **Database**: MySQL 8.0+
- **Auth**: JWT (golang-jwt/jwt)
- **Validation**: go-playground/validator
- **Testing**: testify, sqlmock

### Frontend
- **Framework**: Next.js 14+ (App Router, React 18)
- **Language**: TypeScript 5+
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React Context + Zustand (for complex state)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts or Chart.js
- **WebSocket**: native WebSocket API
- **Testing**: Jest + React Testing Library + Playwright

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Caddy (as noted in docker-compose.yml)
- **VoIP**: Asterisk 18+ with ARA
- **Database**: MySQL 8.0+
- **Monitoring**: Prometheus + Grafana (optional)
- **Logging**: Loki + Promtail (optional)

---

## Best Practices for Easy Debugging

### 1. Structured Logging
```go
// Use structured logging with fields
log.WithFields(log.Fields{
    "tenant_id": tenantID,
    "user_id": userID,
    "action": "create_did",
}).Info("DID created successfully")
```

### 2. Error Wrapping
```go
// Wrap errors with context
if err != nil {
    return fmt.Errorf("failed to create DID: %w", err)
}
```

### 3. Request Tracing
- Generate request ID for each API call
- Pass through all layers
- Log in every function

### 4. Database Query Logging
```go
// Enable GORM logging in development
db.Logger = logger.Default.LogMode(logger.Info)
```

### 5. API Response Standards
```json
{
  "success": true,
  "data": {...},
  "meta": {
    "request_id": "req-123",
    "timestamp": "2025-10-25T10:30:00Z"
  }
}
```

### 6. TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Ready to Start?

I'm ready to create:
1. ✅ Complete backend with all repositories, services, handlers
2. ✅ Complete frontend with all pages and components
3. ✅ SQL migrations
4. ✅ Docker configuration
5. ✅ Testing setup
6. ✅ Documentation

**Which part would you like me to start with?**

Options:
- **A) Backend first** (recommended - build API, then consume it)
- **B) Frontend first** (UI/UX focused)
- **C) Both simultaneously** (parallel development)
- **D) Specific feature** (e.g., just auth + tenant management)

Let me know your preference, and I'll begin implementation! 🚀
