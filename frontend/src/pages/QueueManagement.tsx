import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Settings, Phone, Clock, TrendingUp } from 'lucide-react';
import apiClient from '../lib/api';

interface Queue {
  id: number;
  name: string;
  display_name: string;
  description: string;
  strategy: string;
  timeout: number;
  retry: number;
  max_wait_time: number;
  max_len: number;
  announce_frequency: number;
  announce_position: string;
  announce_hold_time: boolean;
  music_on_hold: string;
  status: string;
  member_count?: number;
  metadata?: Record<string, unknown>;
}

interface QueuesResponse {
  success: boolean;
  data: Queue[];
  message: string;
}

const QUEUE_STRATEGIES = [
  { value: 'ringall', label: 'Ring All', description: 'Ring all available agents simultaneously' },
  { value: 'leastrecent', label: 'Least Recent', description: 'Ring agent who least recently answered' },
  { value: 'fewestcalls', label: 'Fewest Calls', description: 'Ring agent with fewest completed calls' },
  { value: 'random', label: 'Random', description: 'Ring random agent' },
  { value: 'rrmemory', label: 'Round Robin', description: 'Ring agents in sequence, remembering position' },
  { value: 'linear', label: 'Linear', description: 'Ring agents in order listed' },
  { value: 'wrandom', label: 'Weighted Random', description: 'Random based on penalty values' },
];

export default function QueueManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    strategy: 'ringall',
    timeout: 30,
    retry: 5,
    max_wait_time: 300,
    max_len: 0,
    announce_frequency: 0,
    announce_position: 'no',
    announce_hold_time: false,
    music_on_hold: 'default',
    status: 'active',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<QueuesResponse>({
    queryKey: ['queues'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/queues');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/api/v1/queues', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      setShowAddModal(false);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        strategy: 'ringall',
        timeout: 30,
        retry: 5,
        max_wait_time: 300,
        max_len: 0,
        announce_frequency: 0,
        announce_position: 'no',
        announce_hold_time: false,
        music_on_hold: 'default',
        status: 'active',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/api/v1/queues/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete queue "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const queues = data?.data || [];
  const totalMembers = queues.reduce((sum, queue) => sum + (queue.member_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Queues</h1>
          <p className="text-gray-600 mt-1">Manage call queue configuration and routing</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Queue
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Queues</p>
              <p className="text-2xl font-bold text-gray-900">{queues.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Phone className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Queues</p>
              <p className="text-2xl font-bold text-gray-900">
                {queues.filter(q => q.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">0s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queues List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Queue Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Length
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queues.map((queue) => (
                <tr key={queue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{queue.display_name || queue.name}</div>
                        <div className="text-sm text-gray-500">{queue.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {QUEUE_STRATEGIES.find(s => s.value === queue.strategy)?.label || queue.strategy}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {queue.timeout}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {queue.max_len === 0 ? 'Unlimited' : queue.max_len}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {queue.member_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${queue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {queue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {/* TODO: Edit */}}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(queue.id, queue.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {queues.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No queues configured</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first call queue.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Queue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Call Queue</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Queue Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="support-queue"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Internal queue identifier</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="input"
                      placeholder="Support Queue"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Queue description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ring Strategy *
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                    className="input"
                  >
                    {QUEUE_STRATEGIES.map((strategy) => (
                      <option key={strategy.value} value={strategy.value}>
                        {strategy.label} - {strategy.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, timeout: Number.isNaN(value) ? 0 : value });
                      }}
                      className="input"
                      min="5"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retry (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.retry}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, retry: Number.isNaN(value) ? 0 : value });
                      }}
                      className="input"
                      min="0"
                      max="60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Wait (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.max_wait_time}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, max_wait_time: Number.isNaN(value) ? 0 : value });
                      }}
                      className="input"
                      min="0"
                      max="3600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Queue Length
                    </label>
                    <input
                      type="number"
                      value={formData.max_len}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, max_len: Number.isNaN(value) ? 0 : value });
                      }}
                      className="input"
                      min="0"
                      max="500"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 keeps the queue open (no limit)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Announce Frequency (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.announce_frequency}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setFormData({ ...formData, announce_frequency: Number.isNaN(value) ? 0 : value });
                      }}
                      className="input"
                      min="0"
                      max="300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Announce Position
                    </label>
                    <select
                      value={formData.announce_position}
                      onChange={(e) => setFormData({ ...formData, announce_position: e.target.value })}
                      className="input"
                    >
                      <option value="no">Disabled</option>
                      <option value="yes">Announce every cycle</option>
                      <option value="once">Announce once</option>
                      <option value="periodic">Announce periodically</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Music On Hold
                    </label>
                    <input
                      type="text"
                      value={formData.music_on_hold}
                      onChange={(e) => setFormData({ ...formData, music_on_hold: e.target.value })}
                      className="input"
                      placeholder="default"
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <input
                      id="announce-hold-time"
                      type="checkbox"
                      checked={formData.announce_hold_time}
                      onChange={(e) => setFormData({ ...formData, announce_hold_time: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="announce-hold-time" className="text-sm font-medium text-gray-700">
                      Announce Estimated Hold Time
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {createMutation.error && (
                  <div className="text-sm text-red-600">
                    Failed to create queue. Please try again.
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 btn btn-primary"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Queue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
