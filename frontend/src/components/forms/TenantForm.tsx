import { useState } from 'react';
import type { Tenant } from '../../types';

interface TenantFormProps {
  tenant?: Tenant;
  onClose: () => void;
  onSave: (tenant: Partial<Tenant>) => Promise<void>;
}

export default function TenantForm({ tenant, onClose, onSave }: TenantFormProps) {
  const [formData, setFormData] = useState<Partial<Tenant>>({
    id: tenant?.id || '',
    name: tenant?.name || '',
    domain: tenant?.domain || '',
    status: tenant?.status || 'trial',
    max_agents: tenant?.max_agents || 10,
    max_dids: tenant?.max_dids || 5,
    max_concurrent_calls: tenant?.max_concurrent_calls || 10,
    features: tenant?.features || {
      webrtc: true,
      recording: true,
      queue: true,
      ivr: false,
      sms: false,
      chat: true,
      helpdesk: true,
      analytics: true,
      api: false,
    },
    billing_email: tenant?.billing_email || '',
    contact_name: tenant?.contact_name || '',
    contact_phone: tenant?.contact_phone || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features?.[feature as keyof typeof prev.features],
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {tenant ? 'Edit Tenant' : 'Create New Tenant'}
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
                  Tenant ID *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!tenant}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="input"
                  placeholder="e.g., acme-corp"
                />
                {!tenant && (
                  <p className="mt-1 text-xs text-gray-500">
                    Lowercase, alphanumeric with hyphens
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="input"
                  placeholder="e.g., acme.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="input"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resource Limits */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Agents
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_agents}
                  onChange={(e) => setFormData({ ...formData, max_agents: parseInt(e.target.value) })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max DIDs
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_dids}
                  onChange={(e) => setFormData({ ...formData, max_dids: parseInt(e.target.value) })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Calls
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_concurrent_calls}
                  onChange={(e) => setFormData({ ...formData, max_concurrent_calls: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'webrtc', label: 'WebRTC' },
                { key: 'sms', label: 'SMS' },
                { key: 'recording', label: 'Call Recording' },
                { key: 'queue', label: 'Queue Management' },
                { key: 'ivr', label: 'IVR' },
                { key: 'chat', label: 'Live Chat' },
                { key: 'helpdesk', label: 'Helpdesk' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'api', label: 'API Access' },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.features?.[feature.key as keyof typeof formData.features]}
                    onChange={() => handleFeatureToggle(feature.key)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                  className="input"
                  placeholder="billing@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input"
                  placeholder="+1234567890"
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
              {isSubmitting ? 'Saving...' : tenant ? 'Save Changes' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
