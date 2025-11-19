import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Plus, Edit2, Trash2, PhoneIncoming, Route, Settings } from 'lucide-react';
import apiClient from '../lib/api';

interface DID {
  id: number;
  number: string;
  friendly_name?: string | null;
  country_code?: string | null;
  route_type: 'queue' | 'endpoint' | 'ivr' | 'webhook' | 'external' | 'voicemail' | '';
  route_target?: string | null;
  status: string;
}

interface Queue {
  id: number;
  name: string;
  display_name?: string;
}

interface Extension {
  id: string;
  display_name: string;
}

interface IVRMenu {
  id: number;
  name: string;
  display_name?: string | null;
}

interface DIDFormState {
  number: string;
  friendly_name: string;
  country_code: string;
  route_type: DID['route_type'];
  route_target: string;
  status: string;
}

export default function CallRouting() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDID, setEditingDID] = useState<DID | null>(null);
  const [formData, setFormData] = useState<DIDFormState>({
    number: '',
    friendly_name: '',
    country_code: '+1',
    route_type: 'queue' as DID['route_type'],
    route_target: '',
    status: 'active',
  });

  const queryClient = useQueryClient();

  const { data: didsData, isLoading } = useQuery({
    queryKey: ['dids'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/dids');
      return response.data;
    },
  });

  const { data: queuesData } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/queues');
      return response.data;
    },
  });

  const { data: extensionsData } = useQuery({
    queryKey: ['extensions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/extensions');
      return response.data;
    },
  });

  const { data: ivrMenusData } = useQuery({
    queryKey: ['ivr-menus'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/ivr-menus');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await apiClient.post('/api/v1/dids', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dids'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const response = await apiClient.put(`/api/v1/dids/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dids'] });
      setEditingDID(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/api/v1/dids/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dids'] });
    },
  });

  const resetForm = () => {
    setFormData({
      number: '',
      friendly_name: '',
      country_code: '+1',
      route_type: 'queue',
      route_target: '',
      status: 'active',
    });
  };

  const handleEdit = (did: DID) => {
    setEditingDID(did);
    setFormData({
      number: did.number,
      friendly_name: did.friendly_name || '',
      country_code: did.country_code || '+1',
      route_type: (did.route_type || 'queue') as DID['route_type'],
      route_target: did.route_target || '',
      status: did.status,
    });
  };

  const buildPayload = (form: DIDFormState) => {
    const payload: Record<string, unknown> = {
      number: form.number.trim(),
      route_type: form.route_type,
      status: form.status,
    };

    const friendlyName = form.friendly_name.trim();
    if (friendlyName) {
      payload.friendly_name = friendlyName;
    }

    const countryCode = form.country_code.trim();
    if (countryCode) {
      payload.country_code = countryCode;
    }

    const target = form.route_target.trim();
    if (target) {
      payload.route_target = target;
    }

    return payload;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiresTarget = ['queue', 'endpoint', 'ivr', 'webhook', 'external', 'voicemail'].includes(formData.route_type);
    if (requiresTarget && !formData.route_target.trim()) {
      alert('Please select a destination for this route.');
      return;
    }

    const payload = buildPayload(formData);

    if (editingDID) {
      const updatePayload = { ...payload };
      delete updatePayload.number;
      updateMutation.mutate({ id: editingDID.id, data: updatePayload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, number: string) => {
    if (confirm(`Are you sure you want to delete DID ${number}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const dids = didsData?.data || [];
  const queues = queuesData?.data || [];
  const extensions = extensionsData?.data || [];
  const ivrMenus = ivrMenusData?.data || [];

  const getRouteDisplay = (did: DID) => {
    const target = did.route_target || '';
    switch (did.route_type) {
      case 'queue':
        {
          const queue = queues.find((q: Queue) => q.name === target);
          const label = queue?.display_name || queue?.name || target;
          return label ? `Queue: ${label}` : 'Queue: Not configured';
        }
      case 'endpoint':
        {
          const extension = extensions.find((ext: Extension) => ext.id === target);
          const label = extension?.display_name || target;
          return label ? `Extension: ${label}` : 'Extension: Not configured';
        }
      case 'ivr':
        {
          const menu = ivrMenus.find((ivr: IVRMenu) => ivr.name === target);
          const label = menu?.display_name || menu?.name || target;
          return label ? `IVR: ${label}` : 'IVR: Not configured';
        }
      case 'webhook':
        return target ? `Webhook: ${target}` : 'Webhook: Not configured';
      case 'external':
        return target ? `External: ${target}` : 'External: Not configured';
      case 'voicemail':
        return target ? `Voicemail: ${target}` : 'Voicemail: Not configured';
      default:
        return 'Not configured';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Routing</h1>
          <p className="text-gray-600 mt-1">Configure inbound DID routing to queues, extensions, and IVR menus</p>
        </div>
        <button
          onClick={() => {
            setEditingDID(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add DID Route
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Phone className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total DIDs</p>
              <p className="text-2xl font-bold text-gray-900">{dids.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <PhoneIncoming className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {dids.filter((d: DID) => d.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Route className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Queue Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {dids.filter((d: DID) => d.route_type === 'queue').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Direct Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {dids.filter((d: DID) => d.route_type === 'endpoint').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Routing Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  DID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Route Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dids.map((did: DID) => (
                <tr key={did.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{did.number}</div>
                        <div className="text-sm text-gray-500">{did.friendly_name || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${did.route_type === 'queue' ? 'bg-blue-100 text-blue-800' : ''}
                      ${did.route_type === 'endpoint' ? 'bg-green-100 text-green-800' : ''}
                      ${did.route_type === 'ivr' ? 'bg-purple-100 text-purple-800' : ''}
                      ${did.route_type === 'webhook' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                      {did.route_type || 'unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getRouteDisplay(did)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${did.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {did.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(did)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(did.id, did.number)}
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

        {dids.length === 0 && (
          <div className="text-center py-12">
            <Phone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No routing configured</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first DID routing rule.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingDID) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingDID ? 'Edit DID Route' : 'Add DID Route'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DID Number *
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="input"
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Friendly Name
                    </label>
                    <input
                      type="text"
                      value={formData.friendly_name}
                      onChange={(e) => setFormData({ ...formData, friendly_name: e.target.value })}
                      className="input"
                      placeholder="Main Line"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route Type *
                  </label>
                  <select
                    value={formData.route_type}
                    onChange={(e) => {
                      const newType = e.target.value as DID['route_type'];
                      setFormData((prev) => ({
                        ...prev,
                        route_type: newType,
                        route_target: '',
                      }));
                    }}
                    className="input"
                  >
                    <option value="queue">Queue - Route to call queue</option>
                    <option value="endpoint">Extension - Route to specific extension</option>
                    <option value="ivr">IVR - Interactive voice menu</option>
                    <option value="webhook">Webhook - External HTTP callback</option>
                    <option value="external">External - Forward to external number</option>
                    <option value="voicemail">Voicemail - Direct to voicemail</option>
                  </select>
                </div>

                {formData.route_type === 'queue' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Queue *
                    </label>
                    <select
                      value={formData.route_target}
                      onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select a queue...</option>
                      {queues.map((q: Queue) => (
                        <option key={q.id} value={q.name}>
                          {q.display_name || q.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.route_type === 'endpoint' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Extension *
                    </label>
                    <select
                      value={formData.route_target}
                      onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="">Select an extension...</option>
                      {extensions.map((e: Extension) => (
                        <option key={e.id} value={e.id}>
                          {e.display_name || e.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.route_type === 'ivr' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select IVR Menu *
                    </label>
                    <select
                      value={formData.route_target}
                      onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                      className="input"
                      required
                      disabled={ivrMenus.length === 0}
                    >
                      <option value="">Select an IVR menu...</option>
                      {ivrMenus.map((menu: IVRMenu) => (
                        <option key={menu.id} value={menu.name}>
                          {menu.display_name || menu.name}
                        </option>
                      ))}
                    </select>
                    {ivrMenus.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No IVR menus available yet. Create one in the IVR Builder first.
                      </p>
                    )}
                  </div>
                )}

                {['webhook', 'external', 'voicemail'].includes(formData.route_type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.route_type === 'webhook' && 'Webhook URL *'}
                      {formData.route_type === 'external' && 'External Number *'}
                      {formData.route_type === 'voicemail' && 'Voicemail Box *'}
                    </label>
                    <input
                      type="text"
                      value={formData.route_target}
                      onChange={(e) => setFormData({ ...formData, route_target: e.target.value })}
                      className="input"
                      placeholder={
                        formData.route_type === 'webhook'
                          ? 'https://example.com/webhook'
                          : formData.route_type === 'external'
                          ? '+1234567890'
                          : 'voicemail-box'
                      }
                      required
                    />
                  </div>
                )}

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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDID(null);
                      resetForm();
                    }}
                    className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 btn btn-primary"
                  >
                    {editingDID ? 'Update Route' : 'Create Route'}
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
