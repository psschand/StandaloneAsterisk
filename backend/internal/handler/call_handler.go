package handler

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/psschand/callcenter/internal/asterisk"
	"github.com/psschand/callcenter/pkg/response"
)

type CallHandler struct {
	ariClient *asterisk.ARIClient
}

type activeCallResponse struct {
	ID          string `json:"id"`
	ChannelID   string `json:"channel_id"`
	CallerID    string `json:"caller_id"`
	CalleeID    string `json:"callee_id"`
	Direction   string `json:"direction"`
	Status      string `json:"status"`
	StartedAt   string `json:"started_at"`
	StartTime   string `json:"start_time"`
	Duration    int    `json:"duration"`
	Channel     string `json:"channel"`
	ChannelName string `json:"channel_name"`
}

func NewCallHandler(ariClient *asterisk.ARIClient) *CallHandler {
	return &CallHandler{ariClient: ariClient}
}

func (h *CallHandler) ListActive(c *gin.Context) {
	channels, err := h.ariClient.ListChannels()
	if err != nil {
		log.Printf("active calls lookup failed: %v", err)
		response.InternalError(c, "Failed to retrieve active calls from Asterisk")
		return
	}

	calls := make([]activeCallResponse, 0, len(channels))
	for _, channel := range channels {
		if !isActiveChannelState(channel.State) {
			continue
		}
		calls = append(calls, mapChannelToCall(channel))
	}

	response.Success(c, dedupeLogicalCalls(calls))
}

func (h *CallHandler) Hangup(c *gin.Context) {
	channelID := strings.TrimSpace(c.Param("id"))
	if channelID == "" {
		response.BadRequest(c, "Channel ID is required")
		return
	}

	if err := h.ariClient.HangupChannel(channelID); err != nil {
		status := http.StatusInternalServerError
		message := "Failed to hang up call"
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			status = http.StatusNotFound
			message = "Call not found"
		}

		c.JSON(status, gin.H{
			"success": false,
			"error": gin.H{
				"code":    http.StatusText(status),
				"message": message,
			},
		})
		return
	}

	response.Success(c, gin.H{"id": channelID, "status": "hangup-requested"})
}

func mapChannelToCall(channel asterisk.Channel) activeCallResponse {
	callerID := firstNonEmpty(channel.Caller.Number, channel.Caller.Name, channel.Name)
	calleeID := firstNonEmpty(channel.Connected.Number, channel.Connected.Name, channel.Dialplan.Exten, channel.Name)

	if calleeID == callerID {
		calleeID = firstNonEmpty(channel.Dialplan.Exten, channel.Name)
	}

	startedAt := channel.CreationTime.UTC().Format(time.RFC3339)
	if channel.CreationTime.IsZero() {
		startedAt = ""
	}

	return activeCallResponse{
		ID:          channel.ID,
		ChannelID:   channel.ID,
		CallerID:    callerID,
		CalleeID:    calleeID,
		Direction:   inferDirection(channel),
		Status:      mapChannelStatus(channel.State),
		StartedAt:   startedAt,
		StartTime:   startedAt,
		Duration:    durationSeconds(channel.CreationTime.Time),
		Channel:     channel.Name,
		ChannelName: channel.Name,
	}
}

func mapChannelStatus(state string) string {
	switch state {
	case asterisk.ChannelStateUp:
		return "answered"
	case asterisk.ChannelStateRing, asterisk.ChannelStateRinging, asterisk.ChannelStatePreRing:
		return "ringing"
	default:
		return strings.ToLower(state)
	}
}

func inferDirection(channel asterisk.Channel) string {
	caller := strings.TrimSpace(channel.Caller.Number)
	callee := strings.TrimSpace(firstNonEmpty(channel.Connected.Number, channel.Dialplan.Exten))
	context := strings.ToLower(strings.TrimSpace(channel.Dialplan.Context))

	if isLikelyInternal(caller) && !isLikelyInternal(callee) {
		return "outbound"
	}
	if !isLikelyInternal(caller) && isLikelyInternal(callee) {
		return "inbound"
	}
	if strings.HasPrefix(context, "from-trunk") || strings.HasPrefix(context, "from-external") || strings.HasPrefix(context, "from-pstn") {
		return "inbound"
	}
	if strings.HasPrefix(context, "from-internal") {
		return "outbound"
	}
	return "outbound"
}

func isActiveChannelState(state string) bool {
	switch state {
	case asterisk.ChannelStateUp,
		asterisk.ChannelStateRing,
		asterisk.ChannelStateRinging,
		asterisk.ChannelStatePreRing,
		asterisk.ChannelStateDialing,
		asterisk.ChannelStateOffHook,
		asterisk.ChannelStateDialingOffHook:
		return true
	default:
		return false
	}
}

func dedupeLogicalCalls(calls []activeCallResponse) []activeCallResponse {
	if len(calls) < 2 {
		return calls
	}

	bestByKey := make(map[string]activeCallResponse, len(calls))
	for _, call := range calls {
		key := logicalCallKey(call)
		existing, found := bestByKey[key]
		if !found || shouldReplaceCall(existing, call) {
			bestByKey[key] = call
		}
	}

	result := make([]activeCallResponse, 0, len(bestByKey))
	for _, call := range bestByKey {
		result = append(result, call)
	}

	return result
}

func logicalCallKey(call activeCallResponse) string {
	a := strings.TrimSpace(call.CallerID)
	b := strings.TrimSpace(call.CalleeID)
	if a > b {
		a, b = b, a
	}
	return a + "|" + b
}

func shouldReplaceCall(existing, candidate activeCallResponse) bool {
	existingRank := callStatusRank(existing.Status)
	candidateRank := callStatusRank(candidate.Status)
	if candidateRank != existingRank {
		return candidateRank > existingRank
	}
	if candidate.Duration != existing.Duration {
		return candidate.Duration > existing.Duration
	}
	return candidate.ID > existing.ID
}

func callStatusRank(status string) int {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "ringing":
		return 3
	case "answered":
		return 2
	default:
		return 1
	}
}

func isLikelyInternal(value string) bool {
	value = strings.TrimSpace(value)
	if len(value) < 2 || len(value) > 6 {
		return false
	}
	for _, ch := range value {
		if ch < '0' || ch > '9' {
			return false
		}
	}
	return true
}

func durationSeconds(createdAt time.Time) int {
	if createdAt.IsZero() {
		return 0
	}
	return int(time.Since(createdAt).Seconds())
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}
