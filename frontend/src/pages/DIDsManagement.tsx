import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface DID {
  id: number;
  tenant_id: string;
  number: string;
  country_code?: string;
  friendly_name?: string;
  route_type: 'queue' | 'endpoint' | 'ivr' | 'webhook' | 'external' | 'voicemail';
  route_target: string;
  sms_enabled: boolean;
  sms_webhook_url?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

interface Queue {
  id: number;
  name: string;
  display_name: string;
}

const RouteTypeLabels = {
  queue: 'Call Queue',
  endpoint: 'SIP Endpoint',
  ivr: 'IVR Menu',
  webhook: 'HTTP Webhook',
  external: 'External Number',
  voicemail: 'Voicemail'
};

const RouteTypeDescriptions = {
  queue: 'Route calls to a call queue with agents',
  endpoint: 'Route directly to a SIP extension',
  ivr: 'Route to an Interactive Voice Response menu',
  webhook: 'Send call data to an external webhook URL',
  external: 'Forward calls to an external phone number',
  voicemail: 'Route calls directly to voicemail'
};

export default function DIDsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [routeTypeFilter, setRouteTypeFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingDID, setEditingDID] = useState<DID | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Fetch DIDs
  const { data: dids = [], isLoading, refetch } = useQuery<DID[]>({
    queryKey: ['dids', searchTerm, statusFilter, routeTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (routeTypeFilter) params.append('route_type', routeTypeFilter);
      
      const response = await apiClient.get(`/api/v1/dids?${params.toString()}`);
      return response.data.data || [];
    },
  });

  // Fetch queues for route target selection
  const { data: queues = [] } = useQuery<Queue[]>({
    queryKey: ['queues'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/queues');
      return response.data.data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/dids/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dids'] });
      setDeleteConfirm(null);
    },
  });

  const filteredDIDs = dids.filter((did: DID) => {
    const matchesSearch = !searchTerm || 
      did.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      did.friendly_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleEdit = (did: DID) => {
    setEditingDID(did);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRouteTypeBadge = (routeType: string) => {
    const colors = {
      queue: 'bg-blue-100 text-blue-800',
      endpoint: 'bg-purple-100 text-purple-800',
      ivr: 'bg-indigo-100 text-indigo-800',
      webhook: 'bg-orange-100 text-orange-800',
      external: 'bg-pink-100 text-pink-800',
      voicemail: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[routeType as keyof typeof colors]}`}>
        {RouteTypeLabels[routeType as keyof typeof RouteTypeLabels]}
      </span>
    );
  };

  if (showForm) {
    return (
      <DIDForm 
        did={editingDID} 
        queues={queues}
        onClose={() => {
          setShowForm(false);
          setEditingDID(null);
        }} 
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Phone Numbers (DIDs)</h1>
                <p className="text-gray-600 mt-1">Manage your inbound phone numbers and routing</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingDID(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Phone Number
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total DIDs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{dids.length}</p>
            </div>
            <Phone className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {dids.filter((d: DID) => d.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">
                {dids.filter((d: DID) => d.status === 'inactive').length}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">SMS Enabled</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {dids.filter((d: DID) => d.sms_enabled).length}
              </p>
            </div>
            <Globe className="w-10 h-10 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          {/* Route Type Filter */}
          <div>
            <select
              value={routeTypeFilter}
              onChange={(e) => setRouteTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Route Types</option>
              <option value="queue">Call Queue</option>
              <option value="endpoint">SIP Endpoint</option>
              <option value="ivr">IVR Menu</option>
              <option value="webhook">HTTP Webhook</option>
              <option value="external">External Number</option>
              <option value="voicemail">Voicemail</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredDIDs.length} of {dids.length} phone numbers
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* DIDs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredDIDs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter || routeTypeFilter
              ? 'Try adjusting your filters'
              : 'Get started by adding your first phone number'}
          </p>
          {!searchTerm && !statusFilter && !routeTypeFilter && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Phone Number
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Friendly Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMS
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
                {filteredDIDs.map((did) => (
                  <tr key={did.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{did.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{did.friendly_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRouteTypeBadge(did.route_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{did.route_target}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {did.sms_enabled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(did.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(did)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {deleteConfirm === did.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDelete(did.id)}
                              className="text-red-600 hover:text-red-900 text-xs font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(did.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// DID Form Component
interface DIDFormProps {
  did: DID | null;
  queues: Queue[];
  onClose: () => void;
}

function DIDForm({ did, queues, onClose }: DIDFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    number: did?.number || '',
    country_code: did?.country_code || '+1',
    friendly_name: did?.friendly_name || '',
    route_type: did?.route_type || 'queue' as 'queue' | 'endpoint' | 'ivr' | 'webhook' | 'external' | 'voicemail',
    route_target: did?.route_target || '',
    sms_enabled: did?.sms_enabled || false,
    sms_webhook_url: did?.sms_webhook_url || '',
    status: did?.status || 'active' as 'active' | 'inactive' | 'pending',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (did) {
        return await apiClient.put(`/api/v1/dids/${did.id}`, data);
      } else {
        return await apiClient.post('/api/v1/dids', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dids'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {did ? 'Edit Phone Number' : 'Add New Phone Number'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="+15551234567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Use E.164 format (e.g., +15551234567)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friendly Name
                </label>
                <input
                  type="text"
                  value={formData.friendly_name}
                  onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
                  placeholder="Main Sales Line"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Optional display name for easy identification</p>
              </div>
            </div>
          </div>

          {/* Routing Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Routing Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.route_type}
                onChange={(e) => setFormData({ ...formData, route_type: e.target.value as any, route_target: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="queue">Call Queue</option>
                <option value="endpoint">SIP Endpoint</option>
                <option value="ivr">IVR Menu</option>
                <option value="webhook">HTTP Webhook</option>
                <option value="external">External Number</option>
                <option value="voicemail">Voicemail</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {RouteTypeDescriptions[formData.route_type]}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Target <span className="text-red-500">*</span>
              </label>
              {formData.route_type === 'queue' ? (
                <select
                  value={formData.route_target}
                  onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a queue...</option>
                  {queues.map((queue) => (
                    <option key={queue.id} value={queue.name}>
                      {queue.display_name} ({queue.name})
                    </option>
                  ))}
                </select>
              ) : formData.route_type === 'endpoint' ? (
                <input
                  type="text"
                  value={formData.route_target}
                  onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                  placeholder="PJSIP/100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              ) : formData.route_type === 'webhook' ? (
                <input
                  type="url"
                  value={formData.route_target}
                  onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              ) : formData.route_type === 'external' ? (
                <input
                  type="text"
                  value={formData.route_target}
                  onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                  placeholder="+15559876543"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={formData.route_target}
                  onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                  placeholder="Enter target..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              )}
            </div>
          </div>

          {/* SMS Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">SMS Configuration</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sms_enabled"
                checked={formData.sms_enabled}
                onChange={(e) => setFormData({ ...formData, sms_enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sms_enabled" className="ml-2 text-sm text-gray-700">
                Enable SMS on this number
              </label>
            </div>

            {formData.sms_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.sms_webhook_url}
                  onChange={(e) => setFormData({ ...formData, sms_webhook_url: e.target.value })}
                  placeholder="https://example.com/sms-webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Optional webhook URL to receive SMS messages</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {did ? 'Update Phone Number' : 'Add Phone Number'}
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {saveMutation.isError && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error saving phone number</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {(saveMutation.error as any)?.response?.data?.error?.message || 'Please try again'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
