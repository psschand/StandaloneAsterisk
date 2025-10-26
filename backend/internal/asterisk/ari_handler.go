package asterisk

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// CallHandler handles ARI call events
type CallHandler struct {
	client         *ARIClient
	mu             sync.RWMutex
	activeChannels map[string]*Channel
	activeBridges  map[string]*Bridge
	eventHandlers  []EventHandler
}

// EventHandler is a function that handles ARI events
type EventHandler func(event ARIEvent)

// NewCallHandler creates a new call handler
func NewCallHandler(client *ARIClient) *CallHandler {
	return &CallHandler{
		client:         client,
		activeChannels: make(map[string]*Channel),
		activeBridges:  make(map[string]*Bridge),
		eventHandlers:  []EventHandler{},
	}
}

// AddEventHandler adds an event handler
func (h *CallHandler) AddEventHandler(handler EventHandler) {
	h.eventHandlers = append(h.eventHandlers, handler)
}

// Start starts listening for ARI events
func (h *CallHandler) Start(ctx context.Context) error {
	if err := h.client.Connect(ctx); err != nil {
		return fmt.Errorf("failed to connect to ARI: %w", err)
	}

	events, errors := h.client.ReadEvents()

	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("Stopping ARI call handler")
				h.client.Close()
				return

			case event, ok := <-events:
				if !ok {
					log.Println("ARI events channel closed")
					return
				}
				h.handleEvent(event)

			case err, ok := <-errors:
				if !ok {
					log.Println("ARI errors channel closed")
					return
				}
				log.Printf("ARI error: %v", err)
			}
		}
	}()

	return nil
}

// handleEvent processes an ARI event
func (h *CallHandler) handleEvent(event ARIEvent) {
	log.Printf("ARI Event: %s", event.Type)

	// Call registered handlers
	for _, handler := range h.eventHandlers {
		go handler(event)
	}

	// Handle core events
	switch event.Type {
	case EventStasisStart:
		h.onStasisStart(event)
	case EventStasisEnd:
		h.onStasisEnd(event)
	case EventChannelStateChange:
		h.onChannelStateChange(event)
	case EventChannelDestroyed:
		h.onChannelDestroyed(event)
	case EventChannelDtmfReceived:
		h.onDTMFReceived(event)
	case EventChannelEnteredBridge:
		h.onChannelEnteredBridge(event)
	case EventChannelLeftBridge:
		h.onChannelLeftBridge(event)
	case EventBridgeCreated:
		h.onBridgeCreated(event)
	case EventBridgeDestroyed:
		h.onBridgeDestroyed(event)
	}
}

// onStasisStart handles incoming calls
func (h *CallHandler) onStasisStart(event ARIEvent) {
	if event.Channel == nil {
		return
	}

	channel := event.Channel
	log.Printf("Incoming call: %s from %s (%s)",
		channel.ID, channel.Caller.Number, channel.Caller.Name)

	// Store channel
	h.mu.Lock()
	h.activeChannels[channel.ID] = channel
	h.mu.Unlock()

	// Answer the call
	if err := h.client.AnswerChannel(channel.ID); err != nil {
		log.Printf("Error answering channel %s: %v", channel.ID, err)
		return
	}

	// Play greeting
	if _, err := h.client.PlaySound(channel.ID, "hello-world"); err != nil {
		log.Printf("Error playing sound on channel %s: %v", channel.ID, err)
	}

	// Auto-hangup after 30 seconds (for testing)
	go func() {
		time.Sleep(30 * time.Second)
		h.mu.RLock()
		_, exists := h.activeChannels[channel.ID]
		h.mu.RUnlock()

		if exists {
			log.Printf("Auto-hanging up channel %s after 30s", channel.ID)
			h.client.HangupChannel(channel.ID)
		}
	}()
}

// onStasisEnd handles call end
func (h *CallHandler) onStasisEnd(event ARIEvent) {
	if event.Channel == nil {
		return
	}

	channel := event.Channel
	log.Printf("Call ended: %s", channel.ID)

	h.mu.Lock()
	delete(h.activeChannels, channel.ID)
	h.mu.Unlock()
}

// onChannelStateChange handles channel state changes
func (h *CallHandler) onChannelStateChange(event ARIEvent) {
	if event.Channel == nil {
		return
	}

	channel := event.Channel
	log.Printf("Channel %s state changed to: %s", channel.ID, channel.State)

	h.mu.Lock()
	if existing, ok := h.activeChannels[channel.ID]; ok {
		existing.State = channel.State
	}
	h.mu.Unlock()
}

// onChannelDestroyed handles channel destruction
func (h *CallHandler) onChannelDestroyed(event ARIEvent) {
	if event.Channel == nil {
		return
	}

	channel := event.Channel
	log.Printf("Channel destroyed: %s", channel.ID)

	h.mu.Lock()
	delete(h.activeChannels, channel.ID)
	h.mu.Unlock()
}

// onDTMFReceived handles DTMF events
func (h *CallHandler) onDTMFReceived(event ARIEvent) {
	if event.Channel == nil {
		return
	}

	// DTMF digit is in the event data
	digit := ""
	if d, ok := event.Data["digit"].(string); ok {
		digit = d
	}

	log.Printf("DTMF received on channel %s: %s", event.Channel.ID, digit)

	// Handle DTMF menu
	switch digit {
	case "1":
		// Transfer to extension 100
		log.Printf("Transferring to extension 100")
		h.TransferToExtension(event.Channel.ID, "PJSIP/100")
	case "2":
		// Transfer to extension 101
		log.Printf("Transferring to extension 101")
		h.TransferToExtension(event.Channel.ID, "PJSIP/101")
	case "#":
		// Hangup
		h.client.HangupChannel(event.Channel.ID)
	}
}

// onChannelEnteredBridge handles channel entering bridge
func (h *CallHandler) onChannelEnteredBridge(event ARIEvent) {
	if event.Channel == nil || event.Bridge == nil {
		return
	}

	log.Printf("Channel %s entered bridge %s", event.Channel.ID, event.Bridge.ID)
}

// onChannelLeftBridge handles channel leaving bridge
func (h *CallHandler) onChannelLeftBridge(event ARIEvent) {
	if event.Channel == nil || event.Bridge == nil {
		return
	}

	log.Printf("Channel %s left bridge %s", event.Channel.ID, event.Bridge.ID)
}

// onBridgeCreated handles bridge creation
func (h *CallHandler) onBridgeCreated(event ARIEvent) {
	if event.Bridge == nil {
		return
	}

	log.Printf("Bridge created: %s", event.Bridge.ID)

	h.mu.Lock()
	h.activeBridges[event.Bridge.ID] = event.Bridge
	h.mu.Unlock()
}

// onBridgeDestroyed handles bridge destruction
func (h *CallHandler) onBridgeDestroyed(event ARIEvent) {
	if event.Bridge == nil {
		return
	}

	log.Printf("Bridge destroyed: %s", event.Bridge.ID)

	h.mu.Lock()
	delete(h.activeBridges, event.Bridge.ID)
	h.mu.Unlock()
}

// TransferToExtension transfers a call to an extension
func (h *CallHandler) TransferToExtension(channelID, endpoint string) error {
	// Create a bridge
	bridge, err := h.client.CreateBridge("mixing")
	if err != nil {
		return fmt.Errorf("failed to create bridge: %w", err)
	}

	// Add the original channel to the bridge
	if err := h.client.AddChannelToBridge(bridge.ID, channelID); err != nil {
		return fmt.Errorf("failed to add channel to bridge: %w", err)
	}

	// Dial the extension
	outbound, err := h.client.DialEndpoint(endpoint, "", "CallCenter")
	if err != nil {
		h.client.DestroyBridge(bridge.ID)
		return fmt.Errorf("failed to dial endpoint: %w", err)
	}

	// Add the outbound channel to the bridge
	if err := h.client.AddChannelToBridge(bridge.ID, outbound.ID); err != nil {
		h.client.HangupChannel(outbound.ID)
		h.client.DestroyBridge(bridge.ID)
		return fmt.Errorf("failed to add outbound channel to bridge: %w", err)
	}

	log.Printf("Transferred channel %s to %s via bridge %s", channelID, endpoint, bridge.ID)

	return nil
}

// GetActiveChannels returns all active channels
func (h *CallHandler) GetActiveChannels() map[string]*Channel {
	h.mu.RLock()
	defer h.mu.RUnlock()

	channels := make(map[string]*Channel)
	for k, v := range h.activeChannels {
		channels[k] = v
	}
	return channels
}

// GetActiveBridges returns all active bridges
func (h *CallHandler) GetActiveBridges() map[string]*Bridge {
	h.mu.RLock()
	defer h.mu.RUnlock()

	bridges := make(map[string]*Bridge)
	for k, v := range h.activeBridges {
		bridges[k] = v
	}
	return bridges
}

// HangupChannel hangs up a channel
func (h *CallHandler) HangupChannel(channelID string) error {
	return h.client.HangupChannel(channelID)
}

// StartRecording starts recording a channel
func (h *CallHandler) StartRecording(channelID, name string) (*Recording, error) {
	return h.client.StartRecording(channelID, name, "wav")
}

// StopRecording stops a recording
func (h *CallHandler) StopRecording(recordingName string) error {
	return h.client.StopRecording(recordingName)
}
