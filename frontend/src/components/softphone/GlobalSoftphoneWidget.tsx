import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  PhoneOff, 
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  Clock,
  Maximize2,
  PhoneIncoming
} from 'lucide-react';
import { useSoftphone } from '../../contexts/SoftphoneContext';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const GlobalSoftphoneWidget: React.FC = () => {
  const navigate = useNavigate();
  const {
    isRegistered,
    callStatus,
    phoneNumber,
    callDuration,
    isMuted,
    isOnHold,
    volume,
    incomingCall,
    isMinimized,
    setIsMinimized,
    hangup,
    answer,
    reject,
    toggleMute,
    toggleHold,
    setVolume
  } = useSoftphone();

  // Request notification permission on mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show browser notification for incoming calls
  React.useEffect(() => {
    if (incomingCall && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Incoming Call', {
        body: `Call from ${incomingCall.number}`,
        icon: '/favicon.ico',
        tag: 'incoming-call',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        navigate('/softphone');
        notification.close();
      };

      return () => {
        notification.close();
      };
    }
  }, [incomingCall, navigate]);

  // Don't show widget if no active call and no incoming call
  if (callStatus === 'idle' && !incomingCall) {
    return null;
  }

  // Don't show active call widget if on softphone page and not minimized
  const showActiveCallWidget = callStatus !== 'idle' && isMinimized;

  const handleMaximize = () => {
    setIsMinimized(false);
    navigate('/softphone');
  };

  return (
    <>
      {/* Incoming Call - Top Center Banner (Always Visible) */}
      {incomingCall && (
        <div className="fixed top-0 left-0 right-0 z-[10000] bg-gradient-to-r from-blue-600 to-blue-700 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <PhoneIncoming className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium">Incoming Call</p>
                  <p className="text-2xl font-bold text-white">{incomingCall.number || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={answer}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Phone className="w-5 h-5" />
                  Answer
                </button>
                <button
                  onClick={reject}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <PhoneOff className="w-5 h-5" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Widget - Bottom Right (Only when minimized) */}
      {showActiveCallWidget && (
        <div className="fixed bottom-4 right-4 z-[9999]">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${callStatus === 'connected' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
              <span className="text-sm font-medium">
                {callStatus === 'ringing' && 'Calling...'}
                {callStatus === 'connected' && 'Connected'}
                {callStatus === 'disconnecting' && 'Ending...'}
              </span>
            </div>
            <button
              onClick={handleMaximize}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Maximize"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-2xl font-bold mb-1">{phoneNumber || 'Unknown'}</p>
            {callStatus === 'connected' && (
              <div className="flex items-center gap-2 text-blue-100">
                <Clock className="w-4 h-4" />
                <span className="text-lg font-mono">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleHold}
              className={`p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isOnHold 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isOnHold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="text-sm">{isOnHold ? 'Resume' : 'Hold'}</span>
            </button>
          </div>

          {/* Volume Control */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-4 h-4 text-blue-100" />
              <span className="text-xs text-blue-100">Volume</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>

          {/* Hangup Button */}
          <button
            onClick={hangup}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium
                     transition-all flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            Hang Up
          </button>

          {/* Registration Status */}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
            <span>Softphone Status</span>
            <span className={isRegistered ? 'text-green-300' : 'text-red-300'}>
              {isRegistered ? 'Registered' : 'Not Registered'}
            </span>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default GlobalSoftphoneWidget;
