# AI Agent & Knowledge Base: Brand-Specific Business Model Analysis

## Confirmation: Architecture Context

✅ **This analysis is for:** Metadata + Drill-down architecture (no forced context switching)
✅ **Previous simulation:** ARCHITECTURE_SIMULATION_ANALYSIS.md validated this approach
✅ **Now analyzing:** AI Agent and Knowledge Base complexity with brand-specific data

---

## The Core Challenge

### **Reality of Multi-Brand Operations:**

Each brand under the same tenant has:
- 🎯 **Different business models**
- 📦 **Different products/services**
- 📚 **Different knowledge bases**
- 🤖 **Different AI personalities**
- 💬 **Different customer expectations**

### **Example: Acme Corp (One Tenant, Three Brands)**

```
Acme Corp (Tenant)
├── 🛒 Acme Store (E-commerce)
│   ├── Business: Online retail
│   ├── Products: Physical goods (shoes, clothing)
│   ├── AI Tone: Friendly, sales-oriented
│   ├── Knowledge: Product specs, shipping, returns
│   ├── Common Questions: "Where's my order?" "Do you have size 10?"
│   
├── 🎧 Acme Support (SaaS Support Portal)
│   ├── Business: Software support
│   ├── Products: API, SDK, cloud services
│   ├── AI Tone: Technical, professional
│   ├── Knowledge: API docs, troubleshooting, error codes
│   ├── Common Questions: "API returns 403" "How to authenticate?"
│   
└── 📱 Acme Marketing (Marketing Agency)
    ├── Business: B2B services
    ├── Products: Marketing campaigns, consulting
    ├── AI Tone: Professional, consultative
    ├── Knowledge: Service packages, case studies, pricing
    ├── Common Questions: "What's included?" "ROI examples?"
```

**Challenge:** Same customer might interact with ALL THREE brands, expecting different experiences each time!

---

## Scenario 1: AI Agent Response - Wrong Brand Context

### **Setup:**

**Customer:** Bob (bob@example.com)
**Conversation:** WhatsApp message routed to E-commerce (keyword: "order")
**Message:** "I can't login to my account"

### **Problem: Which AI Should Respond?**

#### **Option A: E-commerce AI (Current Website Context)**
```
AI Profile: Acme Store AI
Tone: Friendly, sales-focused
Knowledge Base: E-commerce KB
Training: Product info, shipping, returns

Bob: "I can't login to my account"

AI Response:
"Hi Bob! 😊 I'd be happy to help you access your shopping account! 
Have you tried resetting your password? You can do this by:
1. Click 'Forgot Password' on store.acme.com
2. Check your email for reset link
3. Create a new password

Need help finding an order? I can look that up for you too! 🛍️"

Analysis:
✅ Friendly tone matches E-commerce brand
✅ Knows about store.acme.com
❌ But what if Bob means his SaaS account (Support Portal)?
❌ Wrong context = wrong answer!
```

#### **Option B: Support Portal AI (Wrong Context)**
```
AI Profile: Acme Support AI
Tone: Technical, professional
Knowledge Base: SaaS Support KB
Training: API docs, SDK, technical troubleshooting

Bob: "I can't login to my account"

AI Response:
"Hello. I can assist with authentication issues. Please provide:
1. Your API key or client ID
2. The authentication method you're using (OAuth, JWT, API Key)
3. The exact error code you're receiving
4. Your SDK version

For immediate assistance, check the authentication docs:
https://docs.acme.com/auth

Please note this is for API/SDK access. For dashboard login issues,
verify your credentials at support.acme.com"

Analysis:
❌ Too technical for e-commerce customer
❌ Mentions API/SDK (Bob just wants to shop)
❌ Wrong tone for retail customer
✅ But correct if Bob is a developer!
```

#### **The Problem:**

```
Bob sent message via WhatsApp (shared number)
↓
Keyword "login" + "account" detected
↓
Routing logic: Keywords ambiguous
↓
System routes to E-commerce (default)
↓
E-commerce AI responds about shopping account
↓
Bob replies: "No, I mean my API account for the integration"
↓
OH NO! Wrong brand, wrong AI, wrong knowledge base
↓
Need to transfer to Support Portal
↓
Start conversation over with correct AI
```

---

## Scenario 2: Knowledge Base Search - Cross-Contamination

### **Setup:**

**Agent:** Sarah handling chat for E-commerce
**Customer:** Alice asking about "integration"
**Sarah searches KB:** "integration"

### **Current Challenge: Which KB to Search?**

#### **Naive Approach: Search All KBs**

```sql
-- Search across ALL knowledge bases
SELECT * FROM knowledge_base_articles
WHERE tenant_id = 'acme-corp'
  AND (title LIKE '%integration%' OR content LIKE '%integration%')
ORDER BY relevance DESC
LIMIT 10;
```

**Results:**
```
1. "API Integration Guide" [🎧 Support Portal] ← SaaS docs
2. "Zapier Integration" [🎧 Support Portal] ← SaaS docs
3. "Shopify Store Integration" [🛒 E-commerce] ← Relevant!
4. "Payment Gateway Integration" [🛒 E-commerce] ← Relevant!
5. "CRM Integration Services" [📱 Marketing] ← Agency services
6. "Webhook Integration" [🎧 Support Portal] ← SaaS docs
7. "Social Media Integration" [📱 Marketing] ← Agency services
8. "Third-party Shipping Integration" [🛒 E-commerce] ← Relevant!
9. "OAuth Integration Flow" [🎧 Support Portal] ← SaaS docs
10. "Email Marketing Integration" [📱 Marketing] ← Agency services
```

**Sarah's View (Unified Inbox):**
```
┌────────────────────────────────────────────────────────────┐
│ 💬 Alice • Web Chat • [🌐 E-commerce Store]               │
│                                                            │
│ Alice: "Do you have integration with Shopify?"             │
│                                                            │
│ 📚 KB Search Results for "integration":                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 1. API Integration Guide [🎧 Support Portal]          │ │ ← Wrong brand!
│ │ 2. Zapier Integration [🎧 Support Portal]             │ │ ← Wrong brand!
│ │ 3. Shopify Store Integration [🛒 E-commerce] ⭐       │ │ ← Correct!
│ │ 4. Payment Gateway Integration [🛒 E-commerce] ⭐     │ │ ← Correct!
│ │ 5. CRM Integration Services [📱 Marketing]            │ │ ← Wrong brand!
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Problem: Sarah has to MANUALLY filter                     │
│          Top results are from wrong brands!               │
└────────────────────────────────────────────────────────────┘
```

**Issues:**
- ❌ Sarah sees irrelevant results from other brands
- ❌ Cognitive load: "Is this article for E-commerce or Support?"
- ❌ Risk of sending wrong info: Copy/paste from Support KB to E-commerce customer
- ❌ Wastes time scrolling past irrelevant articles

#### **Better Approach: Context-Aware KB Search**

```sql
-- Search ONLY E-commerce KB (based on conversation's website_id)
SELECT * FROM knowledge_base_articles
WHERE tenant_id = 'acme-corp'
  AND (website_id = 1 OR website_id IS NULL)  -- E-commerce or shared
  AND (title LIKE '%integration%' OR content LIKE '%integration%')
ORDER BY 
  CASE WHEN website_id = 1 THEN 0 ELSE 1 END,  -- Prioritize website-specific
  relevance DESC
LIMIT 10;
```

**Results:**
```
1. "Shopify Store Integration" [🛒 E-commerce] ⭐
2. "Payment Gateway Integration" [🛒 E-commerce] ⭐
3. "Third-party Shipping Integration" [🛒 E-commerce] ⭐
4. "Amazon FBA Integration" [🛒 E-commerce] ⭐
5. "General Integration Best Practices" [Shared] ⭐
```

**Sarah's View (Improved):**
```
┌────────────────────────────────────────────────────────────┐
│ 💬 Alice • Web Chat • [🌐 E-commerce Store]               │
│                                                            │
│ Alice: "Do you have integration with Shopify?"             │
│                                                            │
│ 📚 KB Search Results (E-commerce only):                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 1. Shopify Store Integration [🛒 E-commerce] ⭐       │ │ ← Perfect!
│ │    "Yes! We support Shopify integration..."           │ │
│ │    [Copy Answer] [Send to Customer] [View Full]       │ │
│ │                                                        │ │
│ │ 2. Payment Gateway Integration [🛒 E-commerce]        │ │
│ │ 3. Third-party Shipping Integration [🛒 E-commerce]   │ │
│ │ 4. Amazon FBA Integration [🛒 E-commerce]             │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ✅ All results relevant to E-commerce                     │
│ ✅ No confusion with Support/Marketing                    │
└────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Only relevant articles shown
- ✅ No cognitive overhead
- ✅ Faster response time
- ✅ Correct info guaranteed

---

## Scenario 3: AI Agent Learning from Wrong Brand

### **Setup:**

**Conversation Flow:**
1. Customer contacts Support Portal about API issue
2. Agent answers with technical solution
3. AI learns from this interaction
4. Later, customer contacts E-commerce Store
5. AI applies "learned" technical response to retail customer

### **The Problem: Cross-Brand Learning Pollution**

#### **Timeline:**

**Day 1 - Support Portal Conversation:**
```
Customer (Developer): "How do I authenticate API requests?"
Agent (Technical): "You need to include your API key in the Authorization 
                    header as: Authorization: Bearer YOUR_API_KEY"
Customer: "Perfect, thanks!"
Rating: 5 stars

AI Learning System:
✅ Learned: Question "authenticate" → Technical API answer
✅ Context: Support Portal
✅ Success: High rating
```

**Day 5 - E-commerce Conversation (PROBLEM):**
```
Customer (Shopper): "How do I authenticate my account?"
                     (Meaning: How do I login to shop)

AI (Using learned response):
"You need to include your API key in the Authorization header as:
 Authorization: Bearer YOUR_API_KEY
 
 You can generate your API key from the Developer Dashboard at
 https://dev.acme.com"

Customer: "What?? I just want to login and buy shoes! 😕"
Rating: 1 star

Issue: AI learned from SUPPORT but applied to E-COMMERCE!
```

#### **Database Schema Challenge:**

**Current (Problematic):**
```sql
ai_training_data (
  id,
  tenant_id,      -- ✅ Isolated per tenant
  question,
  answer,
  rating,
  learned_from_session_id
)

-- Problem: No website_id!
-- AI learns from ALL brands mixed together
-- Cannot distinguish E-commerce vs Support context
```

**Query:**
```sql
-- When AI generates response for E-commerce:
SELECT answer 
FROM ai_training_data
WHERE tenant_id = 'acme-corp'
  AND question SIMILAR TO 'authenticate'
ORDER BY rating DESC
LIMIT 1;

-- Returns: Support Portal's technical answer
-- Applied to: E-commerce customer
-- Result: WRONG CONTEXT!
```

**Better Schema:**
```sql
ai_training_data (
  id,
  tenant_id,
  website_id,      -- ✅ Brand-specific learning
  question,
  answer,
  rating,
  context_tags JSON,  -- ['e-commerce', 'shipping', 'retail']
  learned_from_session_id
)
```

**Query (Improved):**
```sql
-- When AI generates response for E-commerce:
SELECT answer 
FROM ai_training_data
WHERE tenant_id = 'acme-corp'
  AND website_id = 1  -- ✅ E-commerce only
  AND question SIMILAR TO 'authenticate'
ORDER BY rating DESC
LIMIT 1;

-- Returns: E-commerce context answer
-- "To login to your shopping account, visit store.acme.com..."
-- Result: CORRECT!
```

---

## Scenario 4: AI Agent Personality Mismatch

### **Setup:**

**Brands with Different Personalities:**

```
🛒 E-commerce Store:
- Tone: Casual, friendly, emoji-rich
- Voice: "Hey! 👋 We're so excited to help!"
- Target: B2C consumers
- Example: "Awesome! 🎉 Your order is on its way! Track it here: [link]"

🎧 Support Portal:
- Tone: Professional, technical, precise
- Voice: "I can assist you with that."
- Target: B2B developers
- Example: "Error 403 indicates insufficient permissions. Verify your API key scope."

📱 Marketing Agency:
- Tone: Consultative, professional, data-driven
- Voice: "Let's discuss how we can help achieve your goals."
- Target: B2B decision-makers
- Example: "Based on your industry, we recommend our Enterprise package."
```

### **Problem: WhatsApp Shared Number**

**Scenario:**
```
Customer: "Hi, can you help me?"
WhatsApp: +1-555-0100 (shared across all brands)
Routing: Keyword detection FAILS (too vague)
System: Routes to DEFAULT brand (E-commerce)

E-commerce AI responds:
"Hey there! 👋 We'd love to help! 🎉 
What can we do for you today? 
Looking for awesome products? 🛍️"

Customer (actually a B2B client):
"I wanted to discuss enterprise marketing services..."

Problem: WRONG PERSONALITY!
- Customer expected professional tone
- Got casual retail vibe
- Brand perception damaged
```

### **Solution: Brand-Aware AI Profiles**

**Database Schema:**
```sql
ai_agent_config (
  id,
  tenant_id,
  website_id,      -- ✅ Each brand has own AI
  profile_name,
  personality_tone ENUM('casual', 'professional', 'technical', 'friendly'),
  emoji_usage ENUM('none', 'minimal', 'moderate', 'heavy'),
  formality_level INT,  -- 1-10
  target_audience VARCHAR(100),
  system_prompt TEXT,
  example_responses JSON
)
```

**Example Data:**
```sql
-- E-commerce AI
INSERT INTO ai_agent_config VALUES (
  1, 'acme-corp', 1, 'Store Assistant',
  'friendly', 'heavy', 3, 'B2C consumers',
  'You are a friendly shopping assistant. Use casual tone and emojis.',
  '{"greeting": "Hey! 👋 How can I help?", "closing": "Happy shopping! 🛍️"}'
);

-- Support AI
INSERT INTO ai_agent_config VALUES (
  2, 'acme-corp', 2, 'Technical Support',
  'technical', 'none', 9, 'B2B developers',
  'You are a technical support engineer. Be precise and professional.',
  '{"greeting": "Hello. How may I assist you?", "closing": "Let me know if you need further assistance."}'
);

-- Marketing AI
INSERT INTO ai_agent_config VALUES (
  3, 'acme-corp', 3, 'Marketing Consultant',
  'professional', 'minimal', 8, 'B2B decision-makers',
  'You are a marketing consultant. Be consultative and data-driven.',
  '{"greeting": "Good day. How can we help achieve your marketing goals?", "closing": "I look forward to discussing further."}'
);
```

**AI Response Generation:**
```javascript
async function generateAIResponse(sessionId, userMessage) {
  // Get session details
  const session = await getSession(sessionId);
  const websiteId = session.website_id;
  
  // Get brand-specific AI config
  const aiConfig = await getAIConfig(session.tenant_id, websiteId);
  
  // Get brand-specific knowledge base
  const kbContext = await searchKB(
    session.tenant_id, 
    websiteId,  // ✅ Filter by brand
    userMessage
  );
  
  // Get brand-specific training data
  const trainingData = await getTrainingData(
    session.tenant_id,
    websiteId,  // ✅ Learn from same brand only
    userMessage
  );
  
  // Generate response with brand context
  const response = await aiService.generate({
    systemPrompt: aiConfig.system_prompt,
    tone: aiConfig.personality_tone,
    emojiUsage: aiConfig.emoji_usage,
    knowledgeBase: kbContext,
    trainingData: trainingData,
    userMessage: userMessage
  });
  
  return response;
}
```

---

## Scenario 5: Product/Service Knowledge Separation

### **The Challenge: Each Brand Has Different Inventory**

```
🛒 E-commerce Store:
Products:
- Nike Air Max Shoes - $120
- Levi's Jeans - $80
- Adidas T-Shirt - $30

🎧 Support Portal:
Products (SaaS Plans):
- Starter Plan - $29/month
- Professional Plan - $99/month
- Enterprise Plan - Custom pricing

📱 Marketing Agency:
Services:
- Social Media Package - $2,500/month
- SEO Optimization - $5,000/month
- Full Marketing Suite - $15,000/month
```

### **Problem: Product Lookup Confusion**

**Scenario:**
```
Customer: "What's your starter plan?"

If routed to E-commerce:
❌ "I'm sorry, we don't have a 'starter plan' product. 
    Did you mean our starter shoe collection?"

If routed to Support:
✅ "Our Starter Plan is $29/month and includes:
    - 10,000 API calls/month
    - Basic support
    - 99.9% uptime SLA"

If routed to Marketing:
❌ "We don't have a 'starter plan'. Our entry-level 
    package is Social Media Management at $2,500/month."
```

### **Solution: Brand-Specific Product Database**

**Schema:**
```sql
products (
  id,
  tenant_id,
  website_id,  -- ✅ Each brand has own catalog
  name,
  type ENUM('physical', 'service', 'subscription', 'plan'),
  price DECIMAL,
  description TEXT,
  metadata JSON
)

-- E-commerce products
INSERT INTO products VALUES 
(1, 'acme', 1, 'Nike Air Max', 'physical', 120.00, '...', '{"sku": "NIKE-123"}');

-- SaaS plans
INSERT INTO products VALUES 
(100, 'acme', 2, 'Starter Plan', 'subscription', 29.00, '...', '{"api_calls": 10000}');

-- Marketing services
INSERT INTO products VALUES 
(200, 'acme', 3, 'Social Media Package', 'service', 2500.00, '...', '{"platforms": ["FB", "IG", "TW"]}');
```

**AI Query (Context-Aware):**
```javascript
async function lookupProduct(websiteId, productQuery) {
  // Only search THIS brand's products
  const products = await db.query(`
    SELECT * FROM products
    WHERE website_id = ?
      AND (name LIKE ? OR description LIKE ?)
    LIMIT 5
  `, [websiteId, `%${productQuery}%`, `%${productQuery}%`]);
  
  return products;
}

// When customer asks about "starter plan"
const session = { website_id: 2 };  // Support Portal
const results = await lookupProduct(session.website_id, 'starter plan');

// Returns: Support Portal's Starter Plan (SaaS)
// NOT: E-commerce products or Marketing services
```

---

## Scenario 6: Cross-Brand Customer History

### **Complex Case: Customer Interacts with Multiple Brands**

**Customer: Jennifer**
- Week 1: Bought shoes from E-commerce Store
- Week 2: Signed up for SaaS plan on Support Portal
- Week 3: Inquired about marketing services
- Week 4: Contacts WhatsApp about "my account"

### **The Question: Which "Account" Does She Mean?**

**Agent View (Enhanced with Brand Context):**
```
┌────────────────────────────────────────────────────────────┐
│ 💬 Jennifer • WhatsApp • [🌐 ???]                         │
│                                                            │
│ Jennifer: "I can't access my account"                      │
│                                                            │
│ 📊 Customer History (Multi-Brand):                        │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🛒 E-commerce Store:                                   │ │
│ │    • Customer since: Week 1                           │ │
│ │    • Orders: 2 (Total: $240)                          │ │
│ │    • Account: jennifer@email.com                      │ │
│ │    • Last login: 2 days ago ✅                        │ │
│ │    • Status: Active                                   │ │
│ │                                                        │ │
│ │ 🎧 Support Portal:                                     │ │
│ │    • Customer since: Week 2                           │ │
│ │    • Plan: Starter ($29/month)                        │ │
│ │    • Account: jennifer@email.com                      │ │
│ │    • Last login: 3 weeks ago ⚠️                       │ │
│ │    • Status: Payment failed ❌                        │ │
│ │                                                        │ │
│ │ 📱 Marketing Agency:                                   │ │
│ │    • Inquiry: Week 3                                  │ │
│ │    • Status: Lead (not customer yet)                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ 🤖 AI Suggestion:                                         │
│ "Based on 'payment failed' status, she likely means      │
│  Support Portal account. Ask: 'Is this about your        │
│  Starter Plan subscription?'"                             │
│                                                            │
│ Agent Options:                                             │
│ [Tag as E-commerce] [Tag as Support] [Tag as Marketing]  │
└────────────────────────────────────────────────────────────┘
```

**AI-Powered Brand Detection:**
```javascript
async function detectIntendedBrand(customerId, message) {
  // Get customer's activity across all brands
  const history = await getCustomerHistory(customerId);
  
  // Analyze recent activity
  const recentBrands = history
    .filter(activity => activity.date > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .map(a => a.website_id);
  
  // Check for issues/alerts per brand
  const issues = await getCustomerIssues(customerId);
  // issues = [{ website_id: 2, type: 'payment_failed', severity: 'high' }]
  
  // Analyze message keywords
  const keywords = extractKeywords(message);
  // "access" + "account" = ambiguous
  
  // Score each brand
  const scores = {
    1: 0, // E-commerce
    2: 0, // Support
    3: 0  // Marketing
  };
  
  // Factor 1: Recent activity (last 7 days)
  recentBrands.forEach(bid => scores[bid] += 2);
  
  // Factor 2: Active issues
  issues.forEach(issue => {
    if (issue.severity === 'high') scores[issue.website_id] += 5;
    else scores[issue.website_id] += 2;
  });
  
  // Factor 3: Keyword matching
  const keywordScores = scoreKeywordsByBrand(keywords);
  Object.keys(keywordScores).forEach(bid => {
    scores[bid] += keywordScores[bid];
  });
  
  // Result: Support Portal (website_id: 2) has highest score
  // Reason: Payment failed (high severity issue)
  return { 
    detectedBrand: 2, 
    confidence: 'high',
    reason: 'Active payment issue on Support Portal account'
  };
}
```

---

## Database Schema Requirements for Brand-Specific AI/KB

### **1. Knowledge Base with Brand Scoping**

```sql
CREATE TABLE knowledge_base_articles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id VARCHAR(36) NOT NULL,
  website_id BIGINT NULL,  -- ✅ NULL = shared, value = brand-specific
  
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags JSON,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,  -- Higher = shown first
  
  -- Usage tracking
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_website (tenant_id, website_id),
  INDEX idx_search (tenant_id, website_id, is_active),
  FULLTEXT INDEX idx_content (title, content),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);
```

**Search Query (Brand-Aware):**
```sql
-- Search for E-commerce articles only
SELECT * FROM knowledge_base_articles
WHERE tenant_id = 'acme-corp'
  AND (website_id = 1 OR website_id IS NULL)  -- E-commerce or shared
  AND is_active = true
  AND MATCH(title, content) AGAINST('shipping policy' IN NATURAL LANGUAGE MODE)
ORDER BY 
  CASE 
    WHEN website_id = 1 THEN 0  -- Prioritize brand-specific
    ELSE 1 
  END,
  priority DESC,
  helpful_count DESC
LIMIT 10;
```

### **2. AI Training Data with Brand Context**

```sql
CREATE TABLE ai_training_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id VARCHAR(36) NOT NULL,
  website_id BIGINT NULL,  -- ✅ Learn per brand
  
  session_id BIGINT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  
  -- Feedback
  rating INT,  -- 1-5 stars
  was_helpful BOOLEAN,
  
  -- Context
  context_tags JSON,  -- ['shipping', 'returns', 'e-commerce']
  conversation_metadata JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_website (tenant_id, website_id),
  INDEX idx_learning (tenant_id, website_id, rating),
  FULLTEXT INDEX idx_question (question),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

**Learning Query (Brand-Specific):**
```sql
-- Learn from E-commerce interactions only
SELECT question, answer, rating
FROM ai_training_data
WHERE tenant_id = 'acme-corp'
  AND website_id = 1  -- ✅ E-commerce only
  AND rating >= 4  -- Only successful interactions
  AND MATCH(question) AGAINST('shipping' IN NATURAL LANGUAGE MODE)
ORDER BY rating DESC, created_at DESC
LIMIT 20;
```

### **3. AI Agent Configuration Per Brand**

```sql
CREATE TABLE ai_agent_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id VARCHAR(36) NOT NULL,
  website_id BIGINT NOT NULL,  -- ✅ Each brand MUST have config
  
  profile_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  
  -- Personality
  personality_tone ENUM('casual', 'professional', 'technical', 'friendly', 'consultative'),
  formality_level INT,  -- 1-10
  emoji_usage ENUM('none', 'minimal', 'moderate', 'heavy'),
  
  -- Audience
  target_audience VARCHAR(255),  -- 'B2C consumers', 'B2B developers', etc.
  
  -- Prompts
  system_prompt TEXT,
  greeting_template VARCHAR(500),
  closing_template VARCHAR(500),
  
  -- Model config
  ai_model VARCHAR(100) DEFAULT 'gemini-1.5-flash',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INT DEFAULT 1000,
  
  -- Behavior
  auto_respond BOOLEAN DEFAULT false,
  response_delay_seconds INT DEFAULT 2,
  
  -- Context
  use_knowledge_base BOOLEAN DEFAULT true,
  use_training_data BOOLEAN DEFAULT true,
  use_customer_history BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_website_config (tenant_id, website_id),
  INDEX idx_active (tenant_id, is_active),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);
```

### **4. Product/Service Catalog Per Brand**

```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id VARCHAR(36) NOT NULL,
  website_id BIGINT NOT NULL,  -- ✅ Each brand has own catalog
  
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  
  type ENUM('physical', 'digital', 'service', 'subscription', 'plan'),
  category VARCHAR(100),
  
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  description TEXT,
  short_description VARCHAR(500),
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  stock_quantity INT,
  
  -- Metadata
  metadata JSON,  -- Brand-specific fields
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_website (tenant_id, website_id),
  INDEX idx_search (tenant_id, website_id, is_active),
  INDEX idx_sku (tenant_id, sku),
  FULLTEXT INDEX idx_name_desc (name, description),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);
```

---

## Agent Workflow: Brand-Aware AI & KB

### **Complete Flow:**

```javascript
// 1. Message arrives
async function handleIncomingMessage(sessionId, message) {
  // Get session with brand context
  const session = await getSession(sessionId);
  const { tenant_id, website_id, channel_type } = session;
  
  // 2. Get brand-specific AI config
  const aiConfig = await db.query(`
    SELECT * FROM ai_agent_config
    WHERE tenant_id = ? AND website_id = ?
  `, [tenant_id, website_id]);
  
  // 3. Search brand-specific knowledge base
  const kbArticles = await db.query(`
    SELECT title, content, id 
    FROM knowledge_base_articles
    WHERE tenant_id = ?
      AND (website_id = ? OR website_id IS NULL)
      AND is_active = true
      AND MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)
    ORDER BY 
      CASE WHEN website_id = ? THEN 0 ELSE 1 END,
      priority DESC
    LIMIT 5
  `, [tenant_id, website_id, message, website_id]);
  
  // 4. Get brand-specific training data
  const trainingExamples = await db.query(`
    SELECT question, answer 
    FROM ai_training_data
    WHERE tenant_id = ?
      AND website_id = ?
      AND rating >= 4
      AND MATCH(question) AGAINST(? IN NATURAL LANGUAGE MODE)
    LIMIT 10
  `, [tenant_id, website_id, message]);
  
  // 5. Get customer history (cross-brand)
  const customerHistory = await getCustomerHistory(session.visitor_email);
  
  // 6. Build AI context
  const context = {
    brand: {
      name: session.website.name,
      tone: aiConfig.personality_tone,
      audience: aiConfig.target_audience
    },
    knowledge: kbArticles.map(a => a.content).join('\n\n'),
    examples: trainingExamples,
    customerHistory: customerHistory
  };
  
  // 7. Generate brand-appropriate response
  const aiResponse = await generateAIResponse(
    aiConfig.system_prompt,
    context,
    message
  );
  
  // 8. Show to agent with brand context
  return {
    suggestedResponse: aiResponse,
    relevantKB: kbArticles,
    brandContext: {
      name: session.website.name,
      tone: aiConfig.personality_tone
    }
  };
}
```

### **Agent Interface (Brand-Aware):**

```
┌──────────────────────────────────────────────────────────────┐
│ 💬 Customer: Alice • WhatsApp • [🛒 E-commerce Store]       │
│                                                              │
│ Alice: "Do you have this in size 10?"                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 🤖 AI Suggestion (E-commerce tone - Friendly):              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ "Hey Alice! 👋 Great question! Let me check that for  │  │
│ │  you! Which product are you interested in? 🛍️         │  │
│ │                                                        │  │
│ │  Or if you can share a link/name, I can check stock   │  │
│ │  for size 10 right away! 😊"                          │  │
│ │                                                        │  │
│ │ [Use This Response] [Edit] [Ignore]                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 📚 Relevant Knowledge (E-commerce KB):                      │
│ • Size Chart Guide                                          │
│ • Stock Availability Policy                                 │
│ • How to Check Product Sizes                                │
│                                                              │
│ 📦 Quick Actions (E-commerce):                              │
│ • Check Product Stock                                       │
│ • View Size Chart                                           │
│ • Find Similar Items                                        │
└──────────────────────────────────────────────────────────────┘
```

**Compare to Support Portal tone:**
```
┌──────────────────────────────────────────────────────────────┐
│ 💬 Developer: Bob • Email • [🎧 Support Portal]             │
│                                                              │
│ Bob: "Do you have this in version 2.0?"                      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 🤖 AI Suggestion (Support tone - Technical):                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ "Hello. Yes, version 2.0 is available. It includes:   │  │
│ │                                                        │  │
│ │ • Breaking changes in authentication flow              │  │
│ │ • New endpoints documented at /v2/docs                 │  │
│ │ • Migration guide: https://docs.acme.com/v2-migration │  │
│ │                                                        │  │
│ │ Current SDK version: 2.0.3                            │  │
│ │ npm install @acme/sdk@2.0.3                           │  │
│ │                                                        │  │
│ │ Do you need assistance with migration?"                │  │
│ │                                                        │  │
│ │ [Use This Response] [Edit] [Ignore]                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 📚 Relevant Knowledge (Support KB):                         │
│ • Version 2.0 Release Notes                                 │
│ • Migration Guide v1 → v2                                   │
│ • API Breaking Changes                                      │
│                                                              │
│ 📦 Quick Actions (Support):                                 │
│ • View API Docs                                             │
│ • Check Client SDK Version                                  │
│ • Open Migration Ticket                                     │
└──────────────────────────────────────────────────────────────┘
```

**Same question, completely different context!**

---

## Critical Recommendations

### **1. Brand Context MUST Flow Through Entire System**

```
Message arrives
↓
Detect/route to brand (website_id)
↓
Load brand-specific:
  • AI config (personality, tone)
  • Knowledge base (filtered)
  • Training data (learned from this brand)
  • Product catalog (this brand's inventory)
  • Customer history (tagged by brand)
↓
Generate brand-appropriate response
↓
Show to agent with brand context
↓
Save interaction with brand tag for future learning
```

### **2. Database Schema Must Support Brand Isolation**

Every AI/KB-related table needs `website_id`:
- ✅ `ai_agent_config` (already has it)
- ✅ `knowledge_base_articles` (add it)
- ✅ `ai_training_data` (add it)
- ✅ `products` (add it)
- ✅ `chat_sessions` (already has it)

### **3. Prevent Cross-Brand Contamination**

```sql
-- ALWAYS filter by website_id
WHERE tenant_id = ? AND website_id = ?

-- Allow shared resources
WHERE tenant_id = ? AND (website_id = ? OR website_id IS NULL)

-- NEVER query without brand context
-- ❌ WHERE tenant_id = ?  (BAD: mixes all brands)
-- ✅ WHERE tenant_id = ? AND website_id = ?  (GOOD: brand-specific)
```

### **4. Smart Routing is Critical**

```javascript
// Multi-factor routing for ambiguous messages
function routeMessage(message, customerHistory, activeIssues) {
  const scores = {};
  
  // Factor 1: Keywords (30% weight)
  const keywordScores = analyzeKeywords(message);
  
  // Factor 2: Customer history (20% weight)
  const historyScores = analyzeHistory(customerHistory);
  
  // Factor 3: Active issues (40% weight) ← HIGHEST
  const issueScores = analyzeIssues(activeIssues);
  
  // Factor 4: Recent activity (10% weight)
  const activityScores = analyzeActivity(customerHistory);
  
  // Combine with weights
  const finalScores = combineScores(
    keywordScores * 0.3,
    historyScores * 0.2,
    issueScores * 0.4,
    activityScores * 0.1
  );
  
  return {
    website_id: getHighestScore(finalScores),
    confidence: calculateConfidence(finalScores),
    reason: explainDecision(finalScores)
  };
}
```

### **5. Agent Tools Must Be Brand-Aware**

All quick actions inherit conversation's brand context:
- "Check Order" → Searches E-commerce orders
- "View Ticket" → Searches Support tickets
- "Product Lookup" → Searches E-commerce catalog
- "Check API Key" → Looks up Support Portal credentials

### **6. Cross-Brand Intelligence (When Needed)**

Show cross-brand history but with clear labels:
```
Customer History:
├── [🛒 E-commerce] 2 orders, $240 total
├── [🎧 Support Portal] Active Starter Plan, Payment Issue ⚠️
└── [📱 Marketing] Inquiry (not customer yet)

Current Conversation: [🎧 Support Portal]
Most likely about: Payment Issue (Active alert)
```

---

## Final Architecture Validation

### **Does Metadata + Drill-down Work for AI/KB?**

✅ **YES, with brand context enhancement!**

**Agent View (Operations):**
- Shows ALL conversations (no context switching)
- Each conversation has brand badge [🛒] [🎧] [📱]
- Quick actions auto-scope to conversation's brand
- KB search auto-filters to conversation's brand
- AI suggestions use conversation's brand personality

**Admin View (Configuration):**
- Drill down to specific brand
- Configure AI personality for THAT brand
- Manage KB articles for THAT brand
- Upload products for THAT brand
- Train AI for THAT brand

**Result:**
- ✅ Agents work efficiently (see all, handle all)
- ✅ AI responds correctly (brand-appropriate)
- ✅ KB is relevant (no cross-contamination)
- ✅ Admins configure clearly (per-brand drill-down)

**The key:** Brand context (website_id) flows through EVERY layer:
```
Database → Backend → AI Service → Frontend → Agent
   ↓          ↓           ↓            ↓         ↓
website_id  website_id  website_id  website_id  badge
```

---

## Next Implementation Steps

1. **Database Schema Updates:**
   - Add `website_id` to `knowledge_base_articles`
   - Add `website_id` to `ai_training_data`
   - Add `products` table with `website_id`

2. **Backend API Updates:**
   - KB search endpoint: Filter by `website_id`
   - AI generation: Load brand-specific config
   - Training data: Save with `website_id`

3. **Frontend Updates:**
   - Show brand badge on every conversation
   - Filter KB results by conversation's brand
   - Display AI suggestions with brand tone indicator

4. **AI Service Updates:**
   - Load brand-specific system prompts
   - Filter training data by brand
   - Adjust tone/personality per brand

5. **Testing:**
   - Verify E-commerce AI uses casual tone
   - Verify Support AI uses technical tone
   - Verify KB results don't cross-contaminate
   - Test routing with ambiguous messages

**Architecture validated! Ready to implement with brand-specific AI/KB! 🚀**
