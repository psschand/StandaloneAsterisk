import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  PhoneIncoming,
  Pause,
  ArrowRightLeft,
  Clock,
  User,
  AlertCircle,
  X,
  Search
} from 'lucide-react';

// Types
interface Channel {
  id: string;
  name: string;
  state: string;
  caller_id_name: string;
  caller_id_num: string;
  connected_line_name: string;
  connected_line_num: string;
  accountcode: string;
  creation_time: string;
  dialplan?: {
    context: string;
    exten: string;
    priority: number;
  };
}

interface Bridge {
  id: string;
  technology: string;
  bridge_type: string;
  bridge_class: string;
  creator: string;
  name: string;
  channels: string[];
}

export default function CallControl() {
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferType, setTransferType] = useState<'blind' | 'attended'>('blind');
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch active channels
  const { data: channelsData, refetch: refetchChannels } = useQuery<{ success: boolean; data: Channel[] }>({
    queryKey: ['ariChannels'],
    queryFn: async () => {
      const response = await fetch('/api/v1/ari/channels', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch channels');
      return response.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const channels = channelsData?.data || [];

  // Fetch bridges
  const { data: bridgesData } = useQuery<{ success: boolean; data: Bridge[] }>({
    queryKey: ['ariBridges'],
    queryFn: async () => {
      const response = await fetch('/api/v1/ari/bridges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch bridges');
      return response.json();
    },
    refetchInterval: 3000,
  });

  const bridges = bridgesData?.data || [];

  // WebSocket connection for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to ARI events WebSocket
    const ws = new WebSocket(`ws://${window.location.hostname}:8080/api/v1/ari/events?token=${token}`);
    
    ws.onopen = () => {
      console.log('ARI WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        console.log('ARI Event:', eventData);
        
        // Refetch channels on relevant events
        if ([
          'StasisStart',
          'StasisEnd',
          'ChannelStateChange',
          'ChannelDestroyed',
          'ChannelHangupRequest'
        ].includes(eventData.type)) {
          refetchChannels();
          queryClient.invalidateQueries({ queryKey: ['ariBridges'] });
        }
      } catch (error) {
        console.error('Failed to parse ARI event:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('ARI WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('ARI WebSocket disconnected');
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [refetchChannels, queryClient]);

  // Answer call mutation
  const answerMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/v1/ari/channels/${channelId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to answer call');
      return response.json();
    },
    onSuccess: () => {
      refetchChannels();
    },
  });

  // Hangup call mutation
  const hangupMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/v1/ari/channels/${channelId}/hangup`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to hangup call');
      return response.json();
    },
    onSuccess: () => {
      refetchChannels();
      setSelectedCall(null);
    },
  });

  // Hold call mutation
  const holdMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/v1/ari/channels/${channelId}/hold`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to hold call');
      return response.json();
    },
    onSuccess: () => {
      refetchChannels();
    },
  });

  // Unhold call mutation (for future use)
  useMutation({
    mutationFn: async (channelId: string) => {
      const response = await fetch(`/api/v1/ari/channels/${channelId}/unhold`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to unhold call');
      return response.json();
    },
    onSuccess: () => {
      refetchChannels();
    },
  });

  // Transfer call mutation
  const transferMutation = useMutation({
    mutationFn: async ({ channelId, target, type }: { channelId: string; target: string; type: 'blind' | 'attended' }) => {
      const response = await fetch(`/api/v1/ari/channels/${channelId}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          type,
        }),
      });
      if (!response.ok) throw new Error('Failed to transfer call');
      return response.json();
    },
    onSuccess: () => {
      refetchChannels();
      setShowTransferModal(false);
      setTransferTarget('');
    },
  });

  // Calculate call duration
  const getCallDuration = (creationTime: string): number => {
    const created = new Date(creationTime).getTime();
    const now = Date.now();
    return Math.floor((now - created) / 1000);
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter channels
  const filteredChannels = channels.filter(channel => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      channel.caller_id_name?.toLowerCase().includes(search) ||
      channel.caller_id_num?.toLowerCase().includes(search) ||
      channel.connected_line_name?.toLowerCase().includes(search) ||
      channel.connected_line_num?.toLowerCase().includes(search)
    );
  });

  // Get status badge color
  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'ringing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'up':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'down':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case 'ringing':
        return PhoneIncoming;
      case 'up':
        return Phone;
      case 'down':
        return PhoneMissed;
      default:
        return AlertCircle;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Control</h1>
          <p className="text-sm text-gray-500 mt-1">Manage active calls with Asterisk ARI</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">ARI Connected</span>
          </div>
          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <span className="text-sm font-medium text-gray-700">{channels.length} Active Channel{channels.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <PhoneIncoming className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-yellow-600">
              {channels.filter(c => c.state.toLowerCase() === 'ringing').length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Ringing</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              {channels.filter(c => c.state.toLowerCase() === 'up').length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Active</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {bridges.length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Bridges</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {channels.length > 0
                ? formatDuration(
                    Math.max(...channels.map(c => getCallDuration(c.creation_time)))
                  )
                : '0:00'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Longest Call</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by caller ID, name, or number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Active Channels Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Active Channels</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time call monitoring and control</p>
        </div>

        {filteredChannels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No active calls</p>
            <p className="text-xs text-gray-400 mt-1">Waiting for incoming or outgoing calls</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Connected To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChannels.map((channel) => {
                  const StatusIcon = getStatusIcon(channel.state);
                  const duration = getCallDuration(channel.creation_time);

                  return (
                    <tr 
                      key={channel.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedCall === channel.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => setSelectedCall(channel.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{channel.name}</p>
                            <p className="text-xs text-gray-500">{channel.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {channel.caller_id_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{channel.caller_id_num || 'No number'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {channel.connected_line_name || '-'}
                          </p>
                          <p className="text-xs text-gray-500">{channel.connected_line_num || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(channel.state)}`}>
                          {channel.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          {formatDuration(duration)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {channel.state.toLowerCase() === 'ringing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              answerMutation.mutate(channel.id);
                            }}
                            disabled={answerMutation.isPending}
                            className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Answer
                          </button>
                        )}
                        
                        {channel.state.toLowerCase() === 'up' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                holdMutation.mutate(channel.id);
                              }}
                              disabled={holdMutation.isPending}
                              className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Hold
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCall(channel.id);
                                setShowTransferModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-1" />
                              Transfer
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hangupMutation.mutate(channel.id);
                          }}
                          disabled={hangupMutation.isPending}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <PhoneOff className="w-4 h-4 mr-1" />
                          Hangup
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transfer Call</h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTransferType('blind')}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      transferType === 'blind'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">Blind</p>
                    <p className="text-xs mt-1">Direct transfer</p>
                  </button>
                  <button
                    onClick={() => setTransferType('attended')}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      transferType === 'attended'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">Attended</p>
                    <p className="text-xs mt-1">Announce first</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer To (Extension/Number)
                </label>
                <input
                  type="text"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  placeholder="e.g., 100 or queue:support"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter extension number or queue:name for queue transfer
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedCall && transferTarget) {
                    transferMutation.mutate({
                      channelId: selectedCall,
                      target: transferTarget,
                      type: transferType,
                    });
                  }
                }}
                disabled={!transferTarget || transferMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferMutation.isPending ? 'Transferring...' : 'Transfer Call'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Bridges Info */}
      {bridges.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Bridges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bridges.map((bridge) => (
              <div key={bridge.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{bridge.name || bridge.id.substring(0, 8)}</p>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {bridge.bridge_type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Technology: {bridge.technology}</p>
                <div className="flex items-center text-xs text-gray-600">
                  <User className="w-3 h-3 mr-1" />
                  {bridge.channels.length} channel{bridge.channels.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
