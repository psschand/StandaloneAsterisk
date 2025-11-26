import { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  PhoneIncoming,
  PhoneOutgoing,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneForwarded,
  Clock,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  Info,
  Copy,
  Eye,
  EyeOff,
  Smartphone,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserAgent, 
  Registerer, 
  Inviter, 
  Invitation,
  SessionState,
  RegistererState
} from 'sip.js';
import type { Session } from 'sip.js';
import apiClient from '../../lib/api';
import config from '../../config';

interface SIPCredentials {
  username: string;
  password: string;
  domain: string;
  proxy: string;
  port: number;
  transport: 'UDP' | 'TCP' | 'TLS' | 'WS' | 'WSS';
  extension: string;
}

interface Call {
  id: string;
  number: string;
  direction: 'inbound' | 'outbound';
  status: 'ringing' | 'connected' | 'hold';
  startTime?: Date;
  duration?: number;
}

type CallStatus = 'idle' | 'ringing' | 'connected' | 'disconnecting';

export default function Softphone() {
  useEffect(() => {
    console.info('[Softphone build] 2025-11-25T23:43Z');
  }, []);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const durationIntervalRef = useRef<number | null>(null);
  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneOscillatorRef = useRef<OscillatorNode[]>([]);
  const ringtoneGainRef = useRef<GainNode | null>(null);

  // Fetch SIP credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery<SIPCredentials>({
    queryKey: ['softphone', 'credentials'],
    queryFn: async () => {
      const response = await apiClient.get(config.api.softphone.credentials);
      return response.data.data;
    },
  });

  // Fetch call history (CDRs) for current user
  const { data: callHistoryData } = useQuery({
    queryKey: ['cdr', 'my-calls'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/cdr', {
        params: {
          page: 1,
          page_size: 10,
          sort: 'created_at',
          order: 'desc'
        }
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform CDR data to Call format for recent calls display
  useEffect(() => {
    if (callHistoryData?.data) {
      const cdrs = callHistoryData.data.map((cdr: any) => ({
        id: cdr.id.toString(),
        number: cdr.direction === 'outbound' ? cdr.destination_number : cdr.source_number,
        direction: cdr.direction,
        status: cdr.disposition === 'ANSWERED' ? 'connected' : 'ringing',
        startTime: new Date(cdr.start_time),
        duration: cdr.duration,
      }));
      setRecentCalls(cdrs);
    }
  }, [callHistoryData]);

  // Initialize SIP.js
  useEffect(() => {
    if (!credentials) return;

    try {
      // Create audio element for remote audio
      const audioElement = document.createElement('audio');
      audioElement.autoplay = true;
      remoteAudioRef.current = audioElement;

      // Initialize AudioContext for ringtone
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      // Configure SIP.js UserAgent
      const protocol = credentials.transport === 'WS' ? 'ws' : 'wss';
      // For WSS on port 443 (HTTPS default), omit the port to avoid connection issues
      const portSuffix = (protocol === 'wss' && credentials.port === 443) ? '' : `:${credentials.port}`;
      const server = `${protocol}://${credentials.proxy}${portSuffix}/ws`;
      // Use extension in SIP URI (e.g., sip:1001@domain) to match Asterisk endpoint
      const uri = UserAgent.makeURI(`sip:${credentials.extension}@${credentials.domain}`);
      
      if (!uri) {
        throw new Error('Failed to create SIP URI');
      }

      const userAgent = new UserAgent({
        uri,
        transportOptions: {
          server,
        },
        // Authentication username and password (used in Authorization header)
        authorizationUsername: credentials.username,
        authorizationPassword: credentials.password,
        // Display name shows the extension number
        displayName: credentials.extension,
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionConfiguration: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
            ]
          }
        },
        delegate: {
          onInvite: (invitation) => {
            // Handle incoming call
            const callerNumber = invitation.remoteIdentity.uri.user || 'Unknown';
            setIncomingCall({
              id: Date.now().toString(),
              number: callerNumber,
              direction: 'inbound',
              status: 'ringing',
            });
            sessionRef.current = invitation;

            // Play ringtone
            playRingtone();

            // Setup session state change handler
            invitation.stateChange.addListener((state: SessionState) => {
              console.log('Incoming session state:', state);
              
              switch (state) {
                case SessionState.Established:
                  // Stop ringtone when call is answered
                  stopRingtone();
                  setCallStatus('connected');
                  setupRemoteMedia(invitation);
                  addToRecentCalls({
                    id: Date.now().toString(),
                    number: callerNumber,
                    direction: 'inbound',
                    status: 'connected',
                    startTime: new Date(),
                  });
                  break;
                case SessionState.Terminated:
                  // Stop ringtone when call ends
                  stopRingtone();
                  cleanupMedia();
                  setCallStatus('idle');
                  setIncomingCall(null);
                  setPhoneNumber('');
                  break;
              }
            });
          }
        }
      });

      userAgentRef.current = userAgent;

      // Start UserAgent
      userAgent.start().then(() => {
        console.log('UserAgent started');
        
        // Register
        const registerer = new Registerer(userAgent);
        registererRef.current = registerer;

        registerer.stateChange.addListener((state: RegistererState) => {
          console.log('Registerer state:', state);
          
          switch (state) {
            case RegistererState.Registered:
              setIsRegistered(true);
              setError(null);
              console.log('Successfully registered');
              break;
            case RegistererState.Unregistered:
              setIsRegistered(false);
              break;
            case RegistererState.Terminated:
              setIsRegistered(false);
              setError('Registration failed');
              break;
          }
        });

        registerer.register().catch((err) => {
          console.error('Registration failed:', err);
          setError('Failed to register SIP account');
        });
      }).catch((err) => {
        console.error('Failed to start UserAgent:', err);
        setError('Failed to initialize SIP connection');
      });

      return () => {
        // Keep UserAgent alive when navigating away to maintain connection
        // Only cleanup media elements to free resources
        cleanupMedia();
      };
    } catch (err) {
      console.error('SIP initialization error:', err);
      setError('Failed to initialize softphone');
    }
  }, [credentials]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (callStatus === 'idle') {
        setCallDuration(0);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Update audio volume when slider changes
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setupRemoteMedia = (session: Session) => {
    const sessionDescriptionHandler = (session as any).sessionDescriptionHandler;
    if (!sessionDescriptionHandler) return;

    const peerConnection = (sessionDescriptionHandler as any).peerConnection;
    if (!peerConnection) return;

    const remoteStream = new MediaStream();
    peerConnection.getReceivers().forEach((receiver: RTCRtpReceiver) => {
      if (receiver.track) {
        remoteStream.addTrack(receiver.track);
      }
    });

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = volume / 100; // Apply volume setting
      remoteAudioRef.current.play().catch(console.error);
    }
  };

  const cleanupMedia = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
  };

  const playRingtone = () => {
    try {
      if (!audioContextRef.current) return;
      
      // Stop any existing ringtone
      stopRingtone();
      
      const audioContext = audioContextRef.current;
      
      // Create oscillator for ringtone (dual tone: 440Hz + 480Hz)
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.frequency.value = 440; // A4 note
      oscillator2.frequency.value = 480; // B4 note
      gainNode.gain.value = 0.3; // Volume
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.start();
      oscillator2.start();
      
      // Store references for cleanup
      ringtoneOscillatorRef.current = [oscillator1, oscillator2];
      ringtoneGainRef.current = gainNode;
      
      // Ring pattern: 2 seconds on, 4 seconds off
      const ringPattern = () => {
        if (ringtoneGainRef.current) {
          ringtoneGainRef.current.gain.setValueAtTime(0.3, audioContext.currentTime);
          ringtoneGainRef.current.gain.setValueAtTime(0, audioContext.currentTime + 2);
          setTimeout(ringPattern, 6000);
        }
      };
      ringPattern();
      
      console.log('Ringtone started');
    } catch (err) {
      console.error('Failed to play ringtone:', err);
    }
  };

  const stopRingtone = () => {
    try {
      if (ringtoneOscillatorRef.current.length > 0) {
        ringtoneOscillatorRef.current.forEach(osc => {
          osc.stop();
          osc.disconnect();
        });
        ringtoneOscillatorRef.current = [];
      }
      if (ringtoneGainRef.current) {
        ringtoneGainRef.current.disconnect();
        ringtoneGainRef.current = null;
      }
      console.log('Ringtone stopped');
    } catch (err) {
      console.error('Failed to stop ringtone:', err);
    }
  };

  const handleDigit = (digit: string) => {
    if (callStatus === 'idle') {
      setPhoneNumber(prev => {
        if (digit === '0' && prev === '') {
          // Mimic long-press zero to produce '+' for international dialing
          return '+';
        }
        return prev + digit;
      });
    } else if (callStatus === 'connected' && sessionRef.current) {
      // Send DTMF tone
      try {
        // DTMF will be sent via RTP when supported by the session
        // For now, just log it
        console.log('Sending DTMF:', digit);
        // TODO: Implement DTMF via SIP INFO or RTP
      } catch (err) {
        console.error('Failed to send DTMF:', err);
      }
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber || callStatus !== 'idle' || !userAgentRef.current || !credentials) return;

    try {
      setCallStatus('ringing');
      setError(null);

      const target = UserAgent.makeURI(`sip:${phoneNumber}@${credentials.domain}`);
      if (!target) {
        throw new Error('Invalid phone number');
      }

      const inviter = new Inviter(userAgentRef.current, target, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false
          }
        },
        // Disable session timers by requesting Session-Expires: 0
        extraHeaders: [
          'Session-Expires: 0'
        ]
      });

      sessionRef.current = inviter;

      // Setup session state change handler
      inviter.stateChange.addListener((state: SessionState) => {
        console.log('Outgoing session state:', state);
        
        switch (state) {
          case SessionState.Establishing:
            setCallStatus('ringing');
            break;
          case SessionState.Established:
            setCallStatus('connected');
            setupRemoteMedia(inviter);
            addToRecentCalls({
              id: Date.now().toString(),
              number: phoneNumber,
              direction: 'outbound',
              status: 'connected',
              startTime: new Date(),
            });
            break;
          case SessionState.Terminated:
            cleanupMedia();
            setCallStatus('idle');
            setPhoneNumber('');
            setIsMuted(false);
            setIsOnHold(false);
            break;
        }
      });

      // Send INVITE
      await inviter.invite();
      console.log('Call initiated to:', phoneNumber);

    } catch (err) {
      setError('Failed to place call');
      setCallStatus('idle');
      console.error('Call error:', err);
    }
  };

  const handleHangup = () => {
    if (!sessionRef.current) return;

    setCallStatus('disconnecting');
    
    try {
      const session = sessionRef.current;
      
      switch (session.state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          if (session instanceof Inviter) {
            session.cancel();
          } else {
            // For incoming calls, use bye or terminate
            session.bye().catch(() => {
              // If bye fails, session is probably already terminated
            });
          }
          break;
        case SessionState.Established:
          session.bye();
          break;
      }
      
      cleanupMedia();
    } catch (err) {
      console.error('Hangup error:', err);
    }

    setTimeout(() => {
      setCallStatus('idle');
      setPhoneNumber('');
      setIsMuted(false);
      setIsOnHold(false);
      sessionRef.current = null;
    }, 500);
  };

  const handleAnswer = () => {
    if (!incomingCall || !sessionRef.current) return;

    try {
      const session = sessionRef.current as Invitation;
      
      // Accept the invitation with audio constraints
      const options = {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false
          }
        },
        // Disable session timers
        extraHeaders: [
          'Session-Expires: 0'
        ]
      };

      session.accept(options);
      setCallStatus('connected');
      setPhoneNumber(incomingCall.number);
      setIncomingCall(null);
    } catch (err) {
      console.error('Answer error:', err);
      setError('Failed to answer call');
    }
  };

  const handleReject = () => {
    if (!sessionRef.current) return;

    // Stop ringtone
    stopRingtone();

    try {
      const session = sessionRef.current as Invitation;
      session.reject();
    } catch (err) {
      console.error('Reject error:', err);
    }

    setIncomingCall(null);
    setCallStatus('idle');
    sessionRef.current = null;
  };

  const toggleMute = () => {
    if (!sessionRef.current) return;

    try {
      const sessionDescriptionHandler = sessionRef.current.sessionDescriptionHandler;
      if (!sessionDescriptionHandler) return;

      const peerConnection = (sessionDescriptionHandler as any).peerConnection as RTCPeerConnection;
      if (!peerConnection) return;

      peerConnection.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = isMuted; // Toggle: if currently muted, enable it
        }
      });

      setIsMuted(!isMuted);
    } catch (err) {
      console.error('Mute toggle error:', err);
    }
  };

  const toggleHold = () => {
    if (!sessionRef.current) return;

    try {
      // Hold/Unhold via re-INVITE with modified SDP
      // This is a simplified implementation
      setIsOnHold(!isOnHold);
      
      // TODO: Implement proper hold/unhold with SDP modification
      console.log(isOnHold ? 'Unholding call' : 'Holding call');
    } catch (err) {
      console.error('Hold toggle error:', err);
    }
  };

  const addToRecentCalls = (call: Call) => {
    setRecentCalls(prev => [call, ...prev.slice(0, 9)]);
  };

  const dialPadButtons = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' },
  ];

  if (credentialsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
            <Phone className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Softphone</h2>
          <p className="text-gray-600 mb-4">Setting up your WebRTC connection...</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Loading credentials</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Connecting to SIP server</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span>Registering extension</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Softphone Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load softphone credentials.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Minimized Widget */}
      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isRegistered ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900">Softphone</h3>
                  <p className="text-xs text-gray-500">Ext {credentials?.extension}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {callStatus !== 'idle' && (
              <div className="space-y-3">
                {/* Call Info */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{phoneNumber || 'Unknown'}</span>
                    {callStatus === 'connected' && (
                      <span className="text-xs text-gray-600">{formatDuration(callDuration)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {callStatus === 'ringing' && (
                      <>
                        <PhoneOutgoing className="w-3 h-3 text-blue-600 animate-pulse" />
                        <span className="text-blue-600">Calling...</span>
                      </>
                    )}
                    {callStatus === 'connected' && (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Connected</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 mx-auto" /> : <Mic className="w-4 h-4 mx-auto" />}
                  </button>
                  <button
                    onClick={toggleHold}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      isOnHold ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isOnHold ? <Play className="w-4 h-4 mx-auto" /> : <Pause className="w-4 h-4 mx-auto" />}
                  </button>
                  <button
                    onClick={handleHangup}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <PhoneOff className="w-4 h-4 mx-auto" />
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <VolumeX className="w-3 h-3 text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-1"
                  />
                  <Volume2 className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600 w-8">{volume}%</span>
                </div>
              </div>
            )}

            {callStatus === 'idle' && (
              <p className="text-sm text-gray-500 text-center py-2">No active call</p>
            )}
          </div>
        </div>
      )}

      {/* Main Softphone View */}
      {!isMinimized && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isRegistered ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">🔴 TEST BUILD NOV 26 🔴</h1>
                  <p className="text-sm text-gray-500">
                    {credentials?.extension && (
                      <span className="font-medium text-gray-700">Extension {credentials.extension}</span>
                    )}
                    {credentials?.extension && ' • '}
                    {isRegistered ? (
                      <span className="text-green-600 font-medium">Registered</span>
                    ) : (
                      <span className="text-red-600">Not registered</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {callStatus !== 'idle' && (
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    title="Minimize (keep call active)"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Mobile Softphone Credentials Panel */}
        {showSettings && credentials && (
          <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Mobile Softphone Credentials</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">Use these credentials to configure a mobile SIP app (Zoiper, Linphone, etc.)</p>
            
            <div className="space-y-2">
              {/* Extension */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Extension</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.extension);
                      setCopiedField('extension');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900">{credentials.extension}</div>
              </div>

              {/* Username */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Username</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.username);
                      setCopiedField('username');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900">{credentials.username}</div>
              </div>

              {/* Password */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Password</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-600 hover:text-gray-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(credentials.password);
                        setCopiedField('password');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="font-mono text-sm text-gray-900">
                  {showPassword ? credentials.password : '••••••••••••'}
                </div>
              </div>

              {/* Domain */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Domain/Server</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.domain);
                      setCopiedField('domain');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900">{credentials.domain}</div>
              </div>

              {/* Proxy */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Proxy/Outbound Proxy</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.proxy);
                      setCopiedField('proxy');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900">{credentials.proxy}</div>
              </div>

              {/* Port */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Port</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.port.toString());
                      setCopiedField('port');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900">{credentials.port}</div>
              </div>

              {/* Transport */}
              <div className="bg-white rounded-md p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Transport</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.transport);
                      setCopiedField('transport');
                      setTimeout(() => setCopiedField(null), 2000);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900">{credentials.transport}</div>
              </div>
            </div>

            {copiedField && (
              <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Copied to clipboard!</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Softphone */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
            {/* Call Status Display */}
            <div className="text-center mb-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={phoneNumber}
                  readOnly
                  placeholder="Enter number"
                  className="w-full text-center text-2xl font-light text-gray-900 bg-transparent border-none focus:outline-none"
                />
              </div>

              {callStatus !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    {callStatus === 'ringing' && (
                      <>
                        <PhoneOutgoing className="w-5 h-5 text-blue-600 animate-pulse" />
                        <span className="text-blue-600 font-medium">Calling...</span>
                      </>
                    )}
                    {callStatus === 'connected' && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">Connected</span>
                      </>
                    )}
                    {callStatus === 'disconnecting' && (
                      <span className="text-gray-600">Disconnecting...</span>
                    )}
                  </div>
                  
                  {callStatus === 'connected' && (
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg font-mono">{formatDuration(callDuration)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Number Input Field */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number..."
                  disabled={!isRegistered || callStatus !== 'idle'}
                  className="w-full px-4 py-3 text-center text-xl font-mono border-2 border-gray-300 rounded-lg
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none
                           disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
                {phoneNumber && callStatus === 'idle' && (
                  <button
                    onClick={() => setPhoneNumber('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-xl">×</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dial Pad */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {dialPadButtons.map((button) => (
                <button
                  key={button.digit}
                  onClick={() => handleDigit(button.digit)}
                  disabled={!isRegistered}
                  className="aspect-square rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95
                           flex flex-col items-center justify-center group py-3"
                >
                  <span className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                    {button.digit}
                  </span>
                  {button.letters && (
                    <span className="text-xs text-gray-500 group-hover:text-blue-500">
                      {button.letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Call Controls */}
            <div className="space-y-3">
              {callStatus === 'idle' ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPhoneNumber('')}
                      disabled={!phoneNumber}
                      className="py-3 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 
                               disabled:cursor-not-allowed rounded-lg font-medium text-gray-700 text-sm 
                               flex items-center justify-center space-x-2 transition-colors"
                    >
                      <span className="text-xl">×</span>
                      <span>Clear</span>
                    </button>
                    <button
                      onClick={handleBackspace}
                      disabled={!phoneNumber}
                      className="py-3 px-4 bg-red-50 hover:bg-red-100 disabled:opacity-50 
                               disabled:cursor-not-allowed rounded-lg font-medium text-red-700 text-sm 
                               flex items-center justify-center space-x-2 transition-colors border border-red-200"
                    >
                      <span className="text-lg">⌫</span>
                      <span>Delete</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handleCall}
                    disabled={!phoneNumber || !isRegistered}
                    className="w-full py-4 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 
                             disabled:cursor-not-allowed rounded-lg font-semibold text-white text-lg
                             flex items-center justify-center space-x-2 transition-colors shadow-md
                             hover:shadow-lg active:scale-95"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call</span>
                  </button>
                  
                  {/* Echo Test Button */}
                  <button
                    onClick={() => {
                      setPhoneNumber('600');
                      setTimeout(() => handleCall(), 100);
                    }}
                    disabled={!isRegistered}
                    className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 
                             disabled:cursor-not-allowed rounded-lg font-medium text-blue-700 text-sm
                             flex items-center justify-center space-x-2 transition-colors border border-blue-200"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Test Audio & Microphone (Echo Test)</span>
                  </button>

                  {/* Test Extensions Info */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-gray-700">
                        <p className="font-medium mb-1.5">Test Extensions:</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setPhoneNumber('600');
                                setTimeout(() => handleCall(), 100);
                              }}
                              disabled={!isRegistered}
                              className="font-mono text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                            >
                              600
                            </button>
                            <span className="text-gray-600">- Echo test (audio & mic)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setPhoneNumber('601');
                                setTimeout(() => handleCall(), 100);
                              }}
                              disabled={!isRegistered}
                              className="font-mono text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                            >
                              601
                            </button>
                            <span className="text-gray-600">- Music on hold</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setPhoneNumber('602');
                                setTimeout(() => handleCall(), 100);
                              }}
                              disabled={!isRegistered}
                              className="font-mono text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                            >
                              602
                            </button>
                            <span className="text-gray-600">- Milliwatt tone (1000Hz)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={toggleMute}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-1
                               ${isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>Mute</span>
                    </button>
                    
                    <button
                      onClick={toggleHold}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-1
                               ${isOnHold ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      <span>Hold</span>
                    </button>

                    <button
                      onClick={() => {/* TODO: Transfer */}}
                      disabled
                      className="py-2 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 
                               rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-colors"
                    >
                      <PhoneForwarded className="w-4 h-4" />
                      <span>Transfer</span>
                    </button>
                  </div>

                  {/* Volume Control - Shown during call */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <VolumeX className="w-4 h-4 text-blue-600" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium w-12 text-right">{volume}%</span>
                    </div>
                  </div>

                  <button
                    onClick={handleHangup}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white 
                             flex items-center justify-center space-x-2 transition-colors"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span>Hang Up</span>
                  </button>
                </>
              )}
            </div>

            {/* Volume Control - Always visible */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-600 mb-2">Speaker Volume</label>
              <div className="flex items-center space-x-3">
                <VolumeX className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <Volume2 className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700 font-medium w-12 text-right">{volume}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Calls */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
              {recentCalls.length > 0 && (
                <span className="text-xs text-gray-500">{recentCalls.length} calls</span>
              )}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {recentCalls.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent calls</p>
                  <p className="text-gray-400 text-xs mt-1">Your call history will appear here</p>
                </div>
              ) : (
                recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group"
                  >
                    <div 
                      onClick={() => setPhoneNumber(call.number)}
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        call.direction === 'outbound' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {call.direction === 'outbound' ? (
                          <PhoneOutgoing className="w-4 h-4 text-green-600" />
                        ) : (
                          <PhoneIncoming className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{call.number}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{call.startTime?.toLocaleTimeString()}</span>
                          {call.duration !== undefined && call.duration > 0 && (
                            <span className="text-gray-400">• {Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhoneNumber(call.number);
                        setTimeout(() => handleCall(), 100);
                      }}
                      disabled={!isRegistered}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Call this number"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <PhoneIncoming className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Incoming Call</h3>
              <p className="text-3xl font-light text-gray-700 mb-8">{incomingCall.number}</p>
              
              <div className="flex gap-4">
                <button
                  onClick={handleReject}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium 
                           flex items-center justify-center space-x-2 transition-colors"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={handleAnswer}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium 
                           flex items-center justify-center space-x-2 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Answer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </>
  );
}
