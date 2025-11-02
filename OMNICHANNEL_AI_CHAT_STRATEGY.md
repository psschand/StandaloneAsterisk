# Omnichannel Chat & AI Agent Implementation Strategy

## Overview

Your call center will have an **intelligent omnichannel communication hub** that handles:
1. **Live website chat** (web widgets)
2. **WhatsApp Business API** integration
3. **Social Media** (Facebook Messenger, Instagram DM, Twitter DM)
4. **SMS** (optional)
5. **AI-powered chatbot** with seamless human handoff
6. **Unified inbox** for agents to handle all channels

---

## Architecture Design

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    OMNICHANNEL ENTRY POINTS                      │
├─────────────┬──────────────┬───────────────┬────────────────────┤
│  Website    │   WhatsApp   │  Facebook     │    Instagram       │
│  Widget     │   Business   │  Messenger    │    DM              │
└─────┬───────┴──────┬───────┴───────┬───────┴─────────┬──────────┘
      │              │               │                 │
      └──────────────┴───────────────┴─────────────────┘
                            │
                ┌───────────▼────────────┐
                │  Message Router/Queue  │
                │  (Webhook Handler)     │
                └───────────┬────────────┘
                            │
              ┌─────────────▼──────────────┐
              │   AI Agent (LLM)           │
              │   - Intent Detection       │
              │   - Auto-Response          │
              │   - Knowledge Base         │
              │   - Sentiment Analysis     │
              └─────────────┬──────────────┘
                            │
                    ┌───────▼───────┐
                    │  Need Human?  │
                    └───┬───────┬───┘
                        │ No    │ Yes
                        │       │
                ┌───────▼───┐   └────────────┐
                │  AI Continues │             │
                │  Conversation │             │
                └──────────────┘              │
                                              │
                            ┌─────────────────▼──────────┐
                            │  Queue Assignment          │
                            │  - Skill-based routing     │
                            │  - Round-robin             │
                            │  - Load balancing          │
                            └─────────────────┬──────────┘
                                              │
                            ┌─────────────────▼──────────┐
                            │  Agent Dashboard           │
                            │  - Unified inbox           │
                            │  - Chat interface          │
                            │  - Customer context        │
                            │  - AI suggestions          │
                            └────────────────────────────┘
```

---

## Recommended LLM Integration Approach

### Option 1: **OpenAI GPT-4** (✅ RECOMMENDED for Production)

**Pros**:
- ✅ Best natural language understanding
- ✅ Excellent context retention (128K tokens)
- ✅ Function calling for actions (create ticket, book appointment)
- ✅ Production-ready with 99.9% uptime
- ✅ Multilingual support (100+ languages)
- ✅ Fast response times (<2 seconds)

**Cons**:
- Cost per API call (~$0.01-0.03 per 1K tokens)
- Requires internet connection
- Data sent to OpenAI (can use Azure OpenAI for compliance)

**Cost Estimate**:
- Average chat: 10 messages × 200 tokens = 2000 tokens
- Cost per chat: ~$0.03-0.06
- 1000 chats/month: ~$30-60
- 10,000 chats/month: ~$300-600

**Implementation**:
```go
// backend/internal/service/ai_agent_service.go
type AIAgentService struct {
    openaiClient *openai.Client
    systemPrompt string
    knowledgeBase *KnowledgeBase
}

func (s *AIAgentService) ProcessMessage(ctx context.Context, message ChatMessage) (*AIResponse, error) {
    // 1. Build conversation context
    conversationHistory := s.buildContext(message.ConversationID)
    
    // 2. Search knowledge base for relevant info
    relevantKB := s.knowledgeBase.Search(message.Content)
    
    // 3. Call OpenAI API
    response, err := s.openaiClient.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
        Model: openai.GPT4Turbo,
        Messages: []openai.ChatCompletionMessage{
            {
                Role: "system", 
                Content: s.systemPrompt + "\n\nKnowledge Base: " + relevantKB,
            },
            ...conversationHistory,
            {Role: "user", Content: message.Content},
        },
        Functions: []openai.FunctionDefinition{
            {
                Name: "transfer_to_human",
                Description: "Transfer conversation to human agent when customer requests or complex issue",
            },
            {
                Name: "create_ticket",
                Description: "Create support ticket with details",
                Parameters: map[string]interface{}{
                    "type": "object",
                    "properties": map[string]interface{}{
                        "title": {"type": "string"},
                        "priority": {"type": "string", "enum": []string{"low", "medium", "high"}},
                    },
                },
            },
            {
                Name: "check_order_status",
                Description: "Check customer order status by order number",
            },
        },
        Temperature: 0.7,
        MaxTokens: 500,
    })
    
    // 4. Process function calls
    if response.Choices[0].FinishReason == "function_call" {
        return s.handleFunctionCall(response.Choices[0].Message.FunctionCall, message)
    }
    
    // 5. Detect if human handoff needed
    if s.detectHandoffIntent(message.Content, response.Choices[0].Message.Content) {
        return &AIResponse{
            Content: "Let me connect you with a human agent who can better assist you...",
            Action: ActionTransferToHuman,
            QueueID: s.determineQueue(message),
        }, nil
    }
    
    return &AIResponse{
        Content: response.Choices[0].Message.Content,
        Action: ActionContinue,
        Confidence: s.calculateConfidence(response),
    }, nil
}

// Handoff detection logic
func (s *AIAgentService) detectHandoffIntent(userMessage, botResponse string) bool {
    // Check for explicit requests
    handoffKeywords := []string{
        "talk to human", "speak to agent", "real person",
        "not helpful", "doesn't work", "frustrated",
    }
    
    userLower := strings.ToLower(userMessage)
    for _, keyword := range handoffKeywords {
        if strings.Contains(userLower, keyword) {
            return true
        }
    }
    
    // Check sentiment
    if s.analyzeSentiment(userMessage) < -0.5 {  // Very negative
        return true
    }
    
    // Check if bot is uncertain
    uncertainPhrases := []string{
        "I'm not sure", "I don't have information",
        "I might be wrong", "I don't understand",
    }
    
    botLower := strings.ToLower(botResponse)
    for _, phrase := range uncertainPhrases {
        if strings.Contains(botLower, phrase) {
            return true
        }
    }
    
    return false
}
```

---

### Option 2: **Anthropic Claude 3** (Good Alternative)

**Pros**:
- Longer context window (200K tokens)
- Great for complex conversations
- Strong reasoning abilities
- Better at following complex instructions

**Cons**:
- Similar cost structure to OpenAI
- Smaller ecosystem/community
- Fewer integrations

---

### Option 3: **Self-Hosted LLM** (Llama 3 / Mistral via Ollama)

**Pros**:
- ✅ No per-call cost after setup
- ✅ Data stays on your servers (privacy)
- ✅ Full control over model
- ✅ Works offline
- ✅ Can fine-tune on your data

**Cons**:
- ❌ Requires GPU infrastructure ($500-2000/month)
- ❌ Higher setup complexity
- ❌ Quality not as good as GPT-4
- ❌ Maintenance overhead
- ❌ Slower response times

**Setup with Ollama**:
```bash
# Install Ollama on your server
curl https://ollama.ai/install.sh | sh

# Download Llama 3 model
ollama pull llama3:8b

# Start server
ollama serve

# Test
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "How can I help you today?",
  "stream": false
}'
```

---

### Option 4: **Hybrid Approach** (✅ BEST COST-PERFORMANCE)

Use **GPT-4 for complex queries** + **Self-hosted Llama 3 for simple FAQs**

```
┌─────────────────┐
│ Incoming Message│
└────────┬────────┘
         │
    ┌────▼─────────┐
    │ Intent       │
    │ Classifier   │ (Fast, rule-based or small ML model)
    └────┬─────────┘
         │
    ┌────▼────┐     ┌───────────┐
    │ Simple? ├────►│ Llama 3   │ (Free, Fast, Local)
    │   FAQ   │     │ Self-Host │ FAQs, greetings, basic info
    └────┬────┘     └───────────┘
         │
    ┌────▼────┐     ┌───────────┐
    │ Complex?├────►│ GPT-4 API │ (Smart, Paid)
    │ Custom  │     │ OpenAI    │ Complaints, complex queries
    └─────────┘     └───────────┘

SAVINGS: 80% of queries → Llama 3 (free)
         20% of queries → GPT-4 ($$$)
         Total cost: ~$10-20/month for 1000 chats
```

---

## Database Schema for Chat

### New Tables Needed

```sql
-- Chat Conversations
CREATE TABLE conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    customer_id BIGINT,
    channel ENUM('web', 'whatsapp', 'facebook', 'instagram', 'twitter', 'sms') NOT NULL,
    external_id VARCHAR(255), -- WhatsApp phone, Facebook user ID, etc.
    status ENUM('queued', 'bot', 'agent', 'closed') DEFAULT 'bot',
    assigned_agent_id BIGINT,
    assigned_queue_id BIGINT,
    language VARCHAR(10) DEFAULT 'en',
    bot_confidence FLOAT, -- AI confidence score
    handoff_reason VARCHAR(255), -- Why transferred to human
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    closed_at TIMESTAMP,
    metadata JSON, -- Customer context, previous interactions
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_agent (assigned_agent_id),
    INDEX idx_channel (channel, status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES contacts(id),
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

-- Chat Messages
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_type ENUM('customer', 'agent', 'bot') NOT NULL,
    sender_id BIGINT, -- user_id if agent, NULL if bot
    content TEXT NOT NULL,
    message_type ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'template') DEFAULT 'text',
    media_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    intent VARCHAR(100), -- Detected intent by AI
    sentiment FLOAT, -- -1 to 1 (negative to positive)
    metadata JSON,
    INDEX idx_conversation (conversation_id, sent_at),
    INDEX idx_unread (conversation_id, is_read),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- AI Agent Knowledge Base
CREATE TABLE knowledge_base (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    category VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT, -- Comma-separated for quick search
    embedding JSON, -- Vector embeddings for semantic search
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_category (tenant_id, category),
    INDEX idx_active (is_active),
    FULLTEXT idx_question (question, answer)
);

-- AI Agent Handoff Rules
CREATE TABLE handoff_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100),
    trigger_type ENUM('keyword', 'intent', 'sentiment', 'timeout', 'confidence', 'manual') NOT NULL,
    trigger_value VARCHAR(255), -- e.g., "refund", "angry", "60" (seconds)
    priority INT DEFAULT 0,
    target_queue_id BIGINT, -- Which queue to route to
    message_template TEXT, -- Message to send when transferring
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_active (tenant_id, is_active),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (target_queue_id) REFERENCES queues(id)
);

-- Channel Integrations
CREATE TABLE channel_integrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    channel ENUM('whatsapp', 'facebook', 'instagram', 'twitter', 'telegram', 'web') NOT NULL,
    credentials JSON NOT NULL, -- Store API keys, tokens, secrets
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_tenant_channel (tenant_id, channel),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- AI Agent Configuration per Tenant
CREATE TABLE ai_agent_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    model VARCHAR(50) DEFAULT 'gpt-4', -- gpt-4, claude-3, llama3
    system_prompt TEXT,
    personality VARCHAR(50) DEFAULT 'professional', -- friendly, professional, casual
    auto_handoff_threshold FLOAT DEFAULT 0.5, -- Confidence threshold
    max_auto_responses INT DEFAULT 10, -- Max bot responses before handoff
    response_delay_ms INT DEFAULT 1000, -- Simulate typing
    business_hours_only BOOLEAN DEFAULT FALSE,
    fallback_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

## Admin Feature Set (Complete)

### What Admin Should Be Able To Do:

#### ✅ 1. **Tenant Management** (ALREADY DONE)
- Create/Edit/Delete tenants
- Set resource limits (agents, DIDs, calls)
- Enable/disable features

#### ✅ 2. **User Management** (ALREADY DONE)
- Create users with roles
- Assign to multiple tenants
- Activate/deactivate accounts

#### 🔲 3. **DID Management** (TO IMPLEMENT)
- Add/Remove phone numbers
- Assign to queues or direct to agents
- Configure caller ID
- Set business hours routing
- Failover rules
- Emergency routing

#### 🔲 4. **Queue Management** (TO IMPLEMENT)
- Create/Edit queues
- Configure strategy:
  - Ring All (all agents ring)
  - Round Robin (distribute evenly)
  - Least Recent (agent who waited longest)
  - Random
- Set timeouts (ring time, queue timeout)
- Add/remove agents
- Set agent penalties/priorities
- Configure announcements (position, wait time)
- Enable/disable call recording
- Set max queue size

#### 🔲 5. **IVR Management** (HIGH PRIORITY - NEW)
- Create IVR menus (Interactive Voice Response)
- Text-to-Speech (TTS) prompts:
  - "Press 1 for Sales, 2 for Support..."
  - Multiple languages
  - Custom voice selection
- Upload custom audio files
- Configure key press actions:
  - 1 → Queue (Sales)
  - 2 → Queue (Support)
  - 3 → Voicemail
  - 0 → Operator
- Multi-level menus (nested menus)
- Time-based routing (business hours vs after hours)
- Dial-by-name directory
- Callback option

#### 🔲 6. **Extensions Management** (TO IMPLEMENT)
- Create SIP/PJSIP endpoints
- Configure:
  - Username/password
  - Codecs (g711, g722, opus)
  - NAT settings
  - Call limits
  - Voicemail
  - Call forwarding
  - Do Not Disturb
- Monitor registration status
- View active calls per extension

#### 🔲 7. **AI Agent Configuration** (NEW - HIGH VALUE)
Admin can configure per tenant:
- **Enable/Disable** AI bot
- **Choose Model**: GPT-4, Claude, Llama 3
- **System Prompt**: Define bot personality and behavior
- **Knowledge Base**: Add FAQs, product info, policies
- **Handoff Rules**:
  - Transfer after X messages
  - Transfer on negative sentiment
  - Transfer on specific keywords
- **Business Hours**: Bot active 24/7 or only during hours
- **Channels**: Enable bot for web, WhatsApp, Facebook, etc.
- **Languages**: Multilingual support
- **Analytics**: Bot performance metrics

#### 🔲 8. **Channel Integration Management** (NEW)
Admin can setup:
- **WhatsApp Business API**:
  - Phone number registration
  - API credentials
  - Message templates
  - Webhook configuration
- **Facebook Messenger**:
  - Page connection
  - App credentials
  - Greeting message
- **Instagram DM**:
  - Account connection
  - Auto-replies
- **Website Widget**:
  - Generate embed code
  - Customize colors/branding
  - Welcome message
  - Position (bottom-right, etc.)

#### 🔲 9. **Reports & Analytics** (TO IMPLEMENT)
- Call statistics
- Agent performance
- Queue metrics
- Chat analytics
- Bot vs Human handoff rates
- Customer satisfaction
- Export reports

#### 🔲 10. **Settings** (TO IMPLEMENT)
- Company profile
- Email notifications
- Webhook alerts
- API keys
- Billing information

---

## Implementation Priority (Recommended Order)

### 🚀 **Phase 1: Core Admin Features** (Week 1-2)
1. ✅ Tenants - DONE
2. ✅ Users - DONE  
3. **DIDs Page** - Phone number management
4. **Queues Page** - Call routing configuration
5. **Extensions Page** - SIP endpoint management

**Why First**: These are foundational for call center operations. Without these, you can't route calls properly.

---

### 🤖 **Phase 2: AI Chat Integration** (Week 3-4)
6. **AI Agent Service** - Backend LLM integration (GPT-4 or hybrid)
7. **Knowledge Base Management** - Admin adds FAQs
8. **Chat Page** - Agent unified inbox UI
9. **WebSocket Service** - Real-time message delivery
10. **Handoff Logic** - Bot → Human transfer

**Why Second**: This is your competitive advantage and high-value feature.

---

### 📱 **Phase 3: Omnichannel Integration** (Week 5-6)
11. **WhatsApp Business API** - Webhook handler
12. **Facebook Messenger** - Integration
13. **Website Widget** - Embeddable chat script
14. **Channel Router** - Unified message handling
15. **Message Templates** - Quick replies

**Why Third**: Once chat works, adding channels is mostly webhook + API integration.

---

### 🎤 **Phase 4: IVR & Advanced Features** (Week 7-8)
16. **IVR Builder** - Visual IVR designer
17. **Text-to-Speech** - Google TTS or Amazon Polly integration
18. **Call Recording** - Store and playback
19. **Reports Dashboard** - Analytics and metrics
20. **Settings Page** - User preferences

---

## My Recommendation for AI Agent

### ✅ **Use OpenAI GPT-4** Because:

1. **Best Quality**: Most natural conversations
2. **Fast Setup**: API integration in 1 day
3. **Reliable**: 99.9% uptime
4. **Function Calling**: Can trigger actions (create ticket, transfer)
5. **Multilingual**: Works in 100+ languages
6. **Reasonable Cost**: $30-60/month for 1000 chats

### Alternative Strategy (Cost Savings):

**Hybrid Model** (80/20 Rule):
```
- 80% of queries are simple → Use Llama 3 locally (FREE)
  Examples: "What are your hours?", "Where are you located?"
  
- 20% of queries are complex → Use GPT-4 API ($$$)
  Examples: "I want a refund but the product was damaged...", complaints

Result: Save 80% of costs while maintaining quality
```

### Sample System Prompt for GPT-4:

```
You are a helpful customer service assistant for [Company Name].

Your role:
- Answer customer questions about products, services, and policies
- Be friendly, professional, and concise
- If you don't know something, admit it and offer to connect them with a human agent
- Never make up information
- Always prioritize customer satisfaction

Knowledge Base:
[Inject relevant FAQs here]

When to transfer to human:
- Customer explicitly asks for a human
- Customer is frustrated or angry
- Question requires account access or personal information
- Complex issue you cannot resolve
- After 5 exchanges without resolution

You have access to these functions:
- transfer_to_human: Connect customer with agent
- create_ticket: Log a support ticket
- check_order_status: Look up order by number

Always respond in the customer's language.
Be empathetic and understanding.
```

---

## Next Steps - What Should I Implement?

Please choose what you'd like me to build next:

### Option A: **AI Chat Foundation** (Most Unique Value)
1. AI Agent Service with GPT-4 integration
2. Knowledge Base Management UI (admin adds FAQs)
3. Chat Page with unified inbox
4. Bot → Human handoff logic

### Option B: **Core Admin Features First** (Most Practical)
1. DIDs Management page
2. Queues Management page
3. Extensions Management page
4. Then add AI later

### Option C: **IVR System** (Unique Feature Request)
1. IVR Menu Builder UI
2. Text-to-Speech integration (Google TTS)
3. Menu routing logic
4. Multi-level menu support

### Option D: **Complete All Admin Features** (Full Admin Panel)
1. DIDs + Queues + Extensions + IVR all at once
2. Then tackle AI chat after

---

**My Recommendation**: Start with **Option A (AI Chat)** because:
- It's your most unique selling point
- Differentiates from competitors
- Can generate revenue quickly
- Easier to demo to customers
- Admin features can be added iteratively

What would you like me to build first? 🚀