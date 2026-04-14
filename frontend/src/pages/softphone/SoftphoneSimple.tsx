import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Settings as SettingsIcon,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  Smartphone,
  Info,
  Minimize2,
  History,
  Search
} from 'lucide-react';
import { useSoftphone } from '../../contexts/SoftphoneContext';

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

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function Softphone() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [contactLookup, setContactLookup] = useState('');

  const {
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
    setPhoneNumber
  } = useSoftphone();

  const handleDigit = (digit: string) => {
    if (callStatus === 'idle') {
      setPhoneNumber(phoneNumber + digit);
    }
  };

  const handleCall = () => {
    if (phoneNumber && isRegistered && callStatus === 'idle') {
      makeCall(phoneNumber);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openCallHistory = () => {
    navigate('/cdrs');
  };

  const openContactSearch = () => {
    const query = contactLookup.trim();
    navigate(query ? `/contacts?search=${encodeURIComponent(query)}` : '/contacts');
  };

  if (!credentials) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading softphone...</p>
        </div>
      </div>
    );
  }

  // When minimized, don't render the full page (global widget shows instead)
  if (isMinimized) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isRegistered ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WebRTC Softphone</h1>
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

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Softphone Credentials
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Extension', value: credentials.extension, field: 'extension' },
                  { label: 'Username', value: credentials.username, field: 'username' },
                  { label: 'Domain', value: credentials.domain, field: 'domain' },
                  { label: 'Proxy', value: credentials.proxy, field: 'proxy' },
                  { label: 'Port', value: credentials.port.toString(), field: 'port' },
                  { label: 'Transport', value: credentials.transport, field: 'transport' },
                ].map(({ label, value, field }) => (
                  <div key={field} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-gray-600">{label}:</span>
                      <span className="ml-2 font-medium text-gray-900">{value}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(value, field)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy"
                    >
                      {copiedField === field ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Password:</span>
                    <span className="ml-2 font-medium font-mono text-gray-900">
                      {showPassword ? credentials.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.password, 'password')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy"
                  >
                    {copiedField === 'password' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
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
              {/* Call Status */}
              <div className="text-center mb-4">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number..."
                  disabled={!isRegistered || callStatus !== 'idle'}
                  className="w-full px-4 py-3 text-center text-xl font-mono border-2 border-gray-300 rounded-lg
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none
                           disabled:bg-gray-100 disabled:cursor-not-allowed transition-all mb-4"
                />

                {callStatus !== 'idle' && (
                  <div className="mb-4">
                    <span className="text-lg font-medium text-gray-900">
                      {callStatus === 'ringing' && 'Calling...'}
                      {callStatus === 'connected' && `Connected - ${formatDuration(callDuration)}`}
                      {callStatus === 'disconnecting' && 'Ending...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Dial Pad */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {dialPadButtons.map((button) => (
                  <button
                    key={button.digit}
                    onClick={() => handleDigit(button.digit)}
                    disabled={!isRegistered || callStatus !== 'idle'}
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
              {callStatus === 'idle' ? (
                <button
                  onClick={handleCall}
                  disabled={!phoneNumber || !isRegistered}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                           text-white py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-6 h-6" />
                  Call
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={toggleMute}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      isMuted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  
                  <button
                    onClick={toggleHold}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      isOnHold ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isOnHold ? 'Resume' : 'Hold'}
                  </button>

                  <button
                    onClick={hangup}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                  >
                    End
                  </button>
                </div>
              )}

              {/* Volume Control */}
              <div className="mt-4">
                <label className="text-sm text-gray-600 block mb-2">Volume: {volume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Test Extensions Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Test Extensions</h3>
                <p className="text-sm text-gray-600">Use these to test your softphone</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { ext: '600', name: 'Echo Test', desc: 'Hear your own voice' },
                { ext: '601', name: 'Music on Hold', desc: 'Listen to hold music' },
                { ext: '602', name: 'Milliwatt Tone', desc: 'Test audio levels' }
              ].map(({ ext, name, desc }) => (
                <button
                  key={ext}
                  onClick={() => setPhoneNumber(ext)}
                  disabled={!isRegistered || callStatus !== 'idle'}
                  className="w-full text-left p-3 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200
                           disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold text-blue-600 group-hover:text-blue-700">
                        {ext}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                    <Phone className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Tools</h4>

              <button
                onClick={openCallHistory}
                className="w-full mb-3 text-left p-3 bg-white rounded-lg hover:shadow-md transition-all border border-gray-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Call History</div>
                    <div className="text-xs text-gray-500">Open active and recent call view</div>
                  </div>
                  <History className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </button>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Search Contacts</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contactLookup}
                    onChange={(e) => setContactLookup(e.target.value)}
                    placeholder="Name, phone, or company"
                    className="input text-sm"
                  />
                  <button
                    onClick={openContactSearch}
                    className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Search Contacts"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-bounce">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-10 h-10 text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Incoming Call</h2>
                <p className="text-3xl font-mono text-blue-600">{incomingCall.number}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={reject}
                  className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={answer}
                  className="py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-all"
                >
                  Answer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
