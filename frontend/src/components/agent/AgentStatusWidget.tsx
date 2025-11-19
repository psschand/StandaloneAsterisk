import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { 
  Circle, 
  Coffee, 
  Moon, 
  PhoneOff,
  ChevronDown,
  Phone,
  Clock
} from 'lucide-react';

interface AgentState {
  agent_id: number;
  user_id: number;
  username: string;
  status: 'available' | 'on_call' | 'on_break' | 'away' | 'offline';
  extension?: string;
  queue_memberships?: string[];
  current_call_id?: string;
  last_call_time?: string;
  calls_handled_today: number;
  total_talk_time_today: number;
  created_at: string;
  updated_at: string;
}

interface AgentStateResponse {
  success: boolean;
  data: AgentState;
}

const statusConfig = {
  available: {
    label: 'Available',
    icon: Circle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100',
    description: 'Ready to take calls'
  },
  on_call: {
    label: 'On Call',
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    description: 'Currently on a call'
  },
  on_break: {
    label: 'On Break',
    icon: Coffee,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    hoverColor: 'hover:bg-yellow-100',
    description: 'Taking a break'
  },
  away: {
    label: 'Away',
    icon: Moon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:bg-gray-100',
    description: 'Temporarily away'
  },
  offline: {
    label: 'Offline',
    icon: PhoneOff,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverColor: 'hover:bg-red-100',
    description: 'Not available'
  }
};

export default function AgentStatusWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuthStore();

  // Fetch agent state
  const { data: agentStateData, isLoading } = useQuery<AgentStateResponse>({
    queryKey: ['agentState', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/v1/agent-state/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agent state');
      }
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: isAuthenticated && !!accessToken, // Only fetch when authenticated
  });

  const agentState = agentStateData?.data;

  // Update agent status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: AgentState['status']) => {
      const response = await fetch('/api/v1/agent-state/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentState', 'me'] });
      setIsOpen(false);
    },
  });

  // Quick status actions
  const setAvailableMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/agent-state/me/available', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to set available');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentState', 'me'] });
      setIsOpen(false);
    },
  });

  const setBreakMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/agent-state/me/break', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to set break');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentState', 'me'] });
      setIsOpen(false);
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format talk time (seconds to HH:MM:SS)
  const formatTalkTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !agentState) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  const currentStatus = agentState.status || 'offline';
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
          config.bgColor
        } ${config.borderColor} ${config.hoverColor}`}
      >
        <StatusIcon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        <ChevronDown className={`w-4 h-4 ${config.color} transition-transform ${
          isOpen ? 'transform rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Stats Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Today's Activity
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Calls</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {agentState.calls_handled_today}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Talk Time</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatTalkTime(agentState.total_talk_time_today)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Options */}
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1 mb-1">
              Change Status
            </p>
            {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
              const statusConf = statusConfig[status];
              const StatusOptionIcon = statusConf.icon;
              const isCurrentStatus = status === currentStatus;
              const isDisabled = status === 'on_call'; // Can't manually set to on_call

              return (
                <button
                  key={status}
                  onClick={() => {
                    if (isDisabled || isCurrentStatus) return;
                    updateStatusMutation.mutate(status);
                  }}
                  disabled={isDisabled || isCurrentStatus}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isCurrentStatus
                      ? `${statusConf.bgColor} ${statusConf.borderColor} border`
                      : isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : `hover:bg-gray-50`
                  }`}
                >
                  <StatusOptionIcon className={`w-4 h-4 ${statusConf.color}`} />
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${statusConf.color}`}>
                      {statusConf.label}
                      {isCurrentStatus && ' (Current)'}
                    </p>
                    <p className="text-xs text-gray-500">{statusConf.description}</p>
                  </div>
                  {isCurrentStatus && (
                    <div className={`w-2 h-2 rounded-full ${statusConf.color.replace('text-', 'bg-')}`}></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1 mb-1">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAvailableMutation.mutate()}
                disabled={currentStatus === 'available'}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Circle className="w-4 h-4" />
                <span>Go Available</span>
              </button>
              <button
                onClick={() => setBreakMutation.mutate()}
                disabled={currentStatus === 'on_break'}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coffee className="w-4 h-4" />
                <span>Take Break</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
