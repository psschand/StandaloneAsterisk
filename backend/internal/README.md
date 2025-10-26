# Backend Data Models

This directory contains the complete data models for the multi-tenant SIP calling web application with integrated helpdesk and chat functionality.

## Architecture Overview

The application follows a multi-tenant architecture with role-based access control (RBAC) and supports:
- **VoIP**: Asterisk Realtime Architecture (ARA) for SIP calling
- **Helpdesk**: Ticket management system
- **Chat**: Real-time chat with embeddable widget
- **Multi-tenancy**: Complete tenant isolation

## Directory Structure

```
backend-models/
├── core/           # Core business entities (Tenant, User, UserRole, Contact)
├── asterisk/       # Asterisk ARA models (DID, Queue, CDR, AgentState, SMS, Voicemail)
├── helpdesk/       # Helpdesk models (Ticket, TicketMessage, TicketAttachment)
├── chat/           # Chat models (ChatSession, ChatMessage, ChatWidget, ChatTransfer)
├── dto/            # API Data Transfer Objects (Request/Response structures)
├── common/         # Common types and enums
└── migrations/     # SQL migration files
```

## Design Principles

1. **Multi-Tenancy First**: Every table includes `tenant_id` for complete isolation
2. **RBAC**: Role-based permissions (superadmin, tenant_admin, supervisor, agent, viewer)
3. **ARA Compatibility**: Asterisk realtime tables follow official ARA schema
4. **API-First**: Clean DTOs separate from database models
5. **Audit Trail**: CreatedAt/UpdatedAt timestamps on all models
6. **Soft Deletes**: Where applicable (tickets, users)
7. **JSON Metadata**: Flexible metadata fields for extensibility

## Technology Stack

- **Backend**: Go with GORM ORM
- **Database**: MySQL 8.0+
- **API**: RESTful with Swagger documentation
- **Real-time**: WebSockets for chat and events
- **Proxy**: Traefik for routing

## Database Conventions

- Primary Keys: `id` (BIGINT AUTO_INCREMENT or VARCHAR for UUIDs)
- Foreign Keys: `<table>_id` (e.g., `tenant_id`, `user_id`)
- Timestamps: `created_at`, `updated_at` (TIMESTAMP)
- Status Fields: ENUM types for controlled values
- JSON Fields: For flexible metadata
- Indexes: On foreign keys, status fields, and frequently queried columns

## Getting Started

1. Review the models in each subdirectory
2. Check the DTO layer for API contracts
3. Run migrations from `migrations/` directory
4. Import models in your Go backend

## Notes

- Models include GORM tags for Go
- SQL migrations are MySQL-compatible
- Swagger annotations included for API docs
- All models support JSON serialization
