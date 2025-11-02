package chat

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
	"gorm.io/gorm"
)

// AIAgentService handles AI-powered chat responses using Gemini + RAG
type AIAgentService struct {
	db                  *gorm.DB
	geminiAPIKey        string
	defaultSystemPrompt string
}

// NewAIAgentService creates a new AI agent service
func NewAIAgentService(db *gorm.DB, geminiAPIKey string) *AIAgentService {
	return &AIAgentService{
		db:           db,
		geminiAPIKey: geminiAPIKey,
		defaultSystemPrompt: `You are a helpful customer service AI assistant. 
Be friendly, professional, and concise in your responses.
If you cannot answer a question with confidence, politely offer to connect the customer with a human agent.
Always prioritize customer satisfaction and provide accurate information based on the provided knowledge base.
Never make up information - if you don't know something, admit it.`,
	}
}

// AIResponse represents the AI agent's response
type AIResponse struct {
	Content       string            `json:"content"`
	Action        string            `json:"action"` // "continue", "handoff", "close"
	Confidence    float64           `json:"confidence"`
	Intent        string            `json:"intent"`
	Sentiment     float64           `json:"sentiment"`
	Entities      map[string]string `json:"entities"`
	HandoffReason string            `json:"handoff_reason,omitempty"`
	QueueID       *int64            `json:"queue_id,omitempty"`
	KnowledgeUsed []int64           `json:"knowledge_used,omitempty"`
}

// ProcessMessage handles incoming customer messages and generates AI responses
func (s *AIAgentService) ProcessMessage(ctx context.Context, tenantID string, conversationID int64, customerMessage string) (*AIResponse, error) {
	// 1. Get AI configuration for tenant
	var config AIAgentConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		return nil, fmt.Errorf("failed to get AI config: %w", err)
	}

	if !config.IsEnabled {
		return &AIResponse{
			Action:        "handoff",
			Content:       config.FallbackMessage,
			HandoffReason: "AI agent disabled for tenant",
		}, nil
	}

	// 2. Get conversation context (using ChatSession)
	var session ChatSession
	if err := s.db.First(&session, conversationID).Error; err != nil {
		return nil, fmt.Errorf("failed to get conversation: %w", err)
	}

	// 3. Get message history (using ChatMessage)
	var chatMessages []ChatMessage
	if err := s.db.Where("session_id = ?", conversationID).
		Order("created_at ASC").
		Limit(20). // Last 20 messages for context
		Find(&chatMessages).Error; err != nil {
		return nil, fmt.Errorf("failed to get message history: %w", err)
	}

	// 4. Search knowledge base (RAG)
	var knowledgeContext string
	var knowledgeIDs []int64
	if config.RAGEnabled {
		kb, ids, err := s.searchKnowledgeBase(tenantID, customerMessage, config.RAGMaxResults)
		if err == nil && kb != "" {
			knowledgeContext = fmt.Sprintf("\n\n=== KNOWLEDGE BASE ===\n%s\n=== END KNOWLEDGE BASE ===\n", kb)
			knowledgeIDs = ids
		}
	}

	// 5. Build system prompt
	systemPrompt := config.SystemPrompt
	if systemPrompt == "" {
		systemPrompt = s.defaultSystemPrompt
	}
	systemPrompt += knowledgeContext

	// 6. Check handoff rules BEFORE calling AI
	shouldHandoff, handoffReason, queueID := s.checkHandoffRules(tenantID, &session, customerMessage, chatMessages)
	if shouldHandoff {
		return &AIResponse{
			Action:        "handoff",
			Content:       s.getHandoffMessage(tenantID, handoffReason),
			HandoffReason: handoffReason,
			QueueID:       queueID,
		}, nil
	}

	// Convert ChatMessage to Message for Gemini processing
	messages := make([]Message, len(chatMessages))
	for i, cm := range chatMessages {
		content := ""
		if cm.Body != nil {
			content = *cm.Body
		}
		messages[i] = Message{
			ID:         cm.ID,
			SenderType: cm.SenderType,
			SenderName: cm.SenderName,
			Content:    content,
			SentAt:     cm.CreatedAt,
		}
	}

	// Count bot messages for later checks
	botMessageCount := 0
	for _, msg := range chatMessages {
		if msg.SenderType == "bot" {
			botMessageCount++
		}
	}

	// 7. Call Gemini API
	apiKey := config.APIKeyEncrypted
	if apiKey == "" {
		apiKey = s.geminiAPIKey // Use default
	}

	geminiResponse, err := s.callGemini(ctx, apiKey, config.Model, systemPrompt, messages, customerMessage, config.MaxTokens, config.Temperature)
	if err != nil {
		return nil, fmt.Errorf("gemini API error: %w", err)
	}

	// 8. Analyze sentiment
	sentiment := s.analyzeSentiment(customerMessage)

	// 9. Detect intent
	intent := s.detectIntent(customerMessage, geminiResponse)

	// 10. Extract entities (basic)
	entities := s.extractEntities(customerMessage)

	// 11. Calculate confidence
	confidence := s.calculateConfidence(geminiResponse, knowledgeContext)

	// 12. Check if handoff needed based on response
	if confidence < config.HandoffConfidenceThreshold ||
		sentiment < -0.6 ||
		botMessageCount >= config.HandoffMessageCount {
		return &AIResponse{
			Action:        "handoff",
			Content:       config.FallbackMessage,
			Confidence:    confidence,
			Intent:        intent,
			Sentiment:     sentiment,
			Entities:      entities,
			HandoffReason: s.determineHandoffReason(confidence, sentiment, botMessageCount),
		}, nil
	}

	// 13. Update session metadata (track AI usage)
	// Could add bot_message_count and confidence to session metadata in future

	// 14. Track knowledge base usage
	if len(knowledgeIDs) > 0 {
		s.trackKnowledgeUsage(knowledgeIDs)
	}

	return &AIResponse{
		Content:       geminiResponse,
		Action:        "continue",
		Confidence:    confidence,
		Intent:        intent,
		Sentiment:     sentiment,
		Entities:      entities,
		KnowledgeUsed: knowledgeIDs,
	}, nil
}

// searchKnowledgeBase performs semantic search on knowledge base (RAG)
func (s *AIAgentService) searchKnowledgeBase(tenantID, query string, maxResults int) (string, []int64, error) {
	// For now, use full-text search. In production, use vector embeddings (pgvector)
	var kbEntries []KnowledgeBase

	// Build search query
	searchTerms := strings.ToLower(query)

	err := s.db.Where("tenant_id = ? AND is_active = true", tenantID).
		Where("MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)", searchTerms).
		Order("priority DESC, usage_count DESC").
		Limit(maxResults).
		Find(&kbEntries).Error

	if err != nil || len(kbEntries) == 0 {
		return "", nil, err
	}

	// Build context string
	var contextBuilder strings.Builder
	var ids []int64

	for i, entry := range kbEntries {
		ids = append(ids, entry.ID)
		contextBuilder.WriteString(fmt.Sprintf("\n[KB %d]\nQuestion: %s\nAnswer: %s\n", i+1, entry.Question, entry.Answer))
	}

	return contextBuilder.String(), ids, nil
}

// callGemini makes API call to Google Gemini
func (s *AIAgentService) callGemini(ctx context.Context, apiKey, model, systemPrompt string, history []Message, userMessage string, maxTokens int, temperature float64) (string, error) {
	// Initialize Gemini client
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return "", fmt.Errorf("failed to create Gemini client: %w", err)
	}
	defer client.Close()

	// Select model (default: gemini-pro)
	if model == "" {
		model = "gemini-pro"
	}

	geminiModel := client.GenerativeModel(model)

	// Configure model
	geminiModel.SetMaxOutputTokens(int32(maxTokens))
	geminiModel.SetTemperature(float32(temperature))
	geminiModel.SetTopP(0.95)
	geminiModel.SetTopK(40)

	// Set system instruction
	geminiModel.SystemInstruction = &genai.Content{
		Parts: []genai.Part{
			genai.Text(systemPrompt),
		},
	}

	// Build conversation history
	var contents []*genai.Content

	for _, msg := range history {
		role := "user"
		if msg.SenderType == "bot" {
			role = "model"
		} else if msg.SenderType == "agent" {
			continue // Skip agent messages in bot context
		}

		contents = append(contents, &genai.Content{
			Role: role,
			Parts: []genai.Part{
				genai.Text(msg.Content),
			},
		})
	}

	// Add current user message
	contents = append(contents, &genai.Content{
		Role: "user",
		Parts: []genai.Part{
			genai.Text(userMessage),
		},
	})

	// Start chat session
	chat := geminiModel.StartChat()
	chat.History = contents[:len(contents)-1] // All except last message

	// Send message and get response
	resp, err := chat.SendMessage(ctx, genai.Text(userMessage))
	if err != nil {
		return "", fmt.Errorf("gemini API call failed: %w", err)
	}

	// Extract response text
	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini")
	}

	responseText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])

	return responseText, nil
}

// checkHandoffRules checks if any handoff rules are triggered
func (s *AIAgentService) checkHandoffRules(tenantID string, session *ChatSession, message string, history []ChatMessage) (bool, string, *int64) {
	var rules []HandoffRule
	s.db.Where("tenant_id = ? AND is_active = true", tenantID).
		Order("priority DESC").
		Find(&rules)

	messageLower := strings.ToLower(message)

	// Count bot messages in history
	botMessageCount := 0
	for _, msg := range history {
		if msg.SenderType == "bot" {
			botMessageCount++
		}
	}

	for _, rule := range rules {
		triggered := false
		reason := rule.Name

		switch rule.TriggerType {
		case "keyword":
			keywords := strings.Split(strings.ToLower(rule.TriggerValue), ",")
			for _, keyword := range keywords {
				if strings.Contains(messageLower, strings.TrimSpace(keyword)) {
					triggered = true
					break
				}
			}

		case "message_count":
			if botMessageCount >= parseIntOrDefault(rule.TriggerValue, 10) {
				triggered = true
			}

		case "confidence":
			// Skip confidence check since we don't store it in session
			continue

		case "sentiment":
			sentiment := s.analyzeSentiment(message)
			threshold := parseFloatOrDefault(rule.TriggerValue, -0.5)
			if sentiment < threshold {
				triggered = true
			}

		case "timeout":
			// Check if conversation has been going too long
			duration := time.Since(session.CreatedAt).Seconds()
			timeout := parseFloatOrDefault(rule.TriggerValue, 300)
			if duration > timeout {
				triggered = true
			}
		}

		if triggered {
			// Update rule execution count
			s.db.Model(&rule).Updates(map[string]interface{}{
				"execution_count":  gorm.Expr("execution_count + 1"),
				"last_executed_at": time.Now(),
			})
			return true, reason, rule.TargetQueueID
		}
	}

	return false, "", nil
}

// analyzeSentiment performs basic sentiment analysis
func (s *AIAgentService) analyzeSentiment(text string) float64 {
	text = strings.ToLower(text)

	// Positive words
	positive := []string{"good", "great", "excellent", "happy", "love", "thanks", "thank", "perfect", "awesome", "wonderful"}
	// Negative words
	negative := []string{"bad", "terrible", "awful", "hate", "angry", "frustrated", "upset", "disappointed", "horrible", "worst", "useless", "waste"}

	score := 0.0
	words := strings.Fields(text)

	for _, word := range words {
		for _, pos := range positive {
			if strings.Contains(word, pos) {
				score += 0.2
			}
		}
		for _, neg := range negative {
			if strings.Contains(word, neg) {
				score -= 0.3
			}
		}
	}

	// Normalize to -1 to 1
	if score > 1 {
		score = 1
	} else if score < -1 {
		score = -1
	}

	return score
}

// detectIntent detects the customer's intent
func (s *AIAgentService) detectIntent(userMessage, botResponse string) string {
	lower := strings.ToLower(userMessage)

	intentKeywords := map[string][]string{
		"refund_request":    {"refund", "money back", "return"},
		"product_inquiry":   {"product", "item", "price", "cost", "how much"},
		"order_status":      {"order", "tracking", "delivery", "shipped"},
		"technical_support": {"not working", "broken", "error", "problem", "issue", "help"},
		"billing":           {"bill", "charge", "payment", "invoice", "credit card"},
		"account":           {"account", "login", "password", "register", "sign up"},
		"complaint":         {"complain", "disappointed", "terrible", "awful"},
		"greeting":          {"hello", "hi", "hey", "good morning", "good afternoon"},
		"general_inquiry":   {"what", "how", "when", "where", "why"},
	}

	for intent, keywords := range intentKeywords {
		for _, keyword := range keywords {
			if strings.Contains(lower, keyword) {
				return intent
			}
		}
	}

	return "unknown"
}

// extractEntities extracts basic entities from text
func (s *AIAgentService) extractEntities(text string) map[string]string {
	entities := make(map[string]string)

	// Extract email
	if strings.Contains(text, "@") {
		words := strings.Fields(text)
		for _, word := range words {
			if strings.Contains(word, "@") && strings.Contains(word, ".") {
				entities["email"] = word
				break
			}
		}
	}

	// Extract phone (basic US format)
	words := strings.Fields(text)
	for _, word := range words {
		// Remove non-digits
		digits := strings.Map(func(r rune) rune {
			if r >= '0' && r <= '9' {
				return r
			}
			return -1
		}, word)

		if len(digits) == 10 || len(digits) == 11 {
			entities["phone"] = digits
			break
		}
	}

	return entities
}

// calculateConfidence calculates confidence score for the response
func (s *AIAgentService) calculateConfidence(response, knowledgeContext string) float64 {
	confidence := 0.8 // Base confidence

	// Lower confidence if response is short
	if len(response) < 20 {
		confidence -= 0.2
	}

	// Higher confidence if knowledge base was used
	if knowledgeContext != "" {
		confidence += 0.15
	}

	// Lower confidence for uncertain phrases
	uncertainPhrases := []string{
		"i'm not sure", "i don't know", "i might be wrong",
		"i don't have information", "i cannot confirm",
	}
	responseLower := strings.ToLower(response)
	for _, phrase := range uncertainPhrases {
		if strings.Contains(responseLower, phrase) {
			confidence -= 0.4
			break
		}
	}

	// Clamp between 0 and 1
	if confidence > 1 {
		confidence = 1
	} else if confidence < 0 {
		confidence = 0
	}

	return confidence
}

// determineHandoffReason determines why handoff is needed
func (s *AIAgentService) determineHandoffReason(confidence, sentiment float64, messageCount int) string {
	if sentiment < -0.6 {
		return "Negative sentiment detected"
	}
	if confidence < 0.5 {
		return "Low confidence response"
	}
	if messageCount >= 10 {
		return "Maximum bot messages reached"
	}
	return "Manual handoff requested"
}

// getHandoffMessage gets the appropriate handoff message
func (s *AIAgentService) getHandoffMessage(tenantID, reason string) string {
	var rule HandoffRule
	err := s.db.Where("tenant_id = ? AND is_active = true AND name LIKE ?", tenantID, "%"+reason+"%").
		First(&rule).Error

	if err == nil && rule.MessageTemplate != "" {
		return rule.MessageTemplate
	}

	return "Let me connect you with one of our team members who can better assist you."
}

// trackKnowledgeUsage updates usage statistics for knowledge base entries
func (s *AIAgentService) trackKnowledgeUsage(ids []int64) {
	s.db.Model(&KnowledgeBase{}).
		Where("id IN ?", ids).
		Updates(map[string]interface{}{
			"usage_count":  gorm.Expr("usage_count + 1"),
			"last_used_at": time.Now(),
		})
}

// Helper functions
func parseIntOrDefault(s string, defaultVal int) int {
	var val int
	if _, err := fmt.Sscanf(s, "%d", &val); err != nil {
		return defaultVal
	}
	return val
}

func parseFloatOrDefault(s string, defaultVal float64) float64 {
	var val float64
	if _, err := fmt.Sscanf(s, "%f", &val); err != nil {
		return defaultVal
	}
	return val
}

// CreateGreeting generates a greeting message for new conversations
func (s *AIAgentService) CreateGreeting(tenantID string) string {
	var config AIAgentConfig
	if err := s.db.Where("tenant_id = ?", tenantID).First(&config).Error; err != nil {
		return "Hello! How can I help you today?"
	}

	if config.GreetingMessage != "" {
		return config.GreetingMessage
	}

	return "Hello! I'm your AI assistant. How can I help you today?"
}
