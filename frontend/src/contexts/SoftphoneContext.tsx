import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  UserAgent, 
  Registerer, 
  Inviter, 
  Invitation,
  SessionState,
  RegistererState
} from 'sip.js';
import type { Session } from 'sip.js';
import apiClient from '../lib/api';
import config from '../config';
import { useAuthStore } from '../store/authStore';

interface SIPCredentials {
  username: string;
  password: string;
  domain: string;
  proxy: string;
  port: number;
  transport: 'UDP' | 'TCP' | 'TLS' | 'WS' | 'WSS';
  extension: string;
}

type CallStatus = 'idle' | 'ringing' | 'connected' | 'disconnecting';

interface SoftphoneContextType {
  isRegistered: boolean;
  callStatus: CallStatus;
  phoneNumber: string;
  callDuration: number;
  isMuted: boolean;
  isOnHold: boolean;
  volume: number;
  incomingCall: any;
  credentials: SIPCredentials | null;
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
  makeCall: (number: string) => void;
  hangup: () => void;
  answer: () => void;
  reject: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  setVolume: (volume: number) => void;
  setPhoneNumber: (number: string) => void;
}

const SoftphoneContext = createContext<SoftphoneContextType | null>(null);

export const useSoftphone = () => {
  const context = useContext(SoftphoneContext);
  if (!context) {
    throw new Error('useSoftphone must be used within SoftphoneProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const SoftphoneProvider: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [isRegistered, setIsRegistered] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [volume, setVolume] = useState(100);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [credentials, setCredentials] = useState<SIPCredentials | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneOscillatorRef = useRef<OscillatorNode[]>([]);
  const ringtoneGainRef = useRef<GainNode | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);

  // Auto-minimize when navigating away from /softphone
  useEffect(() => {
    if (location.pathname !== '/softphone' && callStatus !== 'idle') {
      setIsMinimized(true);
    } else if (location.pathname === '/softphone') {
      setIsMinimized(false);
    }
  }, [location.pathname, callStatus]);

  // Fetch credentials - only when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't fetch credentials if not logged in
    }

    const fetchCredentials = async () => {
      try {
        console.log('[Softphone] Fetching credentials from:', config.api.softphone.credentials);
        const response = await apiClient.get(config.api.softphone.credentials);
        console.log('[Softphone] Credentials response:', response.data);
        
        // Handle both direct data and wrapped response
        const credData = response.data.data || response.data;
        console.log('[Softphone] Setting credentials:', credData);
        setCredentials(credData);
      } catch (error: any) {
        console.error('[Softphone] Failed to fetch SIP credentials:', error);
        console.error('[Softphone] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Only show error on softphone page
        if (location.pathname === '/softphone') {
          alert(`Failed to load softphone: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        }
      }
    };
    fetchCredentials();
  }, [isAuthenticated, location.pathname]);

  // Initialize SIP.js - runs once with credentials
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
      const portSuffix = (protocol === 'wss' && credentials.port === 443) ? '' : `:${credentials.port}`;
      const server = `${protocol}://${credentials.proxy}${portSuffix}/ws`;
      const uri = UserAgent.makeURI(`sip:${credentials.extension}@${credentials.domain}`);
      
      if (!uri) {
        throw new Error('Failed to create SIP URI');
      }

      const userAgent = new UserAgent({
        uri,
        transportOptions: {
          server,
        },
        authorizationUsername: credentials.username,
        authorizationPassword: credentials.password,
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
            const callerNumber = invitation.remoteIdentity.uri.user || 'Unknown';
            setIncomingCall({
              id: Date.now().toString(),
              number: callerNumber,
              direction: 'inbound',
              status: 'ringing',
            });
            sessionRef.current = invitation;
            playRingtone();

            invitation.stateChange.addListener((state) => {
              if (state === SessionState.Terminated) {
                stopRingtone();
                setIncomingCall(null);
                setCallStatus('idle');
                setPhoneNumber('');
                setCallDuration(0);
                cleanupMedia();
              }
            });
          }
        }
      });

      userAgentRef.current = userAgent;

      userAgent.start().then(() => {
        const registerer = new Registerer(userAgent);
        registererRef.current = registerer;

        registerer.stateChange.addListener((state) => {
          setIsRegistered(state === RegistererState.Registered);
        });

        registerer.register();
      });

      return () => {
        // Keep alive - don't cleanup on unmount
      };
    } catch (err) {
      console.error('SIP initialization error:', err);
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
      setCallDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Volume control
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playRingtone = () => {
    if (!audioContextRef.current) return;

    stopRingtone();

    const context = audioContextRef.current;
    const gainNode = context.createGain();
    gainNode.gain.value = 0.3;
    gainNode.connect(context.destination);
    ringtoneGainRef.current = gainNode;

    const playTone = () => {
      const oscillator1 = context.createOscillator();
      const oscillator2 = context.createOscillator();
      
      oscillator1.frequency.value = 440;
      oscillator2.frequency.value = 480;
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      
      oscillator1.start();
      oscillator2.start();
      
      ringtoneOscillatorRef.current = [oscillator1, oscillator2];
      
      setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
      }, 2000);
    };

    playTone();
    ringtoneIntervalRef.current = window.setInterval(playTone, 4000);
  };

  const stopRingtone = () => {
    ringtoneOscillatorRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (error) {
        console.warn('Failed to stop ringtone oscillator', error);
      }
    });
    ringtoneOscillatorRef.current = [];

    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  const cleanupMedia = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
    stopRingtone();
  };

  const makeCall = async (number: string) => {
    if (!userAgentRef.current || !number) return;

    try {
      // Request microphone permission first
      console.log('[Softphone] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('[Softphone] Microphone permission granted');
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());

      const target = UserAgent.makeURI(`sip:${number}@${credentials?.domain}`);
      if (!target) {
        console.error('[Softphone] Failed to create SIP URI for number:', number);
        alert('Invalid phone number');
        return;
      }

      console.log('[Softphone] Making call to:', number, 'URI:', target.toString());

      const inviter = new Inviter(userAgentRef.current, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false }
        },
        extraHeaders: ['Session-Expires: 0']
      });

      sessionRef.current = inviter;
      setPhoneNumber(number);
      setCallStatus('ringing');

      inviter.stateChange.addListener((state) => {
        console.log('[Softphone] Call state changed to:', state);
        if (state === SessionState.Established) {
          setCallStatus('connected');
          const mediaStream = (inviter.sessionDescriptionHandler as any)?.peerConnection?.getRemoteStreams()[0];
          if (mediaStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = mediaStream;
          }
        } else if (state === SessionState.Terminated) {
          setCallStatus('idle');
          setPhoneNumber('');
          setCallDuration(0);
          setIsMuted(false);
          setIsOnHold(false);
          cleanupMedia();
        }
      });

      inviter.invite().catch((error: Error) => {
        console.error('[Softphone] Call failed:', error);
        alert(`Call failed: ${error.message}`);
        setCallStatus('idle');
      });
    } catch (error: any) {
      console.error('[Softphone] Microphone permission denied or error:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      } else {
        alert(`Call failed: ${error.message || 'Unknown error'}`);
      }
      setCallStatus('idle');
    }
  };

  const hangup = () => {
    if (sessionRef.current) {
      setCallStatus('disconnecting');
      
      if (sessionRef.current.state === SessionState.Established) {
        (sessionRef.current as any).bye?.();
      } else if (sessionRef.current instanceof Inviter) {
        sessionRef.current.cancel();
      } else if (sessionRef.current instanceof Invitation) {
        sessionRef.current.reject();
      }

      sessionRef.current = null;
      stopRingtone();
      setIncomingCall(null);
    }
  };

  const answer = () => {
    if (!sessionRef.current || !(sessionRef.current instanceof Invitation)) return;

    stopRingtone();
    setIncomingCall(null);
    setCallStatus('connected');

    const invitation = sessionRef.current as Invitation;
    invitation.accept({
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      },
      extraHeaders: ['Session-Expires: 0']
    }).then(() => {
      const mediaStream = (invitation.sessionDescriptionHandler as any)?.peerConnection?.getRemoteStreams()[0];
      if (mediaStream && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = mediaStream;
      }
    });

    invitation.stateChange.addListener((state) => {
      if (state === SessionState.Terminated) {
        setCallStatus('idle');
        setPhoneNumber('');
        setCallDuration(0);
        cleanupMedia();
      }
    });
  };

  const reject = () => {
    if (sessionRef.current instanceof Invitation) {
      sessionRef.current.reject();
      sessionRef.current = null;
    }
    stopRingtone();
    setIncomingCall(null);
  };

  const toggleMute = () => {
    if (!sessionRef.current) return;

    const pc = (sessionRef.current as any).sessionDescriptionHandler?.peerConnection;
    if (pc) {
      const senders = pc.getSenders();
      senders.forEach((sender: any) => {
        if (sender.track?.kind === 'audio') {
          sender.track.enabled = isMuted;
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleHold = () => {
    if (!sessionRef.current) return;

    if (isOnHold) {
      (sessionRef.current as any).unhold?.();
    } else {
      (sessionRef.current as any).hold?.();
    }
    setIsOnHold(!isOnHold);
  };

  const value: SoftphoneContextType = {
    isRegistered,
    callStatus,
    phoneNumber,
    callDuration,
    isMuted,
    isOnHold,
    volume,
    incomingCall,
    credentials,
    isMinimized,
    setIsMinimized,
    makeCall,
    hangup,
    answer,
    reject,
    toggleMute,
    toggleHold,
    setVolume,
    setPhoneNumber,
  };

  return (
    <SoftphoneContext.Provider value={value}>
      {children}
    </SoftphoneContext.Provider>
  );
};
