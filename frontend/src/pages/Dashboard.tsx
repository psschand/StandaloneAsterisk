import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCallCenterStore } from '../store/callCenterStore';
import apiClient from '../lib/api';
import type { DashboardStats, Call, Agent } from '../types';
import { Phone, Users, Clock, TrendingUp, PhoneIncoming, PhoneOutgoing } from 'lucide-react';

interface AgentStateResponse {
  id: number;
  endpoint_id?: string;
  state: 'available' | 'busy' | 'away' | 'break' | 'offline' | 'dnd' | string;
}

export default function Dashboard() {
  const { stats, setStats, activeCalls, setActiveCalls, agents, setAgents } = useCallCenterStore();

  // Fetch active calls
  const { data: callsData } = useQuery({
    queryKey: ['active-calls'],
    queryFn: async () => {
      const response = await apiClient.get<{ data?: Call[] }>('/api/v1/calls/active');
      return response.data.data || [];
    },
    refetchInterval: 3000,
  });

  // Fetch agents
  const { data: agentStatesData } = useQuery({
    queryKey: ['agent-state'],
    queryFn: async () => {
      const response = await apiClient.get<{ data?: AgentStateResponse[] }>('/api/v1/agent-state');
      return response.data.data || [];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!agentStatesData) return;

    const mappedAgents: Agent[] = agentStatesData.map((agentState) => ({
      id: Number(agentState.id),
      user_id: Number(agentState.id),
      extension: agentState.endpoint_id || String(agentState.id),
      status: agentState.state,
      last_status_change: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setAgents(mappedAgents);
  }, [agentStatesData, setAgents]);

  useEffect(() => {
    if (callsData) setActiveCalls(callsData);
  }, [callsData, setActiveCalls]);

  useEffect(() => {
    const connectedCalls = activeCalls.filter((call) => call.status === 'answered').length;
    const availableAgents = agents.filter((agent) => agent.status === 'available').length;

    const derivedStats: DashboardStats = {
      active_calls: activeCalls.length,
      waiting_calls: Math.max(activeCalls.length - connectedCalls, 0),
      available_agents: availableAgents,
      total_agents: agents.length,
      calls_today: activeCalls.length,
      answered_calls_today: connectedCalls,
      average_wait_time: 0,
      average_call_duration:
        activeCalls.length > 0
          ? Math.round(
              activeCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / activeCalls.length
            )
          : 0,
    };

    setStats(derivedStats);
  }, [activeCalls, agents, setStats]);

  const statCards = [
    {
      name: 'Active Calls',
      value: stats?.active_calls || 0,
      icon: Phone,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'Available Agents',
      value: `${stats?.available_agents || 0}/${stats?.total_agents || 0}`,
      icon: Users,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      name: 'Avg Wait Time',
      value: `${Math.round(stats?.average_wait_time || 0)}s`,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-8%',
    },
    {
      name: 'Calls Today',
      value: stats?.calls_today || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+23%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time call center overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-2">{stat.change} from last hour</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Calls and Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Calls */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Calls</h2>
          {activeCalls.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active calls</p>
          ) : (
            <div className="space-y-3">
              {activeCalls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {call.direction === 'inbound' ? (
                      <PhoneIncoming className="w-5 h-5 text-green-600" />
                    ) : (
                      <PhoneOutgoing className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{call.caller_id}</p>
                      <p className="text-sm text-gray-500">
                        {call.direction} • {call.status}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-info">{call.duration || 0}s</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agents Status */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agents Status</h2>
          {agents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No agents available</p>
          ) : (
            <div className="space-y-3">
              {agents.slice(0, 5).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Agent {agent.extension}</p>
                      <p className="text-sm text-gray-500">Ext. {agent.extension}</p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      agent.status === 'available'
                        ? 'badge-success'
                        : agent.status === 'on_call'
                        ? 'badge-info'
                        : 'badge-warning'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
