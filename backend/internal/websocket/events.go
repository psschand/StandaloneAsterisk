package websocket

import (
	"time"
)

// EventBroadcaster provides methods to broadcast various events through WebSocket
type EventBroadcaster struct {
	hub *Hub
}

// NewEventBroadcaster creates a new event broadcaster
func NewEventBroadcaster(hub *Hub) *EventBroadcaster {
	return &EventBroadcaster{hub: hub}
}

// Agent State Events

// AgentLogin broadcasts agent login event
func (eb *EventBroadcaster) AgentLogin(tenantID string, userID int64, username, extension string) error {
	payload := &AgentStatePayload{
		UserID:    userID,
		Username:  username,
		State:     "available",
		Extension: extension,
	}
	msg, err := NewMessage(MessageTypeAgentLogin, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	eb.hub.BroadcastToTenant(tenantID, msg)
	return nil
}

// AgentLogout broadcasts agent logout event
func (eb *EventBroadcaster) AgentLogout(tenantID string, userID int64, username string) error {
	payload := &AgentStatePayload{
		UserID:   userID,
		Username: username,
		State:    "offline",
	}
	msg, err := NewMessage(MessageTypeAgentLogout, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	eb.hub.BroadcastToTenant(tenantID, msg)
	return nil
}

// AgentStateChange broadcasts agent state change event
func (eb *EventBroadcaster) AgentStateChange(tenantID string, userID int64, username, state, reason string) error {
	return eb.hub.BroadcastAgentStateChange(tenantID, &AgentStatePayload{
		UserID:   userID,
		Username: username,
		State:    state,
		Reason:   reason,
	})
}

// Call Events

// CallIncoming broadcasts incoming call event
func (eb *EventBroadcaster) CallIncoming(tenantID, uniqueID, callerID, destination, queueName string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeCallIncoming, &CallEventPayload{
		UniqueID:    uniqueID,
		CallerID:    callerID,
		Destination: destination,
		QueueName:   queueName,
		Direction:   "inbound",
	})
}

// CallAnswered broadcasts call answered event
func (eb *EventBroadcaster) CallAnswered(tenantID, uniqueID string, agentID int64, agentName string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeCallAnswered, &CallEventPayload{
		UniqueID:  uniqueID,
		AgentID:   agentID,
		AgentName: agentName,
	})
}

// CallEnded broadcasts call ended event
func (eb *EventBroadcaster) CallEnded(tenantID, uniqueID string, duration int) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeCallEnded, &CallEventPayload{
		UniqueID: uniqueID,
		Duration: duration,
	})
}

// CallTransferred broadcasts call transfer event
func (eb *EventBroadcaster) CallTransferred(tenantID, uniqueID, destination string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeCallTransferred, &CallEventPayload{
		UniqueID:    uniqueID,
		Destination: destination,
	})
}

// CallHold broadcasts call hold event
func (eb *EventBroadcaster) CallHold(tenantID, uniqueID string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeCallHold, &CallEventPayload{
		UniqueID: uniqueID,
	})
}

// CallUnhold broadcasts call unhold event
func (eb *EventBroadcaster) CallUnhold(tenantID, uniqueID string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeCallUnhold, &CallEventPayload{
		UniqueID: uniqueID,
	})
}

// Queue Events

// QueueJoined broadcasts queue joined event
func (eb *EventBroadcaster) QueueJoined(tenantID, uniqueID, callerID, queueName string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeQueueJoined, &CallEventPayload{
		UniqueID:  uniqueID,
		CallerID:  callerID,
		QueueName: queueName,
	})
}

// QueueLeft broadcasts queue left event
func (eb *EventBroadcaster) QueueLeft(tenantID, uniqueID, queueName string) error {
	return eb.hub.BroadcastCallEvent(tenantID, MessageTypeQueueLeft, &CallEventPayload{
		UniqueID:  uniqueID,
		QueueName: queueName,
	})
}

// QueueMemberAdded broadcasts queue member added event
func (eb *EventBroadcaster) QueueMemberAdded(tenantID, queueName string, userID int64, username, iface string) error {
	return eb.hub.BroadcastQueueMemberEvent(tenantID, MessageTypeMemberAdded, &QueueMemberPayload{
		QueueName: queueName,
		UserID:    userID,
		Username:  username,
		Interface: iface,
		Paused:    false,
	})
}

// QueueMemberRemoved broadcasts queue member removed event
func (eb *EventBroadcaster) QueueMemberRemoved(tenantID, queueName string, userID int64, username string) error {
	return eb.hub.BroadcastQueueMemberEvent(tenantID, MessageTypeMemberRemoved, &QueueMemberPayload{
		QueueName: queueName,
		UserID:    userID,
		Username:  username,
	})
}

// QueueMemberPaused broadcasts queue member paused event
func (eb *EventBroadcaster) QueueMemberPaused(tenantID, queueName string, userID int64, username string) error {
	return eb.hub.BroadcastQueueMemberEvent(tenantID, MessageTypeMemberPaused, &QueueMemberPayload{
		QueueName: queueName,
		UserID:    userID,
		Username:  username,
		Paused:    true,
	})
}

// QueueMemberUnpaused broadcasts queue member unpaused event
func (eb *EventBroadcaster) QueueMemberUnpaused(tenantID, queueName string, userID int64, username string) error {
	return eb.hub.BroadcastQueueMemberEvent(tenantID, MessageTypeMemberUnpaused, &QueueMemberPayload{
		QueueName: queueName,
		UserID:    userID,
		Username:  username,
		Paused:    false,
	})
}

// UpdateQueueStats broadcasts updated queue statistics
func (eb *EventBroadcaster) UpdateQueueStats(tenantID, queueName string, stats *QueueStatsPayload) error {
	stats.QueueName = queueName
	return eb.hub.BroadcastQueueStats(tenantID, stats)
}

// Chat Events

// ChatSessionStarted broadcasts chat session started event
func (eb *EventBroadcaster) ChatSessionStarted(tenantID string, sessionID int64, visitorName, visitorEmail string) error {
	return eb.hub.BroadcastChatSessionEvent(tenantID, MessageTypeChatSessionStarted, &ChatSessionPayload{
		SessionID:    sessionID,
		VisitorName:  visitorName,
		VisitorEmail: visitorEmail,
		Status:       "active",
	})
}

// ChatSessionEnded broadcasts chat session ended event
func (eb *EventBroadcaster) ChatSessionEnded(tenantID string, sessionID int64) error {
	return eb.hub.BroadcastChatSessionEvent(tenantID, MessageTypeChatSessionEnded, &ChatSessionPayload{
		SessionID: sessionID,
		Status:    "ended",
	})
}

// ChatSessionAssigned broadcasts chat session assigned to agent event
func (eb *EventBroadcaster) ChatSessionAssigned(tenantID string, sessionID, agentID int64, agentName string) error {
	return eb.hub.BroadcastChatSessionEvent(tenantID, MessageTypeChatSessionStarted, &ChatSessionPayload{
		SessionID: sessionID,
		AgentID:   agentID,
		AgentName: agentName,
		Status:    "active",
	})
}

// ChatMessageSent broadcasts new chat message event
func (eb *EventBroadcaster) ChatMessageSent(tenantID string, sessionID, messageID, senderID int64, senderType, senderName, body string) error {
	return eb.hub.BroadcastChatMessage(tenantID, &ChatMessagePayload{
		SessionID:  sessionID,
		MessageID:  messageID,
		SenderID:   senderID,
		SenderType: senderType,
		SenderName: senderName,
		Body:       body,
		Timestamp:  time.Now().Format(time.RFC3339),
	})
}

// ChatTypingIndicator broadcasts typing indicator
func (eb *EventBroadcaster) ChatTypingIndicator(tenantID string, sessionID int64, senderType, senderName string, isTyping bool) error {
	payload := &ChatTypingPayload{
		SessionID:  sessionID,
		SenderType: senderType,
		SenderName: senderName,
		IsTyping:   isTyping,
	}
	msg, err := NewMessage(MessageTypeChatTyping, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	eb.hub.BroadcastToTenant(tenantID, msg)
	return nil
}

// ChatTransferred broadcasts chat transfer event
func (eb *EventBroadcaster) ChatTransferred(tenantID string, sessionID, toAgentID int64, toAgentName string) error {
	return eb.hub.BroadcastChatSessionEvent(tenantID, MessageTypeChatTransferred, &ChatSessionPayload{
		SessionID: sessionID,
		AgentID:   toAgentID,
		AgentName: toAgentName,
		Status:    "transferred",
	})
}

// Notification Events

// SendNotification sends a notification to a specific user
func (eb *EventBroadcaster) SendNotification(tenantID string, userID int64, notifType, title, message string, data map[string]interface{}) error {
	return eb.hub.BroadcastNotification(tenantID, userID, &NotificationPayload{
		Type:    notifType,
		Title:   title,
		Message: message,
		Data:    data,
	})
}

// SendAlert broadcasts an alert to all users in tenant
func (eb *EventBroadcaster) SendAlert(tenantID, title, message string) error {
	payload := &NotificationPayload{
		Type:    "alert",
		Title:   title,
		Message: message,
	}
	msg, err := NewMessage(MessageTypeAlert, payload)
	if err != nil {
		return err
	}
	msg.TenantID = tenantID
	eb.hub.BroadcastToTenant(tenantID, msg)
	return nil
}
