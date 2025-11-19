import React, { useState, useEffect } from 'react';
import { Plus, Globe, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Website {
  id: number;
  tenant_id: string;
  name: string;
  domain: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantConfig {
  domain_mode: 'single' | 'multiple';
  max_websites: number | null;
  current_count: number;
}

const WebsiteManagement: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    is_active: true,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/websites`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWebsites(data.data);
        setTenantConfig({
          domain_mode: 'multiple',
          max_websites: 10,
          current_count: data.data.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/websites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchWebsites();
        setShowCreateModal(false);
        resetForm();
      } else {
        alert(data.error?.message || 'Failed to create website');
      }
    } catch (error) {
      console.error('Failed to create website:', error);
      alert('Failed to create website');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebsite) return;

    try {
      const response = await fetch(`${API_BASE}/websites/${editingWebsite.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchWebsites();
        setEditingWebsite(null);
        resetForm();
      } else {
        alert(data.error?.message || 'Failed to update website');
      }
    } catch (error) {
      console.error('Failed to update website:', error);
      alert('Failed to update website');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this website? This will affect associated AI profiles and widgets.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/websites/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        await fetchWebsites();
      } else {
        alert(data.error?.message || 'Failed to delete website');
      }
    } catch (error) {
      console.error('Failed to delete website:', error);
      alert('Failed to delete website');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      description: '',
      is_active: true,
    });
  };

  const openEditModal = (website: Website) => {
    setEditingWebsite(website);
    setFormData({
      name: website.name,
      domain: website.domain,
      description: website.description,
      is_active: website.is_active,
    });
  };

  const canCreateMore = () => {
    if (!tenantConfig) return false;
    if (tenantConfig.domain_mode === 'single' && tenantConfig.current_count >= 1) {
      return false;
    }
    if (tenantConfig.max_websites && tenantConfig.current_count >= tenantConfig.max_websites) {
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Website Management</h1>
            <p className="text-gray-600 mt-1">
              Manage multiple websites for your organization
            </p>
          </div>
          <button
            onClick={() => {
              if (canCreateMore()) {
                resetForm();
                setShowCreateModal(true);
              } else {
                alert('Website limit reached. Please upgrade your plan or delete existing websites.');
              }
            }}
            disabled={!canCreateMore()}
            className={`flex items-center px-4 py-2 rounded-lg ${
              canCreateMore()
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Website
          </button>
        </div>

        {tenantConfig && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Domain Mode:</strong> {tenantConfig.domain_mode}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Websites:</strong> {tenantConfig.current_count} / {tenantConfig.max_websites || '∞'}
                </p>
              </div>
              {!canCreateMore() && (
                <p className="text-sm text-red-600 font-semibold">Limit Reached</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Websites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((website) => (
          <div
            key={website.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Globe className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{website.name}</h3>
                  <p className="text-sm text-gray-500">{website.domain}</p>
                </div>
              </div>
              {website.is_active ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {website.description || 'No description'}
            </p>

            <div className="mt-4 mb-4">
              <a
                href={`/websites/${website.id}/channels`}
                className="block w-full text-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                📱 Manage Channels
              </a>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => openEditModal(website)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(website.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {websites.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No websites yet</h3>
          <p className="text-gray-500 mb-4">Create your first website to get started</p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Website
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingWebsite) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingWebsite ? 'Edit Website' : 'Create New Website'}
            </h2>
            <form onSubmit={editingWebsite ? handleUpdate : handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="E.g., E-commerce Store"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="shop.example.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of this website"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingWebsite(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {editingWebsite ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteManagement;
