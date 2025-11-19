# 🎯 UI Guide: Connect AI Agent to Knowledge Base & Test

## Complete Step-by-Step Guide for Admin/Manager

---

## 📝 **STEP 1: Login to System**

1. **Open Browser**: Go to **http://138.2.68.107**
2. **Login Credentials**:
   ```
   Email: admin@callcenter.com
   Password: Password123!
   ```
3. Click **"Login"**
4. You'll see the main dashboard

---

## 📚 **STEP 2: Add Knowledge Base Content**

### **Method A: Manual Entry (Best for testing)**

1. **Navigate**: Click **"Admin"** in left sidebar → **"Knowledge Base"**

2. **Create Entry**: Click **"Create Entry"** button (green button, top right)

3. **Fill Form**:
   ```
   Category: Shipping
   
   Question: How long does shipping take?
   
   Answer: Standard shipping takes 3-5 business days. 
           Express shipping is available for an additional 
           fee and takes 1-2 business days.
   
   Keywords: shipping, delivery, time, how long
   
   Priority: 8 (1-10, higher = more important)
   
   Status: ✓ Active (make sure checkbox is checked!)
   ```

4. **Save**: Click **"Save"** button

5. **Add More**: Repeat for 3-5 common questions:
   - "What is your return policy?"
   - "Do you offer refunds?"
   - "What are your business hours?"
   - "How do I track my order?"

### **Method B: Upload Document (✨ NEW - Your Feature!)**

1. **Navigate**: Admin → Knowledge Base

2. **Upload**: Click **"Upload Files"** button (indigo button, top right)

3. **Select File**: Choose PDF/DOCX/TXT/CSV file with FAQs

4. **Configure**:
   - Category: Select appropriate category
   - Priority: Set importance level (1-10)

5. **Upload**: Click **"Upload Document"**

6. **Auto-Magic** ✨:
   - System extracts text automatically
   - Creates multiple KB entries
   - Indexes for AI search
   - You'll see: "Successfully imported X entries"

---

## 🤖 **STEP 3: Configure AI Agent**

### **Option A: Using Chat Widget Designer (Recommended)**

1. **Navigate**: Click **"Admin"** → **"Chat Widget Designer"**

2. **Select Widget**: Choose existing widget or create new one

3. **Go to AI Tab**: Click **"AI Agent & RAG"** tab (sparkle icon ✨)

4. **Enable AI Agent**:
   ```
   ☑ Enable AI Agent
   ```

5. **Configure AI Settings**:
   ```
   AI Model: gemini-1.5-flash (recommended)
   or: gemini-2.0-flash (latest, faster)
   ```

6. **Enable RAG (Knowledge Base Integration)** ⭐:
   ```
   ☑ Enable RAG (Retrieval-Augmented Generation)
   
   RAG Max Results: 3
   (How many KB entries AI will use per query)
   
   RAG Confidence Threshold: 0.7
   (Minimum confidence to continue without human)
   ```

7. **Configure Handover Rules**:
   ```
   ☑ Enable Auto Handover
   
   Handover Confidence Threshold: 0.6
   (Below this = transfer to human agent)
   
   Handover Keywords: human, agent, manager, supervisor
   (These words trigger immediate handover)
   
   Max AI Messages: 10
   (After 10 bot messages, transfer to human)
   
   Handover Timeout: 5 minutes
   (Transfer if no resolution in 5 min)
   ```

8. **Save Widget**: Click **"Save Changes"** button

### **Option B: Using AI Agent Manager**

1. **Navigate**: Click **"Agentic AI"** → **"AI Agent Manager"**

2. **Create Agent**: Click **"Create New AI Agent"** button

3. **Configure**:
   ```
   Agent Name: Customer Support Bot
   
   Model: gemini-1.5-flash
   
   System Prompt: (customize AI personality)
   "You are a helpful customer service assistant.
   Be friendly, professional, and concise.
   Always use the knowledge base for accurate answers."
   
   ☑ Enable RAG
   Max Results: 3
   
   Temperature: 0.7 (creativity level, 0-1)
   Max Tokens: 1000 (response length)
   
   Confidence Threshold: 0.7
   ```

4. **Select Knowledge Bases**: Choose which KB categories to use

5. **Save Agent**: Click **"Save Agent"**

---

## 🧪 **STEP 4: Test AI Agent with Knowledge Base**

### **Test Method 1: Using Test Query Feature (Easiest!)**

1. **Navigate**: Admin → Knowledge Base

2. **Click "Test Query"** button (blue button with beaker icon 🧪)

3. **Enter Test Question**:
   ```
   Type: "How long does shipping take?"
   ```

4. **Click "Test Query"** button

5. **Review Results**:
   ```
   📚 Matched KB Entries:
   ✓ Entry #1: "How long does shipping take?"
   ✓ Entry #2: "International shipping times"
   ✓ Entry #3: "Express shipping options"
   
   🤖 AI Agent Response:
   "Standard shipping takes 3-5 business days. 
   Express shipping is available for an additional 
   fee and takes 1-2 business days."
   
   📊 Confidence Score: 0.95 (HIGH)
   ✅ Action: Continue (no handover needed)
   
   🎯 Intent: product_inquiry
   😊 Sentiment: 0.0 (neutral)
   ```

6. **Interpret Results**:
   - **Confidence ≥ 0.7** = ✅ AI will handle it
   - **Confidence < 0.7** = ⚠️ Will transfer to human
   - **KB Entries Used** = Shows which articles AI referenced

### **Test Method 2: Using Live Chat Widget**

1. **Navigate**: Click **"Chat"** → **"Widget Demo"**

2. **Open Chat Widget**: Click the chat bubble in bottom-right corner

3. **Send Test Message**:
   ```
   You: "How long does shipping take?"
   ```

4. **Watch AI Respond**:
   ```
   🤖 AI Assistant: "Standard shipping takes 3-5 business days. 
   Express shipping is available for an additional fee and 
   takes 1-2 business days."
   
   [Response uses KB content!]
   ```

5. **Test Different Scenarios**:
   ```
   ✅ Test 1: Question with KB match
   You: "What is your return policy?"
   Expected: AI responds using KB

   ❌ Test 2: Question without KB match
   You: "Can you help me with quantum physics?"
   Expected: AI says "Let me connect you with a specialist"

   🙋 Test 3: Request human agent
   You: "I want to speak to a human"
   Expected: Immediate handover
   ```

### **Test Method 3: Monitor Real Sessions**

1. **Navigate**: Click **"Chat"** → **"Conversations"**

2. **View Active Chats**: See all ongoing conversations

3. **Check AI Performance**:
   - Status: "bot" = AI handling
   - Status: "queued" = Transferred to human
   - Handover Reason: Why transfer happened

4. **Review Messages**:
   - See AI responses
   - Check KB entries used (if visible in UI)
   - View confidence scores

---

## 🔍 **STEP 5: Monitor & Verify Integration**

### **Check KB Usage Statistics**

1. **Navigate**: Admin → Knowledge Base

2. **Click "Statistics"** button

3. **View Metrics**:
   ```
   📊 Total Entries: 10
   ✅ Active Entries: 10
   📈 Total Usage: 45 times
   ⭐ Most Used:
      1. "How long does shipping take?" (15 times)
      2. "Return policy" (12 times)
      3. "Business hours" (8 times)
   ```

### **Check AI Agent Performance**

1. **Navigate**: Agentic AI → AI Agent Manager

2. **View Agent Card**:
   ```
   Agent: Customer Support Bot
   Status: 🟢 Active
   
   Today's Stats:
   📞 Conversations: 12
   ✅ Handled by AI: 10 (83%)
   🙋 Transferred: 2 (17%)
   ⭐ Avg Confidence: 0.85
   ⏱️ Avg Response Time: 2.1s
   ```

### **Review Backend Logs (Advanced)**

Open terminal and run:
```bash
# Watch AI processing in real-time
docker logs -f backend | grep -E 'AI|RAG|Gemini|KB'

# See which KB entries are being used
docker logs backend --tail=100 | grep "KB entry"

# Check for errors
docker logs backend --tail=100 | grep -i error
```

---

## 🎨 **STEP 6: Customize AI Behavior**

### **Adjust Confidence Threshold**

If you're getting too many handovers:

1. Admin → Chat Widget Designer → AI Agent tab
2. **Lower** "Handover Confidence Threshold" from 0.7 to 0.6
3. AI will be more "brave" and handle more queries

If AI is answering things it shouldn't:

1. **Raise** threshold from 0.7 to 0.8
2. AI will be more "cautious" and transfer sooner

### **Customize AI Personality**

1. Agentic AI → AI Agent Manager
2. Edit agent
3. Change **System Prompt**:
   ```
   FRIENDLY:
   "You are a cheerful and enthusiastic customer service 
   assistant. Use emojis and casual language."
   
   PROFESSIONAL:
   "You are a professional technical support specialist. 
   Be precise, formal, and solution-focused."
   
   CONSULTATIVE:
   "You are a knowledgeable advisor. Ask clarifying 
   questions and provide comprehensive guidance."
   ```

### **Filter Knowledge Base by Tags**

1. Chat Widget Designer → AI Agent tab
2. **RAG Knowledge Bases**: Select specific categories
   - Leave empty = Use ALL KB entries
   - Select "Shipping" = Only use shipping-related KB
   - Select "Returns" = Only use returns-related KB

---

## ✅ **Verification Checklist**

After setup, verify everything works:

- [ ] **KB Entries Exist**: Admin → Knowledge Base shows entries
- [ ] **KB Active**: Entries have green "Active" checkmark
- [ ] **AI Enabled**: Widget Designer → AI tab shows "Enable AI Agent" checked
- [ ] **RAG Enabled**: "Enable RAG" is checked
- [ ] **Test Query Works**: Test Query modal shows AI response with KB content
- [ ] **Live Chat Works**: Widget responds to customer questions
- [ ] **KB Stats Update**: Usage count increases after queries
- [ ] **Handover Works**: Asking for "human" triggers transfer
- [ ] **Logs Show Activity**: `docker logs backend` shows AI processing

---

## 🐛 **Troubleshooting**

### **Issue: AI not responding**

**Check**:
1. Widget Designer → AI Agent tab → "Enable AI Agent" is checked
2. Backend logs: `docker logs backend --tail=50`
3. Gemini API key is configured (should be automatic)

**Fix**:
- Restart backend: `docker compose restart backend`
- Check `.env` file has `GEMINI_API_KEY`

### **Issue: AI not using KB content**

**Check**:
1. KB entries are **Active** (green checkmark)
2. Widget Designer → AI Agent tab → "Enable RAG" is checked
3. Test Query shows "Matched KB Entries"

**Fix**:
1. Make sure keywords match customer questions
2. Add more KB entries
3. Check KB search: Admin → Knowledge Base → Search box

### **Issue: Too many handovers**

**Symptoms**: AI transfers to human too often

**Check**:
- Current confidence threshold
- KB coverage (do you have entries for common questions?)

**Fix**:
1. Lower threshold: 0.7 → 0.6
2. Add more KB entries for common questions
3. Improve KB entry quality (better answers)

### **Issue: AI answering incorrectly**

**Check**:
- Which KB entries AI is using (Test Query modal shows this)
- KB entry content accuracy

**Fix**:
1. Update KB entry with correct information
2. Improve keywords to match better
3. Deactivate incorrect entries

### **Issue: Can't see Test Query button**

**Check**:
- You're on Admin → Knowledge Base page
- You're logged in as admin

**Fix**:
- Refresh page (Ctrl+F5)
- Check browser console for errors (F12)

---

## 📊 **Understanding the Data Flow**

```
Customer Types Question
         ↓
Chat Widget sends to backend
         ↓
Backend: "Is status = bot?"
         ↓ YES
AI Agent Service activated
         ↓
Search Knowledge Base (RAG)
"shipping" → Finds 3 matching entries
         ↓
Build Gemini Prompt:
System: "You are helpful assistant"
Context: [KB Entry 1] [KB Entry 2] [KB Entry 3]
User: "How long does shipping take?"
         ↓
Call Gemini API
         ↓
Gemini generates response using KB content
         ↓
Calculate Confidence Score
KB matched? +0.4
Clear answer? +0.3
Appropriate length? +0.2
Total: 0.9 (HIGH!)
         ↓
Decision: Continue (≥0.7)
         ↓
Save bot message
         ↓
Send to customer via WebSocket
         ↓
Customer sees AI response
```

---

## 🎯 **Quick Testing Script**

Want to test programmatically? Save this script:

```bash
#!/bin/bash
# quick_test_ai_kb.sh

# Login
TOKEN=$(curl -s -X POST http://138.2.68.107:8443/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.com","password":"Password123!","tenant_id":"demo-tenant"}' \
  | jq -r '.data.access_token')

echo "✓ Logged in"

# Test KB search
echo "Testing KB search for 'shipping'..."
curl -s -X GET "http://138.2.68.107:8443/api/v1/knowledge-base/search?q=shipping" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: demo-tenant" | jq '.data[0].question'

# Test AI query
echo "Testing AI agent response..."
curl -s -X POST http://138.2.68.107:8443/api/v1/knowledge-base/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: demo-tenant" \
  -H "Content-Type: application/json" \
  -d '{"query":"How long does shipping take?"}' \
  | jq '{response:.data.response, confidence:.data.confidence, action:.data.action}'

echo "✓ Test complete!"
```

Run:
```bash
chmod +x quick_test_ai_kb.sh
./quick_test_ai_kb.sh
```

---

## 🎓 **Best Practices**

### **For Knowledge Base**

✅ **DO**:
- Write questions as customers would ask them
- Use clear, concise answers
- Add relevant keywords
- Keep entries active and up-to-date
- Organize by category
- Set priority levels (important = higher)

❌ **DON'T**:
- Write technical jargon customers won't use
- Make answers too long (< 200 words ideal)
- Forget to mark as "Active"
- Duplicate entries
- Use poor keywords

### **For AI Configuration**

✅ **DO**:
- Start with higher confidence threshold (0.7-0.8)
- Monitor and adjust based on actual performance
- Enable RAG (always!)
- Set handover keywords ("human", "agent", "manager")
- Review logs regularly

❌ **DON'T**:
- Set threshold too low (< 0.5) - too risky
- Disable RAG - AI will hallucinate
- Ignore handover patterns
- Forget to test after changes

### **For Testing**

✅ **DO**:
- Test with real customer questions
- Try edge cases (no KB match)
- Test handover triggers
- Monitor first week closely
- Gather customer feedback

❌ **DON'T**:
- Test only happy path
- Skip testing handover
- Deploy without monitoring
- Ignore low confidence patterns

---

## 📱 **Mobile Access**

Same URLs work on mobile:
- Admin: http://138.2.68.107/admin/knowledge-base
- Chat: http://138.2.68.107/chat

---

## 🔐 **Other User Roles**

### **Manager** (`manager@callcenter.com` / `Password123!`)
- Can access Knowledge Base (read/edit)
- Can view AI Agent performance
- Can test queries
- Cannot change AI configuration (admin only)

### **Agent** (`agent1@callcenter.com` / `Password123!`)
- Can view KB entries (read-only)
- Can see AI suggestions in chat
- Can take over from AI (handover)
- Cannot edit KB or AI config

---

## 📞 **Support**

If you need help:

1. **Check Logs**:
   ```bash
   docker logs backend --tail=100
   docker logs frontend --tail=50
   ```

2. **Check Database**:
   ```bash
   docker exec mysql mysql -ucallcenter -pcallcenterpass callcenter \
     -e "SELECT COUNT(*) as kb_entries FROM knowledge_base_articles WHERE is_active=1;"
   ```

3. **Check Services**:
   ```bash
   docker compose ps
   ```

---

## 🎉 **You're All Set!**

Your AI Agent is now:
- ✅ Connected to Knowledge Base
- ✅ Using RAG for accurate answers
- ✅ Configured with confidence thresholds
- ✅ Ready to handle customer queries
- ✅ Will handover when needed

**Start testing and enjoy automated customer support!** 🚀

---

**Quick Links**:
- Knowledge Base: http://138.2.68.107/admin/knowledge-base
- AI Agent Manager: http://138.2.68.107/ai-agents
- Chat Widget: http://138.2.68.107/chat/widget-demo
- Test Query: Click "Test Query" in Knowledge Base page

---

**Document Version**: 1.0  
**Last Updated**: November 6, 2025  
**Status**: ✅ Fully Operational
