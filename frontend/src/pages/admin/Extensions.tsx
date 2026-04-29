import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import { 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneCall
} from 'lucide-react';

interface Extension {
  id: string;
  display_name?: string;
  context?: string;
  codecs?: string;
  max_contacts?: number;
  status?: string;
  assigned_user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  } | null;
}

interface ExtensionFormData {
  extension_number: string;
  password: string;
  display_name?: string;
  context?: string;
  max_contacts?: number;
  codecs?: string;
  // Call center features
  voicemail_enabled?: boolean;
  call_recording?: boolean;
  call_waiting?: boolean;
  dnd_enabled?: boolean;
  forward_busy?: string;
  forward_no_answer?: string;
  forward_always?: string;
  no_answer_timeout?: number;
}

export default function Extensions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | undefined>(undefined);
  const [resetPasswordExtension, setResetPasswordExtension] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<ExtensionFormData>({
    extension_number: '',
    password: '',
    display_name: '',
    context: 'internal',
    max_contacts: 1,
    codecs: 'ulaw,alaw,g722',
    voicemail_enabled: true,
    call_recording: false,
    call_waiting: true,
    dnd_enabled: false,
    forward_busy: '',
    forward_no_answer: '',
    forward_always: '',
    no_answer_timeout: 20
  });
  const [newPassword, setNewPassword] = useState('');

  // Fetch tenant information (including extension range)
  const { data: tenant } = useQuery({
    queryKey: ['tenant', 'demo-tenant'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/tenants/demo-tenant');
      return response.data.data;
    },
  });

  // Fetch all extensions
  const { data: extensions = [], isLoading } = useQuery<Extension[]>({
    queryKey: ['extensions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/extensions');
      return response.data.data || [];
    },
  });

  // Create extension mutation
  const createMutation = useMutation({
    mutationFn: async (data: ExtensionFormData) => {
      return await apiClient.post('/api/v1/extensions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      setShowModal(false);
      resetForm();
    },
  });

  // Update extension mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExtensionFormData> }) => {
      return await apiClient.put(`/api/v1/extensions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
      setShowModal(false);
      setEditingExtension(undefined);
      resetForm();
    },
  });

  // Delete extension mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/extensions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return await apiClient.post(`/api/v1/extensions/${id}/reset-password`, { password });
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setResetPasswordExtension(undefined);
      setNewPassword('');
    },
  });

  const resetForm = () => {
    setFormData({
      extension_number: '',
      password: '',
      display_name: '',
      context: 'internal',
      max_contacts: 1,
      codecs: 'ulaw,alaw,g722'
    });
  };

  const handleCreate = () => {
    setEditingExtension(undefined);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (extension: Extension) => {
    setEditingExtension(extension);
    setFormData({
      extension_number: extension.id,
      password: '',
      display_name: extension.display_name,
      context: extension.context,
      max_contacts: extension.max_contacts,
      codecs: extension.codecs
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validate required fields for new extensions
    if (!editingExtension) {
      if (!formData.extension_number || !formData.password) {
        alert('Extension number and password are required');
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
    }

    // Validate password length if provided during update
    if (editingExtension && formData.password && formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (editingExtension) {
      // Update - don't send extension_number
      const updateData: Partial<ExtensionFormData> = {
        display_name: formData.display_name,
        context: formData.context,
        max_contacts: formData.max_contacts,
        codecs: formData.codecs
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await updateMutation.mutateAsync({ id: editingExtension.id, data: updateData });
    } else {
      // Create - need all fields
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this extension? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleResetPassword = (id: string) => {
    setResetPasswordExtension(id);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordReset = async () => {
    if (resetPasswordExtension && newPassword) {
      await resetPasswordMutation.mutateAsync({
        id: resetPasswordExtension,
        password: newPassword
      });
    }
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ext.display_name && ext.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Phone className="w-8 h-8 text-blue-600" />
          SIP Extensions
        </h1>
        <p className="text-gray-600 mt-1">
          Manage SIP phone extensions and registrations
          {tenant && (
            <span className="ml-2 text-sm font-medium text-blue-600">
              • Range: {tenant.extension_range_start}-{tenant.extension_range_end}
            </span>
          )}
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Extension
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Extensions</p>
              <p className="text-2xl font-bold text-gray-900">{extensions.length}</p>
            </div>
            <Phone className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {extensions.filter(e => e.status === 'online').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-600">
                {extensions.filter(e => e.status === 'offline').length}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-gray-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-purple-600">
                {tenant ? (tenant.extension_range_end - tenant.extension_range_start + 1 - extensions.length) : 0}
              </p>
              {tenant && (
                <p className="text-xs text-gray-500 mt-1">
                  of {tenant.extension_range_end - tenant.extension_range_start + 1}
                </p>
              )}
            </div>
            <PhoneCall className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Extensions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extension
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Context
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codecs
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
            {filteredExtensions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No extensions found matching your search' : 'No extensions yet. Create your first extension to get started.'}
                </td>
              </tr>
            ) : (
              filteredExtensions.map((extension) => (
                <tr key={extension.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{extension.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{extension.display_name || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {extension.assigned_user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{extension.assigned_user.name || '-'}</div>
                        <div className="text-xs text-gray-500">{extension.assigned_user.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {extension.context || 'internal'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    <span className="text-xs">{extension.codecs || 'ulaw,alaw'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(extension.status || 'offline')}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(extension.status || 'offline')}`}>
                        {extension.status || 'offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(extension.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Reset Password"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(extension)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(extension.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingExtension ? 'Edit Extension' : 'Create Extension'}
            </h2>

            <div className="space-y-4">
              {/* Tenant Extension Range Info */}
              {tenant && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">
                      Your tenant can use extensions {tenant.extension_range_start} to {tenant.extension_range_end}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extension Number *
                </label>
                <input
                  type="number"
                  value={formData.extension_number}
                  onChange={(e) => setFormData({ ...formData, extension_number: e.target.value })}
                  disabled={!!editingExtension}
                  min={tenant?.extension_range_start || 1000}
                  max={tenant?.extension_range_end || 1999}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder={tenant ? `${tenant.extension_range_start}-${tenant.extension_range_end}` : "1001"}
                />
                {tenant && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a number between {tenant.extension_range_start} and {tenant.extension_range_end}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingExtension ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context
                </label>
                <input
                  type="text"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="internal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Contacts
                </label>
                <input
                  type="number"
                  value={formData.max_contacts}
                  onChange={(e) => setFormData({ ...formData, max_contacts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codecs
                </label>
                <input
                  type="text"
                  value={formData.codecs}
                  onChange={(e) => setFormData({ ...formData, codecs: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ulaw,alaw,g722"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingExtension(undefined);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {editingExtension ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key className="w-6 h-6 text-yellow-600" />
              Reset Password
            </h2>

            <p className="text-gray-600 mb-4">
              Enter a new password for extension <strong>{resetPasswordExtension}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setResetPasswordExtension(undefined);
                  setNewPassword('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={resetPasswordMutation.isPending || !newPassword || newPassword.length < 6}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {resetPasswordMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
