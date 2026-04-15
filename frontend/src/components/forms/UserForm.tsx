import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/api';
import config from '../../config';
import { useAuthStore } from '../../store/authStore';
import { Zap, Loader2 } from 'lucide-react';
import type { User, UserRole, Tenant } from '../../types';

function getApiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data;
  return (
    data?.error?.details ||
    data?.error?.message ||
    data?.message ||
    fallback
  );
}

interface UserFormProps {
  user?: User;
  onClose: () => void;
  onSave: (user: Partial<User> & { password?: string; role: UserRole; tenant_id: string }) => Promise<void>;
}

export default function UserForm({ user, onClose, onSave }: UserFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserRole = currentUser?.role || currentUser?.roles?.[0]?.role;
  const currentUserTenantId = currentUser?.tenant_id || currentUser?.roles?.[0]?.tenant_id || '';
  const isSuperAdmin = currentUserRole === 'superadmin';

  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    role: (user?.role || user?.roles?.[0]?.role || 'agent') as UserRole,
    tenant_id: user?.tenant_id || user?.roles?.[0]?.tenant_id || currentUserTenantId,
    extension: user?.roles?.[0]?.endpoint_id || '',
    status: user?.status || 'active',
    password: '',
    confirm_password: '',
  });

  const [extensionMode, setExtensionMode] = useState<'auto' | 'manual'>('manual');
  const [autoExtension, setAutoExtension] = useState('');
  const [isLoadingExtension, setIsLoadingExtension] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customExtension, setCustomExtension] = useState('');

  // Auto-set tenant for non-superadmin users
  useEffect(() => {
    if (!isSuperAdmin && !formData.tenant_id && currentUserTenantId) {
      setFormData(prev => ({ ...prev, tenant_id: currentUserTenantId }));
    }
  }, [isSuperAdmin, currentUserTenantId, formData.tenant_id]);

  useEffect(() => {
    setAutoExtension('');
    setShowCustomInput(false);
    setCustomExtension('');
    setFormData(prev => ({ ...prev, extension: user?.roles?.[0]?.endpoint_id || '' }));
  }, [formData.tenant_id, user?.roles]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch tenants for selection
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await apiClient.get(config.api.tenants.list);
      return response.data.data || [];
    },
  });

  // Fetch selected tenant details (including extension range)
  const { data: _selectedTenant } = useQuery({
    queryKey: ['tenant', formData.tenant_id],
    queryFn: async () => {
      if (!formData.tenant_id) return null;
      const response = await apiClient.get(`/api/v1/tenants/${formData.tenant_id}`);
      return response.data.data;
    },
    enabled: !!formData.tenant_id,
  });

  // Fetch AVAILABLE (unassigned) extensions for the selected tenant
  const { data: availableExtensions = [] } = useQuery<string[]>({
    queryKey: ['available-extensions', formData.tenant_id],
    queryFn: async () => {
      if (!formData.tenant_id) return [];
      const res = await apiClient.get('/api/v1/users/available-extensions', {
        params: { tenant_id: formData.tenant_id },
      });
      return res.data.data?.extensions || [];
    },
    enabled: !!formData.tenant_id,
  });

  // Function to get next available extension
  const getNextAvailableExtension = async () => {
    if (!formData.tenant_id) {
      setError('Please select a tenant first');
      return;
    }

    setIsLoadingExtension(true);
    setError('');
    try {
      const response = await apiClient.get('/api/v1/users/available-extension', {
        params: { tenant_id: formData.tenant_id },
      });
      const extension = response.data.data.extension;
      setAutoExtension(extension);
      setFormData(prev => ({ ...prev, extension }));
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to get available extension - may be no unassigned extensions in range'));
      setAutoExtension('');
    } finally {
      setIsLoadingExtension(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const userData: any = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: formData.role,
        tenant_id: formData.tenant_id,
        extension: formData.extension || null,
        status: formData.status,
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      await onSave(userData);
      onClose();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to save user'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="input"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="input"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Role & Tenant */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role & Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="input"
                >
                  <option value="agent">Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  {isSuperAdmin && <option value="tenant_admin">Tenant Admin</option>}
                  {isSuperAdmin && <option value="superadmin">Superadmin</option>}
                  <option value="viewer">Viewer</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === 'superadmin' && 'Full system access across all tenants'}
                  {formData.role === 'tenant_admin' && 'Full access within assigned tenant'}
                  {formData.role === 'manager' && 'Team management and reports'}
                  {formData.role === 'supervisor' && 'Monitor agents and queues'}
                  {formData.role === 'agent' && 'Handle calls, tickets, and chats'}
                  {formData.role === 'viewer' && 'Read-only access to reports'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant *
                </label>
                {isSuperAdmin ? (
                  <select
                    required
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={tenants.find(t => t.id === formData.tenant_id)?.name || formData.tenant_id}
                    disabled
                    className="input bg-gray-100 cursor-not-allowed"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {isSuperAdmin ? 'Select the tenant for this user' : 'Tenant is auto-assigned based on your access'}
                </p>
              </div>

              {/* Extension Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extension (Optional)
                </label>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExtensionMode('auto');
                      if (!autoExtension && formData.tenant_id) {
                        getNextAvailableExtension();
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      extensionMode === 'auto'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                    }`}
                    disabled={!formData.tenant_id || isLoadingExtension}
                  >
                    <Zap className="w-4 h-4" />
                    Auto-Find
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtensionMode('manual')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      extensionMode === 'manual'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Manual Entry
                  </button>
                </div>

                {/* Auto-Find Mode */}
                {extensionMode === 'auto' && (
                  <div className="space-y-3">
                    {autoExtension ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-md p-4">
                        <p className="text-sm text-gray-600 mb-2">Available Extension:</p>
                        <p className="text-2xl font-bold text-green-700 mb-3">{autoExtension}</p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={getNextAvailableExtension}
                            disabled={isLoadingExtension}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isLoadingExtension ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Finding...
                              </>
                            ) : (
                              'Find different'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAutoExtension('');
                              setFormData(prev => ({ ...prev, extension: '' }));
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            No extension
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={getNextAvailableExtension}
                          disabled={isLoadingExtension || !formData.tenant_id}
                          className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-md text-sm font-medium text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoadingExtension ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Finding next available...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Find Next Available
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoExtension('');
                            setFormData(prev => ({ ...prev, extension: '' }));
                          }}
                          className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
                        >
                          No Extension
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Entry Mode */}
                {extensionMode === 'manual' && (
                  <div className="space-y-2">
                    {!showCustomInput ? (
                      <>
                        <select
                          value={formData.extension}
                          onChange={(e) => {
                            setFormData({ ...formData, extension: e.target.value });
                            setCustomExtension('');
                          }}
                          className="input w-full"
                          disabled={!formData.tenant_id}
                        >
                          <option value="">No Extension</option>
                          {availableExtensions.map((extId) => (
                            <option key={extId} value={extId}>
                              {extId}
                            </option>
                          ))}
                        </select>
                        {formData.tenant_id && availableExtensions.length === 0 && (
                          <p className="text-xs text-orange-600">No available extensions in tenant range</p>
                        )}
                        {formData.tenant_id && availableExtensions.length > 0 && (
                          <p className="text-xs text-gray-500">{availableExtensions.length} unassigned extension{availableExtensions.length !== 1 ? 's' : ''} available</p>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Or enter custom number...
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="e.g., 100"
                          value={customExtension}
                          onChange={(e) => {
                            setCustomExtension(e.target.value);
                            setFormData({ ...formData, extension: e.target.value });
                          }}
                          className="input w-full border-2 border-blue-300"
                          disabled={!formData.tenant_id}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomExtension('');
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Back to dropdown
                        </button>
                      </>
                    )}
                    {!formData.tenant_id && (
                      <p className="text-xs text-orange-600">Select a tenant first</p>
                    )}
                  </div>
                )}

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {user ? 'Change Password (Optional)' : 'Set Password'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {!user && '*'}
                </label>
                <input
                  type="password"
                  required={!user}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="Min 8 characters"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password {!user && '*'}
                </label>
                <input
                  type="password"
                  required={!user && !!formData.password}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="input"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Saving...' : user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
