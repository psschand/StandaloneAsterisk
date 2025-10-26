package websocket

import (
	"encoding/json"
	"time"
)

// MessageType represents the type of WebSocket message
type MessageType string

const (
	// Agent Events
	MessageTypeAgentStateChanged MessageType = "agent.state.changed"
	MessageTypeAgentLogin        MessageType = "agent.login"
	MessageTypeAgentLogout       MessageType = "agent.logout"

	// Call Events
	MessageTypeCallIncoming    MessageType = "call.incoming"
	MessageTypeCallAnswered    MessageType = "call.answered"
	MessageTypeCallEnded       MessageType = "call.ended"
	MessageTypeCallTransferred MessageType = "call.transferred"
	MessageTypeCallHold        MessageType = "call.hold"
	MessageTypeCallUnhold      MessageType = "call.unhold"

	// Queue Events
	MessageTypeQueueJoined    MessageType = "queue.joined"
	MessageTypeQueueLeft      MessageType = "queue.left"
	MessageTypeQueueStats     MessageType = "queue.stats"
	MessageTypeMemberAdded    MessageType = "queue.member.added"
	MessageTypeMemberRemoved  MessageType = "queue.member.removed"
	MessageTypeMemberPaused   MessageType = "queue.member.paused"
	MessageTypeMemberUnpaused MessageType = "queue.member.unpaused"

	// Chat Events
	MessageTypeChatSessionStarted MessageType = "chat.session.started"
	MessageTypeChatMessage        MessageType = "chat.message"
	MessageTypeChatSessionEnded   MessageType = "chat.session.ended"
	MessageTypeChatTransferred    MessageType = "chat.transferred"
	MessageTypeChatTyping         MessageType = "chat.typing"

	// Notification Events
	MessageTypeNotification MessageType = "notification"
	MessageTypeAlert        MessageType = "alert"

	// System Events
	MessageTypePing        MessageType = "ping"
	MessageTypePong        MessageType = "pong"
	MessageTypeError       MessageType = "error"
	MessageTypeSubscribe   MessageType = "subscribe"
	MessageTypeUnsubscribe MessageType = "unsubscribe"
)

// Message represents a WebSocket message
type Message struct {
	Type      MessageType     `json:"type"`
	Payload   json.RawMessage `json:"payload,omitempty"`
	Timestamp time.Time       `json:"timestamp"`
	TenantID  string          `json:"tenant_id,omitempty"`
	UserID    int64           `json:"user_id,omitempty"`
}

// AgentStatePayload represents agent state change data
type AgentStatePayload struct {
	UserID    int64  `json:"user_id"`
	Username  string `json:"username"`
	State     string `json:"state"`
	Reason    string `json:"reason,omitempty"`
	Extension string `json:"extension,omitempty"`
}

// CallEventPayload represents call event data
type CallEventPayload struct {
	UniqueID           string `json:"unique_id"`
	CallerID           string `json:"caller_id"`
	CallerName         string `json:"caller_name,omitempty"`
	Destination        string `json:"destination"`
	Channel            string `json:"channel,omitempty"`
	DestinationChannel string `json:"destination_channel,omitempty"`
	AgentID            int64  `json:"agent_id,omitempty"`
	AgentName          string `json:"agent_name,omitempty"`
	QueueName          string `json:"queue_name,omitempty"`
	Direction          string `json:"direction,omitempty"`
	Duration           int    `json:"duration,omitempty"`
}

// QueueStatsPayload represents queue statistics
type QueueStatsPayload struct {
	QueueName       string `json:"queue_name"`
	CallsWaiting    int    `json:"calls_waiting"`
	AvailableAgents int    `json:"available_agents"`
	LoggedInAgents  int    `json:"logged_in_agents"`
	TalkingAgents   int    `json:"talking_agents"`
	LongestWaitTime int    `json:"longest_wait_time"`
	AverageWaitTime int    `json:"average_wait_time"`
	CompletedCalls  int    `json:"completed_calls"`
	AbandonedCalls  int    `json:"abandoned_calls"`
}

// QueueMemberPayload represents queue member data
type QueueMemberPayload struct {
	QueueName string `json:"queue_name"`
	UserID    int64  `json:"user_id"`
	Username  string `json:"username"`
	Interface string `json:"interface"`
	Paused    bool   `json:"paused"`
	Penalty   int    `json:"penalty,omitempty"`
}

// ChatMessagePayload represents chat message data
type ChatMessagePayload struct {
	SessionID  int64  `json:"session_id"`
	MessageID  int64  `json:"message_id"`
	SenderID   int64  `json:"sender_id,omitempty"`
	SenderType string `json:"sender_type"`
	SenderName string `json:"sender_name"`
	Body       string `json:"body"`
	Timestamp  string `json:"timestamp"`
}

// ChatSessionPayload represents chat session data
type ChatSessionPayload struct {
	SessionID    int64  `json:"session_id"`
	VisitorName  string `json:"visitor_name,omitempty"`
	VisitorEmail string `json:"visitor_email,omitempty"`
	AgentID      int64  `json:"agent_id,omitempty"`
	AgentName    string `json:"agent_name,omitempty"`
	Status       string `json:"status"`
}

// ChatTypingPayload represents typing indicator data
type ChatTypingPayload struct {
	SessionID  int64  `json:"session_id"`
	SenderType string `json:"sender_type"`
	SenderName string `json:"sender_name"`
	IsTyping   bool   `json:"is_typing"`
}

// NotificationPayload represents notification data
type NotificationPayload struct {
	ID      int64                  `json:"id"`
	Type    string                 `json:"type"`
	Title   string                 `json:"title"`
	Message string                 `json:"message"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

// SubscribePayload represents subscription request data
type SubscribePayload struct {
	Events []MessageType `json:"events"`
}

// ErrorPayload represents error data
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// NewMessage creates a new WebSocket message
func NewMessage(msgType MessageType, payload interface{}) (*Message, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	return &Message{
		Type:      msgType,
		Payload:   payloadBytes,
		Timestamp: time.Now(),
	}, nil
}

// NewMessageWithContext creates a new WebSocket message with tenant and user context
func NewMessageWithContext(msgType MessageType, payload interface{}, tenantID string, userID int64) (*Message, error) {
	msg, err := NewMessage(msgType, payload)
	if err != nil {
		return nil, err
	}

	msg.TenantID = tenantID
	msg.UserID = userID
	return msg, nil
}

// ParsePayload parses the message payload into the given struct
func (m *Message) ParsePayload(v interface{}) error {
	return json.Unmarshal(m.Payload, v)
}
