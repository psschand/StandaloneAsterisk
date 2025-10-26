package asterisk

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

// ARIClient handles connections to Asterisk ARI
type ARIClient struct {
	baseURL  string
	username string
	password string
	appName  string
	client   *http.Client
	wsConn   *websocket.Conn
}

// NewARIClient creates a new ARI client
func NewARIClient(baseURL, username, password, appName string) *ARIClient {
	return &ARIClient{
		baseURL:  baseURL,
		username: username,
		password: password,
		appName:  appName,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Connect establishes WebSocket connection to ARI events
func (c *ARIClient) Connect(ctx context.Context) error {
	u, err := url.Parse(c.baseURL)
	if err != nil {
		return fmt.Errorf("invalid ARI URL: %w", err)
	}

	// Change http:// to ws://
	if u.Scheme == "http" {
		u.Scheme = "ws"
	} else if u.Scheme == "https" {
		u.Scheme = "wss"
	}

	u.Path = fmt.Sprintf("/ari/events?app=%s&api_key=%s:%s", c.appName, c.username, c.password)

	log.Printf("Connecting to ARI WebSocket: %s", u.String())

	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		return fmt.Errorf("failed to connect to ARI WebSocket: %w", err)
	}

	c.wsConn = conn
	log.Println("Successfully connected to Asterisk ARI WebSocket")

	return nil
}

// Close closes the WebSocket connection
func (c *ARIClient) Close() error {
	if c.wsConn != nil {
		return c.wsConn.Close()
	}
	return nil
}

// ReadEvents reads events from the WebSocket connection
func (c *ARIClient) ReadEvents() (<-chan ARIEvent, <-chan error) {
	events := make(chan ARIEvent, 100)
	errors := make(chan error, 1)

	go func() {
		defer close(events)
		defer close(errors)

		for {
			var event ARIEvent
			err := c.wsConn.ReadJSON(&event)
			if err != nil {
				if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					log.Println("ARI WebSocket connection closed normally")
					return
				}
				errors <- fmt.Errorf("error reading from WebSocket: %w", err)
				return
			}

			events <- event
		}
	}()

	return events, errors
}

// makeRequest makes an HTTP request to ARI
func (c *ARIClient) makeRequest(method, path string, body io.Reader) (*http.Response, error) {
	u, err := url.Parse(c.baseURL)
	if err != nil {
		return nil, err
	}
	u.Path = path

	req, err := http.NewRequest(method, u.String(), body)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(c.username, c.password)
	req.Header.Set("Content-Type", "application/json")

	return c.client.Do(req)
}

// AnswerChannel answers a channel
func (c *ARIClient) AnswerChannel(channelID string) error {
	resp, err := c.makeRequest("POST", fmt.Sprintf("/ari/channels/%s/answer", channelID), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to answer channel: %s - %s", resp.Status, string(body))
	}

	return nil
}

// PlaySound plays a sound to a channel
func (c *ARIClient) PlaySound(channelID, sound string) (*Playback, error) {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/channels/%s/play?media=sound:%s", channelID, sound), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to play sound: %s - %s", resp.Status, string(body))
	}

	var playback Playback
	if err := json.NewDecoder(resp.Body).Decode(&playback); err != nil {
		return nil, err
	}

	return &playback, nil
}

// HangupChannel hangs up a channel
func (c *ARIClient) HangupChannel(channelID string) error {
	resp, err := c.makeRequest("DELETE", fmt.Sprintf("/ari/channels/%s", channelID), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to hangup channel: %s - %s", resp.Status, string(body))
	}

	return nil
}

// DialEndpoint dials an endpoint
func (c *ARIClient) DialEndpoint(endpoint, extension, callerID string) (*Channel, error) {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/channels?endpoint=%s&extension=%s&app=%s&callerId=%s",
			url.QueryEscape(endpoint),
			url.QueryEscape(extension),
			url.QueryEscape(c.appName),
			url.QueryEscape(callerID),
		), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to dial: %s - %s", resp.Status, string(body))
	}

	var channel Channel
	if err := json.NewDecoder(resp.Body).Decode(&channel); err != nil {
		return nil, err
	}

	return &channel, nil
}

// CreateBridge creates a mixing bridge
func (c *ARIClient) CreateBridge(bridgeType string) (*Bridge, error) {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/bridges?type=%s", url.QueryEscape(bridgeType)), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to create bridge: %s - %s", resp.Status, string(body))
	}

	var bridge Bridge
	if err := json.NewDecoder(resp.Body).Decode(&bridge); err != nil {
		return nil, err
	}

	return &bridge, nil
}

// AddChannelToBridge adds a channel to a bridge
func (c *ARIClient) AddChannelToBridge(bridgeID, channelID string) error {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/bridges/%s/addChannel?channel=%s", bridgeID, channelID), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to add channel to bridge: %s - %s", resp.Status, string(body))
	}

	return nil
}

// RemoveChannelFromBridge removes a channel from a bridge
func (c *ARIClient) RemoveChannelFromBridge(bridgeID, channelID string) error {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/bridges/%s/removeChannel?channel=%s", bridgeID, channelID), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to remove channel from bridge: %s - %s", resp.Status, string(body))
	}

	return nil
}

// DestroyBridge destroys a bridge
func (c *ARIClient) DestroyBridge(bridgeID string) error {
	resp, err := c.makeRequest("DELETE", fmt.Sprintf("/ari/bridges/%s", bridgeID), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to destroy bridge: %s - %s", resp.Status, string(body))
	}

	return nil
}

// StartRecording starts recording a channel
func (c *ARIClient) StartRecording(channelID, name, format string) (*Recording, error) {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/channels/%s/record?name=%s&format=%s&maxDurationSeconds=3600&ifExists=overwrite",
			channelID, url.QueryEscape(name), url.QueryEscape(format)), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to start recording: %s - %s", resp.Status, string(body))
	}

	var recording Recording
	if err := json.NewDecoder(resp.Body).Decode(&recording); err != nil {
		return nil, err
	}

	return &recording, nil
}

// StopRecording stops a recording
func (c *ARIClient) StopRecording(recordingName string) error {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/recordings/live/%s/stop", recordingName), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to stop recording: %s - %s", resp.Status, string(body))
	}

	return nil
}

// GetChannelVariable gets a channel variable
func (c *ARIClient) GetChannelVariable(channelID, variable string) (string, error) {
	resp, err := c.makeRequest("GET",
		fmt.Sprintf("/ari/channels/%s/variable?variable=%s", channelID, url.QueryEscape(variable)), nil)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to get variable: %s - %s", resp.Status, string(body))
	}

	var result struct {
		Value string `json:"value"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.Value, nil
}

// SetChannelVariable sets a channel variable
func (c *ARIClient) SetChannelVariable(channelID, variable, value string) error {
	resp, err := c.makeRequest("POST",
		fmt.Sprintf("/ari/channels/%s/variable?variable=%s&value=%s",
			channelID, url.QueryEscape(variable), url.QueryEscape(value)), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to set variable: %s - %s", resp.Status, string(body))
	}

	return nil
}
