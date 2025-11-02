# Gemini AI Agent with RAG and Knowledge Base

## Overview
Complete implementation of Google Gemini AI agent with Retrieval-Augmented Generation (RAG) for handling incoming chats with automatic handover rules based on confidence thresholds.

## Features Implemented

### 1. **Document Upload & Processing** ✅
- **Supported Formats**: PDF, DOCX, DOC, TXT, CSV
- **Automatic Text Extraction**: 
  - PDF: Uses `ledongthuc/pdf` library for text extraction
  - TXT: Direct text reading
  - DOCX/DOC: Binary text extraction (production-ready parser recommended)
- **Smart Chunking**: Splits large documents into 2000-character chunks for optimal context
- **Keyword Extraction**: Automatic keyword detection for better search
- **Bulk Creation**: Auto-creates multiple KB entries from single document

### 2. **Knowledge Base Management** ✅
- **Full CRUD Operations**: Create, Read, Update, Delete entries
- **Categories & Organization**: Group entries by topic
- **Multi-language Support**: English, Spanish, French, and more
- **Priority Levels**: 1-10 priority system for important content
- **Active/Inactive Toggle**: Enable/disable entries without deletion
- **Usage Tracking**: Track how often each entry is used
- **Feedback System**: Helpful/Not Helpful ratings

### 3. **RAG (Retrieval-Augmented Generation)** ✅
- **Semantic Search**: Finds relevant KB entries based on user query
- **Context Injection**: Automatically adds relevant KB content to Gemini prompts
- **Configurable Results**: Set max number of KB results (default: 3)
- **Usage Tracking**: Tracks which KB entries were used in responses

### 4. **Gemini AI Integration** ✅
- **Multiple Models**: Support for Gemini 1.5 Flash, Pro, etc.
- **Streaming Responses**: Real-time response generation
- **Temperature Control**: Adjustable creativity (0.0 - 1.0)
- **Token Limits**: Configurable max tokens per response
- **System Prompts**: Customizable agent personality and behavior

### 5. **Agent Handover Rules** ✅
- **Confidence Threshold**: Automatically detect when AI is uncertain
- **Fallback Options**:
  - **Transfer to Human Agent**: When confidence < threshold
  - **Request More Info**: When query is ambiguous
  - **Use Fallback Response**: When KB has no match
- **Configurable Rules**:
  - Minimum confidence level (0.0 - 1.0)
  - Handover message templates
  - Escalation workflows

## Configuration

### AI Agent Configuration (via AIAgentManager.tsx)

```typescript
{
  "agent_name": "Customer Support AI",
  "model": "gemini-1.5-flash",
  "temperature": 0.7,
  "max_tokens": 2000,
  "enable_rag": true,
  "rag_max_results": 3,
  "confidence_threshold": 0.7, // Below this = handover
  "fallback_message": "Let me connect you with a human agent",
  "capabilities": [
    "faq_answering",
    "appointment_booking",
    "lead_qualification",
    "product_recommendation"
  ]
}
```

### Handover Rules

**Automatic Handover Triggers**:
1. **Low Confidence**: AI confidence < threshold (default: 0.7)
2. **No KB Match**: No relevant knowledge base entries found
3. **Explicit Request**: Customer asks for human agent
4. **Complex Query**: Query requires specialized knowledge
5. **Sensitive Topics**: Payment issues, complaints, refunds

**Handover Workflow**:
```
User Query → AI Analysis → Confidence Check
                                ↓
                    ┌───────────┴───────────┐
                    ↓                       ↓
            High Confidence           Low Confidence
                    ↓                       ↓
            AI Response              Find Available Agent
                                            ↓
                                    Transfer to Human
```

## API Endpoints

### Knowledge Base

```
POST   /api/v1/knowledge-base           - Create entry
GET    /api/v1/knowledge-base           - List entries
GET    /api/v1/knowledge-base/:id       - Get entry
PUT    /api/v1/knowledge-base/:id       - Update entry
DELETE /api/v1/knowledge-base/:id       - Delete entry
POST   /api/v1/knowledge-base/import    - Bulk import (CSV/JSON)
POST   /api/v1/knowledge-base/upload    - Upload document (PDF/DOCX/TXT)
GET    /api/v1/knowledge-base/export    - Export as CSV
GET    /api/v1/knowledge-base/search    - Semantic search
GET    /api/v1/knowledge-base/categories - List categories
GET    /api/v1/knowledge-base/stats     - Get statistics
POST   /api/v1/knowledge-base/test      - Test RAG query
```

### AI Chat

```
POST   /api/v1/chat/ai/message          - Send message to AI
GET    /api/v1/chat/ai/agents           - List AI agents
POST   /api/v1/chat/ai/agents           - Create AI agent
PUT    /api/v1/chat/ai/agents/:id       - Update AI agent
```

## Usage Guide

### 1. Upload Knowledge Base Document

**Via UI**:
1. Go to **Admin** → **Knowledge Base**
2. Click **Import** button
3. Choose PDF/DOCX/TXT file
4. Click **Import Entries**
5. System automatically:
   - Extracts text from document
   - Splits into manageable chunks
   - Creates KB entries with keywords
   - Indexes for semantic search

**Via API**:
```bash
curl -X POST http://localhost:8080/api/v1/knowledge-base/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@product_manual.pdf" \
  -F "category=Product Documentation" \
  -F "language=en" \
  -F "priority=8"
```

### 2. Create AI Agent

1. Go to **Agentic AI** → **AI Agent Manager**
2. Click **Create Agent**
3. Configure:
   - **Name**: Customer Support Bot
   - **Model**: gemini-1.5-flash
   - **Enable RAG**: ✅
   - **Max KB Results**: 3
   - **Confidence Threshold**: 0.7
   - **Temperature**: 0.7
4. Select capabilities
5. Click **Save**

### 3. Test RAG Query

1. Go to **Admin** → **Knowledge Base**
2. Click **Test Query** button
3. Enter test question
4. See:
   - Matched KB entries
   - AI response with context
   - Confidence score
   - KB entries used

### 4. Monitor Chat Sessions

**Handover Detection**:
```
{
  "session_id": "sess_123",
  "ai_confidence": 0.45,        // Below threshold
  "handover_triggered": true,
  "handover_reason": "low_confidence",
  "kb_entries_used": [12, 45],
  "recommended_action": "transfer_to_agent"
}
```

## Confidence Calculation

AI confidence is calculated based on:

1. **KB Match Quality** (40%):
   - Number of relevant KB entries found
   - Keyword similarity score
   - Category relevance

2. **Response Clarity** (30%):
   - Presence of uncertainty phrases ("I'm not sure", "maybe")
   - Response length and completeness
   - Structured vs. ambiguous answer

3. **Context Relevance** (30%):
   - Query matches agent capabilities
   - Required information availability
   - Historical success rate

**Example Scores**:
- **0.9-1.0**: Highly confident - Clear KB match
- **0.7-0.9**: Confident - Good KB context
- **0.5-0.7**: Uncertain - Partial match (→ Handover consideration)
- **0.0-0.5**: Low confidence - No match (→ Immediate handover)

## Handover Implementation

### Backend (Go)

```go
// In ai_agent_service.go
func (s *AIAgentService) ProcessMessage(ctx context.Context, req *AIMessageRequest) (*AIResponse, error) {
    // 1. Search knowledge base (RAG)
    kb, ids, err := s.searchKnowledgeBase(tenantID, message, config.RAGMaxResults)
    
    // 2. Call Gemini with KB context
    response := s.callGemini(message, kb, config)
    
    // 3. Calculate confidence
    confidence := s.calculateConfidence(response, kb)
    
    // 4. Check handover threshold
    if confidence < config.ConfidenceThreshold {
        return &AIResponse{
            ShouldHandover: true,
            HandoverReason: "low_confidence",
            SuggestedAction: "transfer_to_human_agent",
        }
    }
    
    return response
}
```

### Frontend React

```typescript
// Automatic handover UI
if (aiResponse.should_handover) {
  showHandoverDialog({
    reason: aiResponse.handover_reason,
    confidence: aiResponse.confidence,
    action: () => transferToAgent(session.id)
  });
}
```

## Best Practices

### Knowledge Base Content

1. **Clear Q&A Format**: Write as customer would ask
2. **Comprehensive Answers**: Include all necessary details
3. **Keywords**: Add relevant search terms
4. **Regular Updates**: Keep content current
5. **Categories**: Organize by topic/department

### AI Configuration

1. **Start Conservative**: Higher confidence threshold (0.75-0.8)
2. **Monitor Performance**: Track handover rates
3. **Adjust Temperature**: 
   - Lower (0.5-0.7) for factual responses
   - Higher (0.7-0.9) for creative replies
4. **Enable RAG**: Always use with knowledge base
5. **Test Regularly**: Use test query feature

### Handover Strategy

1. **Clear Communication**: Tell customer they're being transferred
2. **Context Transfer**: Pass conversation history to agent
3. **Quick Response**: Minimize wait time
4. **Fallback Options**: Have backup plans if no agents available
5. **Feedback Loop**: Learn from handover patterns

## Troubleshooting

### Issue: AI not finding relevant KB entries

**Solution**:
- Check keywords in KB entries
- Verify category assignments
- Test with semantic search endpoint
- Increase `rag_max_results`

### Issue: Too many handovers

**Solution**:
- Lower confidence threshold (0.6-0.65)
- Add more KB content
- Improve KB entry quality
- Check Gemini API key validity

### Issue: Responses too generic

**Solution**:
- Enable RAG
- Add specific KB entries
- Adjust temperature (lower = more focused)
- Refine system prompt

## Performance Metrics

Monitor these KPIs:
- **KB Coverage**: % of queries with KB match
- **Handover Rate**: % of conversations transferred
- **Average Confidence**: Mean confidence score
- **Response Time**: Time to generate response
- **Customer Satisfaction**: Ratings after AI interaction

## Next Steps

1. ✅ **Upload Knowledge Base**: Add your FAQs and documentation
2. ✅ **Configure AI Agent**: Set up with appropriate threshold
3. ✅ **Test Thoroughly**: Use test query feature
4. ✅ **Monitor & Adjust**: Watch metrics and tune settings
5. ✅ **Train Team**: Educate agents on handover protocol

---

**Status**: ✅ **FULLY IMPLEMENTED AND DEPLOYED**
- Document upload working
- RAG integration active
- Gemini AI connected
- Handover rules configured
- Knowledge base fully functional
