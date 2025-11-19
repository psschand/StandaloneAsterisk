import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Phone,
  Clock,
  PhoneOff,
  Circle,
  Coffee,
  Moon,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Target,
  Activity
} from 'lucide-react';

// Types
interface Queue {
  id: number;
  name: string;
  extension: string;
  strategy: string;
  timeout: number;
  retry: number;
  weight: number;
  max_len: number;
  announce_frequency: number;
  announce_holdtime: string;
  announce_position: string;
  created_at: string;
  updated_at: string;
}

interface QueueMember {
  id: number;
  queue_id: number;
  queue_name?: string;
  agent_name: string;
  agent_interface: string;
  state_interface?: string;
  penalty: number;
  paused: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentState {
  agent_id: number;
  user_id: number;
  username: string;
  status: 'available' | 'on_call' | 'on_break' | 'away' | 'offline';
  extension?: string;
  queue_memberships?: string[];
  current_call_id?: string;
  calls_handled_today: number;
  total_talk_time_today: number;
  last_call_time?: string;
}

interface WaitingCall {
  queue: string;
  caller_id: string;
  wait_time: number;
  position: number;
}

interface ActiveCall {
  channel: string;
  caller_id: string;
  agent: string;
  queue: string;
  duration: number;
}

interface QueueStats {
  queue_name: string;
  calls_waiting: number;
  calls_active: number;
  agents_available: number;
  agents_total: number;
  longest_wait_time: number;
  avg_wait_time: number;
  calls_completed_today: number;
  calls_abandoned_today: number;
  service_level: number;
}

const statusConfig = {
  available: {
    label: 'Available',
    icon: Circle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  on_call: {
    label: 'On Call',
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  on_break: {
    label: 'On Break',
    icon: Coffee,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  away: {
    label: 'Away',
    icon: Moon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  offline: {
    label: 'Offline',
    icon: PhoneOff,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

export default function QueueDashboard() {
  const [selectedQueue, setSelectedQueue] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Fetch queues
  const { data: queuesData } = useQuery<{ success: boolean; data: Queue[] }>({
    queryKey: ['queues'],
    queryFn: async () => {
      const response = await fetch('/api/v1/queues', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch queues');
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const queues = queuesData?.data || [];

  // Fetch queue members (not used in current view but useful for future enhancements)
  useQuery<{ success: boolean; data: QueueMember[] }>({
    queryKey: ['queueMembers', selectedQueue],
    queryFn: async () => {
      const url = selectedQueue 
        ? `/api/v1/queues/${selectedQueue}/members`
        : '/api/v1/queue-members';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch queue members');
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    enabled: true,
  });

  // Fetch agent states
  const { data: agentStatesData } = useQuery<{ success: boolean; data: AgentState[] }>({
    queryKey: ['agentStates'],
    queryFn: async () => {
      const response = await fetch('/api/v1/agent-state', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch agent states');
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const agentStates = agentStatesData?.data || [];

  // Fetch queue statistics
  const { data: statsData } = useQuery<{ success: boolean; data: QueueStats[] }>({
    queryKey: ['queueStats', selectedQueue],
    queryFn: async () => {
      const url = selectedQueue
        ? `/api/v1/queues/${selectedQueue}/stats`
        : '/api/v1/queue-stats';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch queue stats');
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const stats = statsData?.data || [];

  // Calculate overview stats
  const overviewStats = {
    totalWaiting: stats.reduce((sum, s) => sum + s.calls_waiting, 0),
    totalActive: stats.reduce((sum, s) => sum + s.calls_active, 0),
    totalAvailable: stats.reduce((sum, s) => sum + s.agents_available, 0),
    totalAgents: agentStates.length,
    avgServiceLevel: stats.length > 0
      ? stats.reduce((sum, s) => sum + s.service_level, 0) / stats.length
      : 0,
    totalAbandoned: stats.reduce((sum, s) => sum + s.calls_abandoned_today, 0),
  };

  // Mock data for waiting and active calls (replace with real ARI data when available)
  const waitingCalls: WaitingCall[] = [];
  const activeCalls: ActiveCall[] = [];

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time monitoring of call queues and agents</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </span>
          </button>
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {overviewStats.totalWaiting}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Calls Waiting</p>
          <p className="text-xs text-gray-400">In all queues</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {overviewStats.totalActive}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Active Calls</p>
          <p className="text-xs text-gray-400">Currently in progress</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              {overviewStats.totalAvailable}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Available Agents</p>
          <p className="text-xs text-gray-400">Ready to take calls</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {overviewStats.totalAgents}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Total Agents</p>
          <p className="text-xs text-gray-400">All statuses</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              {overviewStats.avgServiceLevel.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Service Level</p>
          <p className="text-xs text-gray-400">Average across queues</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <PhoneOff className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-red-600">
              {overviewStats.totalAbandoned}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mt-2">Abandoned</p>
          <p className="text-xs text-gray-400">Today</p>
        </div>
      </div>

      {/* Queue Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Queue:</label>
          <select
            value={selectedQueue || ''}
            onChange={(e) => setSelectedQueue(e.target.value ? parseInt(e.target.value) : null)}
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Queues</option>
            {queues.map((queue) => (
              <option key={queue.id} value={queue.id}>
                {queue.name} ({queue.extension})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue Statistics Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.queue_name} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{stat.queue_name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  stat.service_level >= 80
                    ? 'bg-green-100 text-green-700'
                    : stat.service_level >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {stat.service_level.toFixed(1)}% SL
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Waiting</p>
                  <p className="text-2xl font-bold text-orange-600">{stat.calls_waiting}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Active</p>
                  <p className="text-2xl font-bold text-blue-600">{stat.calls_active}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stat.agents_available}/{stat.agents_total}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Longest Wait</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(stat.longest_wait_time)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Completed: </span>
                  <span className="font-semibold text-green-600">{stat.calls_completed_today}</span>
                </div>
                <div>
                  <span className="text-gray-500">Abandoned: </span>
                  <span className="font-semibold text-red-600">{stat.calls_abandoned_today}</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Wait: </span>
                  <span className="font-semibold text-gray-900">{formatTime(stat.avg_wait_time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Waiting Calls */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Waiting Calls</h2>
                  <p className="text-xs text-gray-500">{waitingCalls.length} calls in queue</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {waitingCalls.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">No calls waiting</p>
                <p className="text-xs text-gray-400 mt-1">All queues are clear</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingCalls.map((call, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">#{call.position}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{call.caller_id}</p>
                        <p className="text-xs text-gray-500">{call.queue}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{formatTime(call.wait_time)}</p>
                      <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Pick Call →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Calls */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Active Calls</h2>
                  <p className="text-xs text-gray-500">{activeCalls.length} calls in progress</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeCalls.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PhoneOff className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No active calls</p>
                <p className="text-xs text-gray-400 mt-1">Waiting for incoming calls</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCalls.map((call, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{call.caller_id}</p>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-blue-600">{call.agent}</p>
                      </div>
                      <p className="text-xs text-gray-500">{call.queue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{formatDuration(call.duration)}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Activity className="w-3 h-3 text-blue-600 animate-pulse" />
                        <span className="text-xs text-blue-600 font-medium">Live</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Agent Status</h2>
                <p className="text-xs text-gray-500">{agentStates.length} agents</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {agentStates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No agents found</p>
              <p className="text-xs text-gray-400 mt-1">Configure agents to see their status</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {agentStates.map((agent) => {
                const config = statusConfig[agent.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={agent.agent_id}
                    className={`p-4 rounded-lg border-2 transition-all ${config.bgColor} ${config.borderColor} hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{agent.username}</p>
                          <p className="text-xs text-gray-500">{agent.extension || 'No ext'}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`px-2 py-1 rounded-md text-xs font-medium text-center ${config.bgColor} ${config.borderColor} border`}>
                      {config.label}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Calls Today</p>
                        <p className="font-bold text-gray-900">{agent.calls_handled_today}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Talk Time</p>
                        <p className="font-bold text-gray-900">{formatDuration(agent.total_talk_time_today)}</p>
                      </div>
                    </div>

                    {agent.queue_memberships && agent.queue_memberships.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Queues:</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.queue_memberships.map((queue, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md"
                            >
                              {queue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
