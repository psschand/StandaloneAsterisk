import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Pause,
  Clock,
  Plus,
  User
} from 'lucide-react';
import apiClient from '../../lib/api';
import config from '../../config';
import { useSoftphone } from '../../contexts/SoftphoneContext';

interface Call {
  id: string;
  direction: 'inbound' | 'outbound';
  caller_id: string;
  callee_id: string;
  status: 'ringing' | 'answered' | 'on-hold' | 'transferring';
  duration: number;
  start_time: string;
  channel: string;
  queue?: string;
}

export default function Calls() {
  const queryClient = useQueryClient();
  const { makeCall } = useSoftphone();
  const [showMakeCall, setShowMakeCall] = useState(false);
  const [callNumber, setCallNumber] = useState('');
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [callNotes, setCallNotes] = useState<Record<string, string>>({});

  // Fetch active calls
  const { data: calls = [], isLoading } = useQuery<Call[]>({
    queryKey: ['calls', 'active'],
    queryFn: async () => {
      const response = await apiClient.get(config.api.calls.active);
      return response.data.data || [];
    },
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  // Hangup call mutation
  const hangupMutation = useMutation({
    mutationFn: async (callId: string) => {
      return await apiClient.post(config.api.calls.hangup(callId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: Call) => {
    if (call.direction === 'inbound') {
      return <PhoneCall className="w-5 h-5 text-green-600" />;
    }
    return <Phone className="w-5 h-5 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ringing: 'bg-yellow-100 text-yellow-800 animate-pulse',
      answered: 'bg-green-100 text-green-800',
      'on-hold': 'bg-orange-100 text-orange-800',
      transferring: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleMakeCall = () => {
    const number = callNumber.trim();
    if (!number) return;

    makeCall(number);
    setShowMakeCall(false);
    setCallNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Calls</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your active calls</p>
        </div>
        <button
          onClick={() => setShowMakeCall(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Make Call</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <PhoneCall className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Calls</p>
              <p className="text-2xl font-bold text-gray-900">{calls.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inbound</p>
              <p className="text-2xl font-bold text-gray-900">
                {calls.filter(c => c.direction === 'inbound').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Outbound</p>
              <p className="text-2xl font-bold text-gray-900">
                {calls.filter(c => c.direction === 'outbound').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Pause className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-gray-900">
                {calls.filter(c => c.status === 'on-hold').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Calls List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Calls</h2>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading calls...</div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <PhoneOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active calls</p>
            <button
              onClick={() => setShowMakeCall(true)}
              className="btn-primary mt-4"
            >
              Make a Call
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Call Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getCallIcon(call)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {call.direction === 'inbound' ? call.caller_id : call.callee_id}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(call.status)}`}>
                          {call.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>From: {call.caller_id}</span>
                        </span>

                        <span className="flex items-center space-x-1">
                          <span>To: {call.callee_id}</span>
                        </span>
                        
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(call.duration)}</span>
                        </span>
                        
                        {call.queue && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            Queue: {call.queue}
                          </span>
                        )}
                      </div>

                      {/* Call Notes */}
                      {selectedCall === call.id && (
                        <div className="mt-3">
                          <textarea
                            value={callNotes[call.id] || ''}
                            onChange={(e) => setCallNotes({ ...callNotes, [call.id]: e.target.value })}
                            placeholder="Add notes about this call..."
                            className="input text-sm"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="flex items-center space-x-2">
                    {/* Hangup */}
                    <button
                      onClick={() => hangupMutation.mutate(call.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Hangup"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>

                    {/* Add Notes Toggle */}
                    <button
                      onClick={() => setSelectedCall(selectedCall === call.id ? null : call.id)}
                      className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      title="Add Notes"
                    >
                      <span className="text-sm">📝</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Make Call Modal */}
      {showMakeCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Make a Call</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={callNumber}
                  onChange={(e) => setCallNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="input"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMakeCall(false);
                    setCallNumber('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeCall}
                  disabled={!callNumber.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
