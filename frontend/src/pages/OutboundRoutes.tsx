import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Save, X, Phone, Settings } from 'lucide-react';
import apiClient from '../lib/api';

interface OutboundRoute {
  id: number;
  tenant_id: string;
  name: string;
  description?: string;
  pattern: string;
  trunk_id: string;
  trunk_name?: string;
  priority: number;
  enabled: boolean;
  prepend?: string;
  strip: number;
  caller_id_name?: string;
  caller_id_number?: string;
  created_at: string;
  updated_at: string;
}

interface Trunk {
  id: string;
  name: string;
}

interface RouteFormData {
  name: string;
  description: string;
  pattern: string;
  trunk_id: string;
  priority: number;
  enabled: boolean;
  prepend: string;
  strip: number;
  caller_id_name: string;
  caller_id_number: string;
}

export default function OutboundRoutes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<OutboundRoute | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    description: '',
    pattern: '',
    trunk_id: '',
    priority: 100,
    enabled: true,
    prepend: '',
    strip: 0,
    caller_id_name: '',
    caller_id_number: '',
  });

  // Fetch outbound routes
  const { data: routesData, isLoading } = useQuery({
    queryKey: ['outbound-routes'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/outbound-routes');
      return response.data;
    },
  });

  // Fetch trunks
  const { data: trunksData } = useQuery({
    queryKey: ['trunks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trunks');
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RouteFormData) => {
      const response = await apiClient.post('/api/v1/outbound-routes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-routes'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RouteFormData> }) => {
      const response = await apiClient.put(`/api/v1/outbound-routes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-routes'] });
      setIsEditModalOpen(false);
      setSelectedRoute(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/api/v1/outbound-routes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbound-routes'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pattern: '',
      trunk_id: '',
      priority: 100,
      enabled: true,
      prepend: '',
      strip: 0,
      caller_id_name: '',
      caller_id_number: '',
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (route: OutboundRoute) => {
    setSelectedRoute(route);
    setFormData({
      name: route.name,
      description: route.description || '',
      pattern: route.pattern,
      trunk_id: route.trunk_id,
      priority: route.priority,
      enabled: route.enabled,
      prepend: route.prepend || '',
      strip: route.strip,
      caller_id_name: route.caller_id_name || '',
      caller_id_number: route.caller_id_number || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (selectedRoute) {
      updateMutation.mutate({ id: selectedRoute.id, data: formData });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete route "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const routes = routesData?.data || [];
  const trunks = trunksData?.data || [];

  const RouteModal = ({ isOpen, onClose, onSave, title }: any) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="US/Canada"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="North America (NANP)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dial Pattern (Regex) *
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="^1[2-9][0-9]{9}$"
              />
              <p className="text-xs text-gray-500 mt-1">
                Regex pattern to match dialed numbers (e.g., ^1[2-9][0-9]{'{'}9{'}'} for US/Canada)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SIP Trunk *
              </label>
              <select
                value={formData.trunk_id}
                onChange={(e) => setFormData({ ...formData, trunk_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select trunk...</option>
                {trunks.map((trunk: Trunk) => (
                  <option key={trunk.id} value={trunk.id}>
                    {trunk.name || trunk.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="999"
                />
                <p className="text-xs text-gray-500 mt-1">Lower = higher priority</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strip Digits
                </label>
                <input
                  type="number"
                  value={formData.strip}
                  onChange={(e) => setFormData({ ...formData, strip: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="20"
                />
                <p className="text-xs text-gray-500 mt-1">Leading digits to remove</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prepend Digits
              </label>
              <input
                type="text"
                value={formData.prepend}
                onChange={(e) => setFormData({ ...formData, prepend: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">Digits to add before dialed number</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caller ID Name
                </label>
                <input
                  type="text"
                  value={formData.caller_id_name}
                  onChange={(e) => setFormData({ ...formData, caller_id_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Call Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caller ID Number
                </label>
                <input
                  type="text"
                  value={formData.caller_id_number}
                  onChange={(e) => setFormData({ ...formData, caller_id_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+15551234567"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Enable this route
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Route
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-6 h-6" />
            Outbound Routes
          </h1>
          <p className="text-gray-600 mt-1">
            Configure dial patterns and routing rules for outbound calls
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Route
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading routes...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pattern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trunk
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
              {routes.map((route: OutboundRoute) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {route.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{route.name}</div>
                    {route.description && (
                      <div className="text-sm text-gray-500">{route.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {route.pattern}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {route.trunk_name || route.trunk_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        route.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {route.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(route)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id, route.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No outbound routes configured</p>
                    <p className="text-sm mt-1">Create your first route to start routing outbound calls</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <RouteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        title="Create Outbound Route"
      />

      <RouteModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRoute(null);
          resetForm();
        }}
        onSave={handleUpdate}
        title="Edit Outbound Route"
      />
    </div>
  );
}
