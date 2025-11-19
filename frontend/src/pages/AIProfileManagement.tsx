import React, { useState, useEffect } from 'react';
import { Plus, Bot, Edit2, Trash2, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AIProfile {
  id: number;
  tenant_id: string;
  profile_name: string;
  description: string;
  website_id: number | null;
  is_default: boolean;
  kb_tags: string;
  is_enabled: boolean;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  rag_enabled: boolean;
}

interface Website {
  id: number;
  name: string;
  domain: string;
}

const AIProfileManagement: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AIProfile | null>(null);
  const [formData, setFormData] = useState({
    profile_name: '',
    description: '',
    website_id: null as number | null,
    model: 'gemini-2.0-flash',
    system_prompt: 'You are a helpful customer service AI assistant. Be friendly, professional, and concise.',
    temperature: 0.7,
    max_tokens: 500,
    rag_enabled: true,
    kb_tags: [] as string[],
    is_default: false,
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

  const availableTags = [
    'ecommerce', 'products', 'shipping', 'returns', 'orders',
    'technical', 'support', 'troubleshooting', 'docs',
    'marketing', 'sales', 'features', 'pricing',
    'blog', 'content', 'articles', 'news',
    'general', 'faq', 'contact', 'billing', 'payment'
  ];

  useEffect(() => {
    fetchProfiles();
    fetchWebsites();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/ai-agent-profiles`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data);
      }
    } catch (_error) {
      console.error('Failed to fetch AI profiles:', _error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebsites = async () => {
    try {
      const response = await fetch(`${API_BASE}/websites`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWebsites(data.data);
      }
    } catch (_error) {
      console.error('Failed to fetch websites:', _error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/ai-agent-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          website_id: formData.website_id || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchProfiles();
        setShowCreateModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to create AI profile');
      }
    } catch (_error) {
      console.error('Failed to create AI profile:', _error);
      alert('Failed to create AI profile');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    try {
      const response = await fetch(`${API_BASE}/ai-agent-profiles/${editingProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          website_id: formData.website_id || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchProfiles();
        setEditingProfile(null);
        resetForm();
      } else {
        alert(data.error || 'Failed to update AI profile');
      }
    } catch (_error) {
      console.error('Failed to update AI profile:', _error);
      alert('Failed to update AI profile');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this AI profile? Widgets using this profile will be affected.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/ai-agent-profiles/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        await fetchProfiles();
      } else {
        alert(data.error || 'Failed to delete AI profile');
      }
    } catch (_error) {
      console.error('Failed to delete AI profile:', _error);
      alert('Failed to delete AI profile');
    }
  };

  const resetForm = () => {
    setFormData({
      profile_name: '',
      description: '',
      website_id: null,
      model: 'gemini-2.0-flash',
      system_prompt: 'You are a helpful customer service AI assistant. Be friendly, professional, and concise.',
      temperature: 0.7,
      max_tokens: 500,
      rag_enabled: true,
      kb_tags: [],
      is_default: false,
    });
  };

  const openEditModal = (profile: AIProfile) => {
    setEditingProfile(profile);
    let tags: string[] = [];
    try {
      tags = JSON.parse(profile.kb_tags || '[]');
    } catch (_error) {
      console.error('Failed to parse tags:', _error);
    }
    setFormData({
      profile_name: profile.profile_name,
      description: profile.description,
      website_id: profile.website_id,
      model: profile.model,
      system_prompt: profile.system_prompt,
      temperature: profile.temperature,
      max_tokens: profile.max_tokens,
      rag_enabled: profile.rag_enabled,
      kb_tags: tags,
      is_default: profile.is_default,
    });
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      kb_tags: prev.kb_tags.includes(tag)
        ? prev.kb_tags.filter((t) => t !== tag)
        : [...prev.kb_tags, tag],
    }));
  };

  const getWebsiteName = (websiteId: number | null) => {
    if (!websiteId) return 'No website';
    const website = websites.find((w) => w.id === websiteId);
    return website ? website.name : `Website #${websiteId}`;
  };

  const parseTags = (tagsJson: string): string[] => {
    try {
      return JSON.parse(tagsJson || '[]');
    } catch (_error) {
      return [];
    }
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
            <h1 className="text-3xl font-bold text-gray-800">AI Profile Management</h1>
            <p className="text-gray-600 mt-1">
              Configure AI agents for different websites with custom knowledge base filtering
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add AI Profile
          </button>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map((profile) => {
          const tags = parseTags(profile.kb_tags);
          return (
            <div
              key={profile.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Bot className="w-10 h-10 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{profile.profile_name}</h3>
                    <p className="text-sm text-gray-500">{getWebsiteName(profile.website_id)}</p>
                  </div>
                </div>
                {profile.is_default && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    DEFAULT
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {profile.description || 'No description'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium">{profile.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-medium">{profile.temperature}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Tokens:</span>
                  <span className="font-medium">{profile.max_tokens}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">RAG:</span>
                  <span className={`font-medium ${profile.rag_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.rag_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Knowledge Base Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => openEditModal(profile)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No AI profiles yet</h3>
          <p className="text-gray-500 mb-4">Create your first AI profile to get started</p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create AI Profile
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProfile) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingProfile ? 'Edit AI Profile' : 'Create New AI Profile'}
            </h2>
            <form onSubmit={editingProfile ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    value={formData.profile_name}
                    onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="E.g., E-commerce Support Bot"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <select
                    value={formData.website_id || ''}
                    onChange={(e) => setFormData({ ...formData, website_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No website</option>
                    {websites.map((website) => (
                      <option key={website.id} value={website.id}>
                        {website.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Brief description of this AI profile"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {formData.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="100"
                    max="4000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Instructions for the AI assistant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Knowledge Base Tags (Select tags to filter relevant articles)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.kb_tags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.kb_tags.length} tags
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rag_enabled}
                    onChange={(e) => setFormData({ ...formData, rag_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable RAG (Knowledge Base)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Set as default profile</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProfile(null);
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
                  {editingProfile ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProfileManagement;
