# Agent Transfer & Queue System Implementation

## Overview
Implementing agent-to-agent transfer and queue management for the chat system.

## Features to Implement

### 1. Agent Transfer
- **Transfer to specific agent**: Agent A → Agent B
- **Transfer to team/queue**: Agent A → Support Queue
- **Transfer with notes**: Include context for receiving agent
- **Real-time notifications**: Both agents notified instantly
- **Transfer history**: Track all transfers in chat_transfers table

### 2. Queue System
- **Auto-queue new chats**: Unassigned chats go to queue
- **Queue visibility**: Agents see pending chats
- **Manual assignment**: Agent picks from queue
- **Auto-assignment**: Distribute by workload/availability
- **Queue metrics**: Wait time, position, SLA tracking

## Database Schema

### Existing: `chat_transfers` table
```sql
CREATE TABLE chat_transfers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  from_agent_id BIGINT,
  to_agent_id BIGINT,
  transfer_type ENUM('agent', 'team', 'queue'),
  reason TEXT,
  notes TEXT,
  transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(session_id),
  INDEX(from_agent_id),
  INDEX(to_agent_id)
);
```

### New: `chat_queues` table
```sql
CREATE TABLE chat_queues (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  priority INT DEFAULT 0,
  max_wait_time INT DEFAULT 300, -- seconds
  auto_assign BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY(tenant_id, name)
);
```

## API Endpoints

### Transfer Endpoints
```
POST /api/v1/chat/sessions/:id/transfer
{
  "to_agent_id": 5,
  "transfer_type": "agent",
  "notes": "Customer needs billing help"
}

POST /api/v1/chat/sessions/:id/transfer-to-queue
{
  "queue_id": 2,
  "reason": "Escalation to supervisor"
}
```

### Queue Endpoints
```
GET /api/v1/chat/queues
- List all queues for tenant

GET /api/v1/chat/queues/:id/sessions
- Get sessions in specific queue

POST /api/v1/chat/sessions/:id/assign
{
  "agent_id": 3
}
- Assign queue session to agent

GET /api/v1/chat/my-queue
- Get sessions assigned to current agent
```

## Implementation Steps

1. ✅ Create chat_transfers model (exists)
2. ⏳ Create TransferSession handler
3. ⏳ Add WebSocket notifications for transfers
4. ⏳ Create queue management service
5. ⏳ Add queue UI in frontend
6. ⏳ Implement auto-assignment logic

## Status
- AI Service: Data model fixed, needs Gemini API debugging
- Transfer System: Ready to implement
- Queue System: Ready to implement
