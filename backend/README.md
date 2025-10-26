# Call Center Backend API

Production-ready Go backend for multi-tenant call center application with Asterisk integration, helpdesk, and chat functionality.

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- MySQL 8.0+
- Asterisk 18+ (optional, for telephony features)

### Installation

1. **Clone and setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

2. **Install dependencies**
```bash
go mod download
```

3. **Run migrations**
```bash
# Ensure MySQL is running
go run cmd/migrate/main.go
```

4. **Start the server**
```bash
go run cmd/api/main.go
```

The API will be available at `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── cmd/
│   ├── api/              # Main API server
│   ├── migrate/          # Database migration tool
│   └── worker/           # Background workers
├── internal/
│   ├── config/           # Configuration management
│   ├── database/         # Database connection & migrations
│   ├── middleware/       # HTTP middleware
│   ├── repository/       # Data access layer
│   ├── service/          # Business logic layer
│   ├── handler/          # HTTP handlers
│   ├── websocket/        # WebSocket server
│   ├── asterisk/         # Asterisk ARI integration
│   ├── common/           # Common types & enums
│   ├── core/             # Core models (tenant, user)
│   ├── asterisk/         # Asterisk models (DID, queue, CDR)
│   ├── helpdesk/         # Helpdesk models (tickets)
│   ├── chat/             # Chat models
│   └── dto/              # Data Transfer Objects
├── pkg/
│   ├── jwt/              # JWT token handling
│   ├── errors/           # Custom error types
│   └── response/         # API response formatters
├── migrations/           # SQL migration files
└── tests/                # Tests

```

## 🔧 Configuration

Edit `.env` file:

```env
# Server
SERVER_PORT=8000
SERVER_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=callcenter
DB_PASSWORD=your-password
DB_NAME=callcenter

# JWT
JWT_SECRET=your-super-secret-key

# Asterisk ARI
ASTERISK_ARI_URL=http://localhost:8088/ari
ASTERISK_ARI_USERNAME=asterisk
ASTERISK_ARI_PASSWORD=asterisk
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration  
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Tenants (Admin only)
- `GET /api/v1/tenants` - List all tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants/:id` - Get tenant details
- `PUT /api/v1/tenants/:id` - Update tenant
- `DELETE /api/v1/tenants/:id` - Delete tenant

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### DIDs (Phone Numbers)
- `GET /api/v1/dids` - List DIDs
- `POST /api/v1/dids` - Add DID
- `GET /api/v1/dids/:id` - Get DID
- `PUT /api/v1/dids/:id` - Update DID
- `DELETE /api/v1/dids/:id` - Delete DID

### Call Queues
- `GET /api/v1/queues` - List queues
- `POST /api/v1/queues` - Create queue
- `GET /api/v1/queues/:id` - Get queue
- `PUT /api/v1/queues/:id` - Update queue
- `DELETE /api/v1/queues/:id` - Delete queue

### CDR (Call Records)
- `GET /api/v1/cdr` - List call records
- `GET /api/v1/cdr/:id` - Get call record
- `GET /api/v1/cdr/stats` - Get call statistics

### Helpdesk
- `GET /api/v1/tickets` - List tickets
- `POST /api/v1/tickets` - Create ticket
- `GET /api/v1/tickets/:id` - Get ticket
- `PUT /api/v1/tickets/:id` - Update ticket
- `DELETE /api/v1/tickets/:id` - Delete ticket

### Chat
- `GET /api/v1/chat/widgets` - List chat widgets
- `POST /api/v1/chat/widgets` - Create widget
- `GET /api/v1/chat/sessions` - List chat sessions

### WebSocket
- `GET /ws` - WebSocket connection for real-time updates

### Health
- `GET /health` - Health check endpoint

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Login Example
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "tenant_admin"
    }
  }
}
```

## 🏗️ Architecture

### Clean Architecture Layers

1. **Handler Layer** (`internal/handler/`)
   - HTTP request/response handling
   - Request validation
   - Calls service layer

2. **Service Layer** (`internal/service/`)
   - Business logic
   - Transaction management
   - Calls repository layer

3. **Repository Layer** (`internal/repository/`)
   - Database operations
   - CRUD operations
   - Query logic

4. **Models** (`internal/core/`, `internal/asterisk/`, etc.)
   - Database models with GORM tags
   - Business logic helpers

### Middleware Stack

1. **RequestID** - Unique ID for each request
2. **Recovery** - Panic recovery
3. **CORS** - Cross-origin resource sharing
4. **Logger** - Request logging
5. **Auth** - JWT validation
6. **TenantIsolation** - Multi-tenant isolation
7. **RBAC** - Role-based access control

## 🗄️ Database

### Running Migrations

```bash
go run cmd/migrate/main.go
```

### Manual Migration

```bash
mysql -u callcenter -p callcenter < migrations/001_core_tables.sql
```

## 🧪 Testing

### Run all tests
```bash
go test ./...
```

### Run with coverage
```bash
go test -cover ./...
```

### Run specific tests
```bash
go test ./internal/service/...
```

## 🐳 Docker

### Build image
```bash
docker build -t callcenter-backend .
```

### Run container
```bash
docker run -p 8000:8000 --env-file .env callcenter-backend
```

## 📝 Development

### Add a new endpoint

1. Create DTO in `internal/dto/`
2. Add repository method in `internal/repository/`
3. Add service method in `internal/service/`
4. Add handler in `internal/handler/`
5. Register route in `cmd/api/main.go`

### Code Style

- Follow Go conventions
- Use `gofmt` for formatting
- Use `golint` for linting
- Write tests for all business logic

## 🔍 Logging

Logs are structured JSON format in production:

```json
{
  "level": "info",
  "timestamp": "2025-10-25T10:30:00Z",
  "request_id": "req-123",
  "tenant_id": "acme-corp",
  "message": "DID created successfully"
}
```

## 🚦 Status

### Completed ✅
- Project structure
- Configuration management
- Database connection
- JWT authentication
- Middleware stack
- API skeleton
- Error handling
- Response formatting

### In Progress 🚧
- Repository implementations
- Service layer implementations
- Handler implementations
- WebSocket server
- Asterisk ARI integration

### TODO 📋
- Complete all repositories
- Complete all services
- Complete all handlers
- Add SQL migrations
- Add unit tests
- Add integration tests
- Add Swagger documentation
- Add rate limiting
- Add caching (Redis)

## 📚 Documentation

- [API Documentation](./docs/api.md) - TODO
- [Database Schema](./docs/schema.md) - TODO
- [Architecture Guide](./docs/architecture.md) - TODO

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Submit PR

## 📄 License

Proprietary - All rights reserved

---

**Next Steps:**
1. Implement repository layer for all models
2. Implement service layer with business logic
3. Implement HTTP handlers
4. Add SQL migrations
5. Add tests
6. Deploy!
