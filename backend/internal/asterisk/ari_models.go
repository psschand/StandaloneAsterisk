package asterisk

import "time"

// ARIEvent represents an event from Asterisk ARI
type ARIEvent struct {
	Type        string                 `json:"type"`
	Timestamp   time.Time              `json:"timestamp"`
	Application string                 `json:"application,omitempty"`
	Channel     *Channel               `json:"channel,omitempty"`
	Playback    *Playback              `json:"playback,omitempty"`
	Recording   *Recording             `json:"recording,omitempty"`
	Bridge      *Bridge                `json:"bridge,omitempty"`
	Endpoint    *Endpoint              `json:"endpoint,omitempty"`
	Data        map[string]interface{} `json:"-"` // For additional fields
}

// Channel represents an ARI channel
type Channel struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	State        string            `json:"state"`
	Caller       CallerID          `json:"caller"`
	Connected    CallerID          `json:"connected"`
	AccountCode  string            `json:"accountcode"`
	Dialplan     DialplanCEP       `json:"dialplan"`
	CreationTime time.Time         `json:"creationtime"`
	Language     string            `json:"language"`
	ChannelVars  map[string]string `json:"channelvars,omitempty"`
}

// CallerID represents caller identification
type CallerID struct {
	Name   string `json:"name"`
	Number string `json:"number"`
}

// DialplanCEP represents Context/Extension/Priority
type DialplanCEP struct {
	Context  string `json:"context"`
	Exten    string `json:"exten"`
	Priority int    `json:"priority"`
	AppName  string `json:"app_name,omitempty"`
	AppData  string `json:"app_data,omitempty"`
}

// Bridge represents an ARI bridge
type Bridge struct {
	ID           string    `json:"id"`
	Technology   string    `json:"technology"`
	BridgeType   string    `json:"bridge_type"`
	BridgeClass  string    `json:"bridge_class"`
	Creator      string    `json:"creator"`
	Name         string    `json:"name"`
	Channels     []string  `json:"channels"`
	CreationTime time.Time `json:"creationtime"`
}

// Playback represents a media playback
type Playback struct {
	ID        string `json:"id"`
	MediaURI  string `json:"media_uri"`
	TargetURI string `json:"target_uri"`
	Language  string `json:"language"`
	State     string `json:"state"`
}

// Recording represents a recording
type Recording struct {
	Name            string `json:"name"`
	Format          string `json:"format"`
	State           string `json:"state"`
	Duration        int    `json:"duration,omitempty"`
	TalkingDuration int    `json:"talking_duration,omitempty"`
	Silence         int    `json:"silence_duration,omitempty"`
	TargetURI       string `json:"target_uri"`
}

// Endpoint represents a SIP endpoint
type Endpoint struct {
	Technology string   `json:"technology"`
	Resource   string   `json:"resource"`
	State      string   `json:"state"`
	ChannelIDs []string `json:"channel_ids"`
}

// Event type constants
const (
	EventStasisStart            = "StasisStart"
	EventStasisEnd              = "StasisEnd"
	EventChannelStateChange     = "ChannelStateChange"
	EventChannelDtmfReceived    = "ChannelDtmfReceived"
	EventChannelHangupRequest   = "ChannelHangupRequest"
	EventChannelDestroyed       = "ChannelDestroyed"
	EventChannelCreated         = "ChannelCreated"
	EventChannelCallerId        = "ChannelCallerId"
	EventChannelConnectedLine   = "ChannelConnectedLine"
	EventChannelDialplan        = "ChannelDialplan"
	EventChannelVarset          = "ChannelVarset"
	EventChannelUserevent       = "ChannelUserevent"
	EventChannelHold            = "ChannelHold"
	EventChannelUnhold          = "ChannelUnhold"
	EventChannelTalkingStarted  = "ChannelTalkingStarted"
	EventChannelTalkingFinished = "ChannelTalkingFinished"

	EventBridgeCreated          = "BridgeCreated"
	EventBridgeDestroyed        = "BridgeDestroyed"
	EventBridgeMerged           = "BridgeMerged"
	EventBridgeBlindTransfer    = "BridgeBlindTransfer"
	EventBridgeAttendedTransfer = "BridgeAttendedTransfer"
	EventChannelEnteredBridge   = "ChannelEnteredBridge"
	EventChannelLeftBridge      = "ChannelLeftBridge"

	EventPlaybackStarted  = "PlaybackStarted"
	EventPlaybackFinished = "PlaybackFinished"

	EventRecordingStarted  = "RecordingStarted"
	EventRecordingFinished = "RecordingFinished"
	EventRecordingFailed   = "RecordingFailed"

	EventEndpointStateChange = "EndpointStateChange"
	EventPeerStatusChange    = "PeerStatusChange"

	EventApplicationReplaced = "ApplicationReplaced"
	EventTextMessageReceived = "TextMessageReceived"
)

// Channel states
const (
	ChannelStateDown           = "Down"
	ChannelStateReserved       = "Rsrvd"
	ChannelStateOffHook        = "OffHook"
	ChannelStateDialing        = "Dialing"
	ChannelStateRing           = "Ring"
	ChannelStateRinging        = "Ringing"
	ChannelStateUp             = "Up"
	ChannelStateBusy           = "Busy"
	ChannelStateDialingOffHook = "Dialing Offhook"
	ChannelStatePreRing        = "Pre-ring"
	ChannelStateUnknown        = "Unknown"
)

// Playback states
const (
	PlaybackStatePlaying  = "playing"
	PlaybackStateDone     = "done"
	PlaybackStateFailed   = "failed"
	PlaybackStatePaused   = "paused"
	PlaybackStateCanceled = "canceled"
)

// Recording states
const (
	RecordingStateQueued    = "queued"
	RecordingStateRecording = "recording"
	RecordingStatePaused    = "paused"
	RecordingStateDone      = "done"
	RecordingStateFailed    = "failed"
	RecordingStateCanceled  = "canceled"
)
