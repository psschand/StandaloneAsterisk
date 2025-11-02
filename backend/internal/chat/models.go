package chat

import "time"

// Conversation represents a chat conversation
type Conversation struct {
	ID                 int64      `json:"id" gorm:"primaryKey"`
	TenantID           string     `json:"tenant_id" gorm:"type:varchar(36);not null;index:idx_tenant_status"`
	CustomerID         *int64     `json:"customer_id" gorm:"index:idx_customer"`
	CustomerName       string     `json:"customer_name" gorm:"type:varchar(255)"`
	CustomerPhone      string     `json:"customer_phone" gorm:"type:varchar(50)"`
	CustomerEmail      string     `json:"customer_email" gorm:"type:varchar(255)"`
	Channel            string     `json:"channel" gorm:"type:enum('web','whatsapp','facebook','instagram','twitter','sms','telegram');default:'web';index:idx_channel"`
	ExternalID         string     `json:"external_id" gorm:"type:varchar(255);index:idx_external_id"`
	Status             string     `json:"status" gorm:"type:enum('queued','bot','agent','closed','resolved');default:'bot';index:idx_tenant_status"`
	AssignedAgentID    *int64     `json:"assigned_agent_id" gorm:"index:idx_agent"`
	AssignedQueueID    *int64     `json:"assigned_queue_id"`
	Language           string     `json:"language" gorm:"type:varchar(10);default:'en'"`
	BotConfidence      float64    `json:"bot_confidence" gorm:"default:1.0"`
	BotMessageCount    int        `json:"bot_message_count" gorm:"default:0"`
	HandoffReason      string     `json:"handoff_reason" gorm:"type:varchar(255)"`
	HandoffTriggeredBy string     `json:"handoff_triggered_by" gorm:"type:enum('bot','customer','rule','timeout','agent')"`
	Priority           string     `json:"priority" gorm:"type:enum('low','medium','high','urgent');default:'medium'"`
	Tags               string     `json:"tags" gorm:"type:json"`
	CustomerContext    string     `json:"customer_context" gorm:"type:json"`
	StartedAt          time.Time  `json:"started_at" gorm:"default:CURRENT_TIMESTAMP"`
	AssignedAt         *time.Time `json:"assigned_at"`
	ClosedAt           *time.Time `json:"closed_at"`
	FirstResponseAt    *time.Time `json:"first_response_at"`
	LastMessageAt      time.Time  `json:"last_message_at" gorm:"default:CURRENT_TIMESTAMP;index:idx_last_message"`
	ResolutionTime     *int       `json:"resolution_time"`
	CustomerRating     *int8      `json:"customer_rating"`
	CustomerFeedback   string     `json:"customer_feedback" gorm:"type:text"`
	CreatedAt          time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt          time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (Conversation) TableName() string {
	return "conversations"
}

// Message represents a single message in a conversation
type Message struct {
	ID             int64      `json:"id" gorm:"primaryKey"`
	ConversationID int64      `json:"conversation_id" gorm:"not null;index:idx_conversation"`
	SenderType     string     `json:"sender_type" gorm:"type:enum('customer','agent','bot','system');not null;index:idx_sender"`
	SenderID       *int64     `json:"sender_id" gorm:"index:idx_sender"`
	SenderName     string     `json:"sender_name" gorm:"type:varchar(255)"`
	Content        string     `json:"content" gorm:"type:text;not null"`
	MessageType    string     `json:"message_type" gorm:"type:enum('text','image','video','audio','file','location','template','quick_reply');default:'text'"`
	MediaURL       string     `json:"media_url" gorm:"type:varchar(500)"`
	MediaMimeType  string     `json:"media_mime_type" gorm:"type:varchar(100)"`
	MediaSize      *int       `json:"media_size"`
	IsRead         bool       `json:"is_read" gorm:"default:false;index:idx_unread"`
	IsInternalNote bool       `json:"is_internal_note" gorm:"default:false"`
	Intent         string     `json:"intent" gorm:"type:varchar(100);index:idx_intent"`
	Sentiment      *float64   `json:"sentiment"`
	Entities       string     `json:"entities" gorm:"type:json"`
	Confidence     *float64   `json:"confidence"`
	Metadata       string     `json:"metadata" gorm:"type:json"`
	SentAt         time.Time  `json:"sent_at" gorm:"default:CURRENT_TIMESTAMP;index:idx_conversation"`
	DeliveredAt    *time.Time `json:"delivered_at"`
	ReadAt         *time.Time `json:"read_at"`
}

func (Message) TableName() string {
	return "messages"
}

// KnowledgeBase represents a knowledge base entry for RAG
type KnowledgeBase struct {
	ID              int64      `json:"id" gorm:"primaryKey"`
	TenantID        string     `json:"tenant_id" gorm:"type:varchar(36);not null;index:idx_tenant_category"`
	Category        string     `json:"category" gorm:"type:varchar(100);index:idx_tenant_category"`
	Subcategory     string     `json:"subcategory" gorm:"type:varchar(100)"`
	Title           string     `json:"title" gorm:"type:varchar(500);not null"`
	Question        string     `json:"question" gorm:"type:text;not null"`
	Answer          string     `json:"answer" gorm:"type:text;not null"`
	Keywords        string     `json:"keywords" gorm:"type:text"`
	Embedding       string     `json:"embedding" gorm:"type:json"`
	Language        string     `json:"language" gorm:"type:varchar(10);default:'en'"`
	SourceURL       string     `json:"source_url" gorm:"type:varchar(500)"`
	IsActive        bool       `json:"is_active" gorm:"default:true;index:idx_active"`
	IsPublic        bool       `json:"is_public" gorm:"default:true"`
	UsageCount      int        `json:"usage_count" gorm:"default:0;index:idx_usage"`
	HelpfulCount    int        `json:"helpful_count" gorm:"default:0"`
	NotHelpfulCount int        `json:"not_helpful_count" gorm:"default:0"`
	LastUsedAt      *time.Time `json:"last_used_at"`
	Priority        int        `json:"priority" gorm:"default:0"`
	CreatedBy       *int64     `json:"created_by"`
	UpdatedBy       *int64     `json:"updated_by"`
	CreatedAt       time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt       time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (KnowledgeBase) TableName() string {
	return "knowledge_base"
}

// HandoffRule represents a rule for transferring from bot to human
type HandoffRule struct {
	ID              int64      `json:"id" gorm:"primaryKey"`
	TenantID        string     `json:"tenant_id" gorm:"type:varchar(36);not null;index:idx_tenant_active"`
	Name            string     `json:"name" gorm:"type:varchar(100);not null"`
	Description     string     `json:"description" gorm:"type:text"`
	TriggerType     string     `json:"trigger_type" gorm:"type:enum('keyword','intent','sentiment','timeout','confidence','message_count','manual','no_answer');not null"`
	TriggerValue    string     `json:"trigger_value" gorm:"type:varchar(255)"`
	TriggerOperator string     `json:"trigger_operator" gorm:"type:enum('equals','contains','less_than','greater_than','between');default:'contains'"`
	Priority        int        `json:"priority" gorm:"default:0;index:idx_priority"`
	TargetQueueID   *int64     `json:"target_queue_id"`
	MessageTemplate string     `json:"message_template" gorm:"type:text"`
	NotifyAgent     bool       `json:"notify_agent" gorm:"default:true"`
	IsActive        bool       `json:"is_active" gorm:"default:true;index:idx_tenant_active"`
	ExecutionCount  int        `json:"execution_count" gorm:"default:0"`
	LastExecutedAt  *time.Time `json:"last_executed_at"`
	CreatedAt       time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt       time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (HandoffRule) TableName() string {
	return "handoff_rules"
}

// ChannelIntegration represents a connected communication channel
type ChannelIntegration struct {
	ID             int64      `json:"id" gorm:"primaryKey"`
	TenantID       string     `json:"tenant_id" gorm:"type:varchar(36);not null;uniqueIndex:idx_tenant_channel"`
	Channel        string     `json:"channel" gorm:"type:enum('whatsapp','facebook','instagram','twitter','telegram','web','sms');not null;uniqueIndex:idx_tenant_channel"`
	Name           string     `json:"name" gorm:"type:varchar(100)"`
	Credentials    string     `json:"credentials" gorm:"type:json;not null"`
	WebhookURL     string     `json:"webhook_url" gorm:"type:varchar(500)"`
	WebhookSecret  string     `json:"webhook_secret" gorm:"type:varchar(255)"`
	VerifyToken    string     `json:"verify_token" gorm:"type:varchar(255)"`
	PhoneNumber    string     `json:"phone_number" gorm:"type:varchar(50);uniqueIndex:idx_tenant_channel"`
	PageID         string     `json:"page_id" gorm:"type:varchar(100)"`
	IsActive       bool       `json:"is_active" gorm:"default:true;index:idx_active"`
	IsBotEnabled   bool       `json:"is_bot_enabled" gorm:"default:true"`
	WelcomeMessage string     `json:"welcome_message" gorm:"type:text"`
	OfflineMessage string     `json:"offline_message" gorm:"type:text"`
	BusinessHours  string     `json:"business_hours" gorm:"type:json"`
	LastSyncAt     *time.Time `json:"last_sync_at"`
	LastMessageAt  *time.Time `json:"last_message_at"`
	MessageCount   int        `json:"message_count" gorm:"default:0"`
	ErrorLog       string     `json:"error_log" gorm:"type:text"`
	CreatedAt      time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (ChannelIntegration) TableName() string {
	return "channel_integrations"
}

// AIAgentConfig represents AI agent configuration per tenant
type AIAgentConfig struct {
	ID                         int64     `json:"id" gorm:"primaryKey"`
	TenantID                   string    `json:"tenant_id" gorm:"type:varchar(36);not null;uniqueIndex"`
	IsEnabled                  bool      `json:"is_enabled" gorm:"default:true"`
	Model                      string    `json:"model" gorm:"type:varchar(50);default:'gemini-pro'"`
	APIKeyEncrypted            string    `json:"api_key_encrypted" gorm:"type:text"`
	SystemPrompt               string    `json:"system_prompt" gorm:"type:text"`
	Personality                string    `json:"personality" gorm:"type:varchar(50);default:'professional'"`
	MaxTokens                  int       `json:"max_tokens" gorm:"default:500"`
	Temperature                float64   `json:"temperature" gorm:"default:0.7"`
	AutoHandoffEnabled         bool      `json:"auto_handoff_enabled" gorm:"default:true"`
	HandoffConfidenceThreshold float64   `json:"handoff_confidence_threshold" gorm:"default:0.5"`
	HandoffMessageCount        int       `json:"handoff_message_count" gorm:"default:10"`
	HandoffTimeoutSeconds      int       `json:"handoff_timeout_seconds" gorm:"default:300"`
	ResponseDelayMs            int       `json:"response_delay_ms" gorm:"default:1000"`
	CollectEmail               bool      `json:"collect_email" gorm:"default:true"`
	CollectPhone               bool      `json:"collect_phone" gorm:"default:true"`
	CollectName                bool      `json:"collect_name" gorm:"default:true"`
	BusinessHoursOnly          bool      `json:"business_hours_only" gorm:"default:false"`
	FallbackMessage            string    `json:"fallback_message" gorm:"type:text"`
	GreetingMessage            string    `json:"greeting_message" gorm:"type:text"`
	RAGEnabled                 bool      `json:"rag_enabled" gorm:"default:true"`
	RAGSimilarityThreshold     float64   `json:"rag_similarity_threshold" gorm:"default:0.7"`
	RAGMaxResults              int       `json:"rag_max_results" gorm:"default:3"`
	SentimentAnalysisEnabled   bool      `json:"sentiment_analysis_enabled" gorm:"default:true"`
	IntentDetectionEnabled     bool      `json:"intent_detection_enabled" gorm:"default:true"`
	LanguageDetectionEnabled   bool      `json:"language_detection_enabled" gorm:"default:false"`
	SupportedLanguages         string    `json:"supported_languages" gorm:"type:json"`
	AnalyticsEnabled           bool      `json:"analytics_enabled" gorm:"default:true"`
	CreatedAt                  time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt                  time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (AIAgentConfig) TableName() string {
	return "ai_agent_config"
}

// ConversationTag represents a tag for categorizing conversations
type ConversationTag struct {
	ID          int64     `json:"id" gorm:"primaryKey"`
	TenantID    string    `json:"tenant_id" gorm:"type:varchar(36);not null;uniqueIndex:idx_tenant_name"`
	Name        string    `json:"name" gorm:"type:varchar(50);not null;uniqueIndex:idx_tenant_name"`
	Color       string    `json:"color" gorm:"type:varchar(7);default:'#6B7280'"`
	Description string    `json:"description" gorm:"type:varchar(255)"`
	UsageCount  int       `json:"usage_count" gorm:"default:0"`
	IsActive    bool      `json:"is_active" gorm:"default:true;index:idx_active"`
	CreatedAt   time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (ConversationTag) TableName() string {
	return "conversation_tags"
}

// QuickReply represents a canned response/quick reply
type QuickReply struct {
	ID         int64     `json:"id" gorm:"primaryKey"`
	TenantID   string    `json:"tenant_id" gorm:"type:varchar(36);not null;uniqueIndex:idx_tenant_shortcut"`
	Category   string    `json:"category" gorm:"type:varchar(100);index:idx_category"`
	Shortcut   string    `json:"shortcut" gorm:"type:varchar(50);not null;uniqueIndex:idx_tenant_shortcut"`
	Title      string    `json:"title" gorm:"type:varchar(255);not null"`
	Content    string    `json:"content" gorm:"type:text;not null"`
	IsGlobal   bool      `json:"is_global" gorm:"default:false"`
	CreatedBy  *int64    `json:"created_by"`
	UsageCount int       `json:"usage_count" gorm:"default:0;index:idx_usage"`
	IsActive   bool      `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (QuickReply) TableName() string {
	return "quick_replies"
}
