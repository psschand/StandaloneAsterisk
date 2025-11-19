# Echo Test - Audio & Microphone Testing

## Quick Start

### Using the Web UI
1. Open the softphone in your browser
2. Ensure you're registered (green indicator)
3. Click the **"Test Audio & Microphone (Echo Test)"** button
4. The system will automatically dial extension 600
5. Listen for the beep and announcement
6. Speak into your microphone
7. You should hear your own voice echoed back with a slight delay

### Manual Dialing
You can also manually dial **600** from any registered extension to start the echo test.

## How It Works

The echo test:
1. **Answers** the call immediately
2. **Plays a beep** to confirm audio is working
3. **Plays an announcement** explaining the test
4. **Echoes back** everything you say into your microphone
5. Allows you to verify:
   - Your speakers/headphones are working (you hear the beep)
   - Your microphone is working (you hear yourself)
   - Audio quality and latency
   - No audio distortion or echo issues

## Troubleshooting

### Can't hear the beep
- Check browser microphone/speaker permissions
- Check system volume levels
- Verify you're using the correct audio device
- Try refreshing the browser and registering again

### Can't hear yourself
- Your microphone may be muted or disabled
- Check browser permissions for microphone access
- Verify the correct microphone is selected in browser settings
- Test with another application to confirm microphone works

### Audio quality issues
- Check network connection (WebRTC is sensitive to packet loss)
- Close other bandwidth-intensive applications
- Try a wired ethernet connection instead of WiFi
- Check for browser console errors

## Other Test Extensions

- **600** - Echo test (test audio and microphone)
- **601** - Music on hold test (tests audio playback)
- **602** - Milliwatt tone test (1000Hz reference tone)

## Technical Details

**Extension:** 600  
**Context:** from-internal  
**Dialplan:**
```
exten => 600,1,NoOp(Echo Test Started by ${CALLERID(num)})
 same => n,Answer()
 same => n,Wait(1)
 same => n,Playback(silence/1&beep)
 same => n,Playback(demo-echotest)
 same => n,Echo()
 same => n,Hangup()
```

The Echo() application creates a simple audio loop that sends received audio back to the sender, allowing users to verify bidirectional audio functionality.
