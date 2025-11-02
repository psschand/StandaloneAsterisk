# Testing Document Upload & RAG Functionality

## Status: ✅ DEPLOYED AND READY FOR TESTING

### Services Status
```
✅ Backend:  Running on port 8001 (17 minutes uptime)
✅ Frontend: Running on port 80 (17 minutes uptime)
✅ MySQL:    Healthy (45 hours uptime)
✅ Asterisk: Running (45 hours uptime)
```

## Test Scenarios

### Test 1: Upload PDF Document

**Objective**: Verify PDF text extraction and chunking

**Steps**:
1. Navigate to: `http://your-domain/admin/knowledge-base`
2. Login with admin credentials (see TEST_CREDENTIALS.md)
3. Click **"Import"** button (top right)
4. Click **"Choose a file"**
5. Select a PDF file (e.g., product manual, FAQ document)
6. Verify file name appears
7. Click **"Import Entries"**
8. Wait for success message

**Expected Results**:
- ✅ Success message shows: "Successfully imported X entries"
- ✅ X = number of chunks created from document
- ✅ New entries appear in knowledge base table
- ✅ Each entry has:
  - Title: "filename - Part 1", "filename - Part 2", etc.
  - Category: "Documents"
  - Language: "en"
  - Priority: 5
  - Status: Active
- ✅ Keywords automatically extracted

**Verification**:
```bash
# Check database
docker compose exec mysql mysql -u root -prootpassword call_center \
  -e "SELECT id, filename, file_type, entries_created FROM knowledge_base_documents ORDER BY created_at DESC LIMIT 1;"

# Check created entries
docker compose exec mysql mysql -u root -prootpassword call_center \
  -e "SELECT id, title, category, LEFT(answer, 100) as preview FROM knowledge_base WHERE category='Documents' ORDER BY created_at DESC LIMIT 3;"
```

---

### Test 2: Upload DOCX Document

**Objective**: Verify DOCX text extraction

**Steps**:
1. Same as Test 1, but select a .docx file
2. Examples: User manual, FAQ document, policy document

**Expected Results**:
- ✅ Text extracted from DOCX
- ✅ Multiple entries created based on document length
- ✅ Readable text in KB entries (no binary characters)

**Known Limitation**:
- Current DOCX parser is simplified (printable chars only)
- For production, consider upgrading to full DOCX parser

---

### Test 3: Upload TXT Document

**Objective**: Verify plain text processing

**Steps**:
1. Upload a .txt file (e.g., FAQ.txt, README.txt)
2. Should be fastest processing

**Expected Results**:
- ✅ Direct text extraction (no parsing needed)
- ✅ Smart chunking by paragraphs
- ✅ Keywords extracted from content

---

### Test 4: Test RAG Query (Knowledge Base)

**Objective**: Verify semantic search works with uploaded content

**Steps**:
1. After uploading document in Test 1-3
2. Click **"Test Query"** button (top right)
3. Enter question related to document content
   - Example: "What are the return policy terms?"
   - Example: "How do I reset my password?"
4. Click **"Search"**

**Expected Results**:
- ✅ Relevant KB entries displayed
- ✅ Entries from uploaded document appear
- ✅ Keyword matching works
- ✅ Response shows which entries were used

**Example Query**:
```
User Query: "What is the warranty period?"

Expected:
- Finds KB entry: "Product Manual - Part 3"
- Shows excerpt containing warranty information
- Displays confidence/relevance score
```

---

### Test 5: AI Agent with RAG

**Objective**: Verify Gemini AI retrieves and uses uploaded documents

**Prerequisites**:
- Gemini API key configured in environment
- AI agent created with RAG enabled
- Document uploaded and indexed

**Steps**:

#### Option A: Via Chat Widget Demo
1. Navigate to: `http://your-domain/chat/widget-demo`
2. Open chat widget
3. Ask question related to uploaded document
4. Example: "What are your business hours?"

#### Option B: Via AI Agent Manager Test
1. Go to: `http://your-domain/agentic-ai/ai-agent-manager`
2. Select your AI agent
3. Click **"Test Agent"**
4. Enter query related to document content

**Expected Results**:
- ✅ AI responds with information from document
- ✅ Response is contextually relevant
- ✅ No hallucination (uses actual KB content)
- ✅ If KB has no match:
  - Confidence score is low
  - Agent suggests handover (if enabled)

**Backend Logs Check**:
```bash
docker compose logs backend --tail=50 | grep -i "rag\|knowledge"
```

Look for:
```
[RAG] Searching knowledge base for query: "..."
[RAG] Found X relevant entries
[AI] Confidence score: 0.XX
```

---

### Test 6: Agent Handover (Low Confidence)

**Objective**: Verify automatic handover when AI is uncertain

**Steps**:
1. Upload document with specific information
2. Configure AI agent:
   - Confidence threshold: 0.7 (70%)
   - Enable handover: ✅
3. Ask question NOT covered in documents
4. Example: "Can you give me a discount?" (if not in KB)

**Expected Results**:
- ✅ AI searches knowledge base (no match)
- ✅ Confidence score < 0.7
- ✅ Handover triggered
- ✅ Message: "Let me connect you with a human agent"
- ✅ Chat transferred to available agent (if online)
- ✅ If no agents: Offline form shown

**Verification**:
```bash
# Check backend logs for handover events
docker compose logs backend --tail=100 | grep -i "handover\|confidence"
```

---

### Test 7: Bulk Document Upload

**Objective**: Verify system handles multiple documents

**Steps**:
1. Upload 5-10 different documents (mix of PDF/DOCX/TXT)
2. Each should create multiple KB entries
3. Check database growth

**Expected Results**:
- ✅ All documents processed successfully
- ✅ No duplicate entries
- ✅ Proper categorization
- ✅ Search works across all documents

**Performance Check**:
```sql
-- Check total entries by category
SELECT category, COUNT(*) as entries 
FROM knowledge_base 
GROUP BY category;

-- Check uploaded documents
SELECT filename, file_type, entries_created, created_at 
FROM knowledge_base_documents 
ORDER BY created_at DESC;

-- Check KB usage stats
SELECT kb_entry_id, usage_count, helpful_count, not_helpful_count 
FROM knowledge_base_usage 
WHERE usage_count > 0;
```

---

### Test 8: CSV Import (Existing Functionality)

**Objective**: Verify CSV import still works alongside document upload

**Steps**:
1. Create CSV file:
```csv
category,title,question,answer,keywords,language,priority,is_active
FAQ,Account Creation,How do I create an account?,"Visit signup page...",signup registration account,en,8,true
FAQ,Password Reset,How do I reset password?,"Click forgot password...",password reset recovery,en,7,true
```
2. Upload via Import modal
3. Should detect as CSV (not document)

**Expected Results**:
- ✅ CSV parsed correctly
- ✅ Entries created as specified
- ✅ No text extraction (direct import)
- ✅ Both CSV and document upload work

---

## Troubleshooting

### Issue: "Failed to upload document"

**Check**:
1. File size limits: `docker compose logs backend | grep -i "file size"`
2. File format: Only PDF, DOCX, DOC, TXT supported
3. Backend errors: `docker compose logs backend --tail=50`

**Solution**:
```bash
# Check backend health
curl http://localhost:8001/health

# Check upload endpoint
curl -X POST http://localhost:8001/api/v1/knowledge-base/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```

---

### Issue: "No entries created from document"

**Possible Causes**:
1. Document is image-based PDF (no text layer)
2. DOCX is corrupted or password-protected
3. Text extraction failed

**Solution**:
```bash
# Check backend logs for extraction errors
docker compose logs backend | grep -i "extract\|pdf\|docx"

# Try with plain TXT file to isolate issue
echo "Test content for RAG" > test.txt
# Upload test.txt via UI
```

---

### Issue: "RAG not finding uploaded content"

**Check**:
1. Are entries actually created? Check Knowledge Base page
2. Are entries active? Check `is_active = true`
3. Are keywords extracted? View entry details
4. Is RAG enabled on AI agent?

**Debug**:
```sql
-- Check recent KB entries
SELECT id, title, keywords, is_active, created_at 
FROM knowledge_base 
WHERE category = 'Documents' 
ORDER BY created_at DESC 
LIMIT 5;

-- Test semantic search
SELECT id, title, 
  MATCH(title, question, answer, keywords) AGAINST('your search query') as relevance
FROM knowledge_base
WHERE MATCH(title, question, answer, keywords) AGAINST('your search query')
ORDER BY relevance DESC
LIMIT 5;
```

---

### Issue: "Too many handovers"

**Tuning**:
1. **Lower confidence threshold**: 0.7 → 0.6 or 0.55
2. **Add more KB content**: Upload more documents
3. **Improve KB quality**: Better keywords, clearer answers
4. **Adjust RAG settings**: Increase `rag_max_results` from 3 to 5

**Configuration**:
```json
{
  "confidence_threshold": 0.6,
  "rag_max_results": 5,
  "enable_rag": true,
  "fallback_strategy": "use_generic_response"
}
```

---

## Success Metrics

After testing, you should see:
- ✅ **Document Upload Rate**: 90%+ successful uploads
- ✅ **Text Extraction Accuracy**: 95%+ readable text
- ✅ **RAG Retrieval Rate**: 80%+ queries find relevant content
- ✅ **Handover Rate**: 10-20% (indicates good KB coverage)
- ✅ **Response Time**: < 2 seconds for AI response with RAG

---

## Next Steps After Testing

1. **Upload Production Content**:
   - Product manuals
   - FAQ documents
   - Policy documents
   - Training materials

2. **Fine-tune AI Agent**:
   - Adjust confidence threshold based on actual performance
   - Customize system prompts
   - Configure handover messages

3. **Monitor Performance**:
   - Track KB usage statistics
   - Monitor handover rates
   - Collect customer feedback

4. **Enhance KB**:
   - Mark helpful/not helpful entries
   - Update outdated content
   - Add missing information based on queries

---

**Documentation**: See `GEMINI_RAG_IMPLEMENTATION.md` for full technical details
