import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader, 
  MessageCircle,
  AlertCircle,
  TestTube
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Channel {
  id: number;
  website_id: number;
  channel_type: string;
  channel_name: string;
  is_active: boolean;
  auto_respond: boolean;
  connection_status: 'active' | 'disconnected' | 'error' | 'pending';
  credentials: any;
  created_at: string;
  updated_at: string;
}

interface Website {
  id: number;
  name: string;
  domain: string;
}

const ChannelManagement: React.FC = () => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  
  const [website, setWebsite] = useState<Website | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [testing, setTesting] = useState<number | null>(null);

  useEffect(() => {
    fetchWebsite();
    fetchChannels();
  }, [websiteId]);

  const fetchWebsite = async () => {
    try {
      const response = await fetch(`http://localhost:8001/api/v1/websites/${websiteId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWebsite(data.data);
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8001/api/v1/websites/${websiteId}/channels`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setChannels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const testChannel = async (channelId: number) => {
    try {
      setTesting(channelId);
      const response = await fetch(`http://localhost:8001/api/v1/channels/${channelId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        fetchChannels(); // Refresh to get updated status
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error testing channel:', error);
      alert('❌ Failed to test channel connection');
    } finally {
      setTesting(null);
    }
  };

  const toggleChannel = async (channel: Channel) => {
    try {
      const response = await fetch(`http://localhost:8001/api/v1/channels/${channel.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !channel.is_active,
        }),
      });
      
      if (response.ok) {
        fetchChannels();
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
    }
  };

  const deleteChannel = async (channelId: number) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      const response = await fetch(`http://localhost:8001/api/v1/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        fetchChannels();
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return '📱';
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'telegram': return '✈️';
      case 'twitter': return '🐦';
      case 'web': return '💬';
      default: return '📢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/websites')}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
        >
          ← Back to Websites
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {website ? `${website.name} - Channels` : 'Channel Management'}
            </h1>
            <p className="text-gray-600">
              {website?.domain}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Channel
          </button>
        </div>
      </div>

      {/* Channels List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No channels configured</h3>
          <p className="text-gray-600 mb-4">
            Add your first communication channel to start receiving messages
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Channel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Channel Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getChannelIcon(channel.channel_type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{channel.channel_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{channel.channel_type}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedChannel(channel);
                      setShowAddModal(true);
                    }}
                    className="text-gray-600 hover:text-blue-600"
                    title="Configure"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteChannel(channel.id)}
                    className="text-gray-600 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    channel.connection_status
                  )}`}
                >
                  {channel.connection_status.toUpperCase()}
                </span>
                {channel.is_active && (
                  <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                    ACTIVE
                  </span>
                )}
                {channel.auto_respond && (
                  <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                    AI AUTO
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => testChannel(channel.id)}
                  disabled={testing === channel.id}
                  className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center disabled:opacity-50"
                >
                  {testing === channel.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test
                    </>
                  )}
                </button>
                <button
                  onClick={() => toggleChannel(channel)}
                  className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center ${
                    channel.is_active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {channel.is_active ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Enable
                    </>
                  )}
                </button>
              </div>

              {/* Last Updated */}
              <div className="mt-4 text-xs text-gray-500">
                Updated: {new Date(channel.updated_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Channel Modal */}
      {showAddModal && (
        <ChannelModal
          websiteId={Number(websiteId)}
          channel={selectedChannel}
          onClose={() => {
            setShowAddModal(false);
            setSelectedChannel(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedChannel(null);
            fetchChannels();
          }}
        />
      )}
    </div>
  );
};

// Channel Configuration Modal Component
const ChannelModal: React.FC<{
  websiteId: number;
  channel: Channel | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ websiteId, channel, onClose, onSuccess }) => {
  const { accessToken } = useAuthStore();
  const [channelType, setChannelType] = useState(channel?.channel_type || 'whatsapp');
  const [channelName, setChannelName] = useState(channel?.channel_name || '');
  const [autoRespond, setAutoRespond] = useState(channel?.auto_respond || false);
  const [loading, setLoading] = useState(false);
  
  // WhatsApp credentials
  const [phoneNumberId, setPhoneNumberId] = useState(
    channel?.credentials?.phone_number_id || ''
  );
  const [accessTokenWA, setAccessTokenWA] = useState(
    channel?.credentials?.access_token || ''
  );
  const [businessAccountId, setBusinessAccountId] = useState(
    channel?.credentials?.business_account_id || ''
  );
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(
    channel?.credentials?.webhook_verify_token || `verify_${Date.now()}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const credentials: any = {};
    
    if (channelType === 'whatsapp') {
      credentials.phone_number_id = phoneNumberId;
      credentials.access_token = accessTokenWA;
      credentials.business_account_id = businessAccountId;
      credentials.webhook_verify_token = webhookVerifyToken;
      credentials.api_version = 'v18.0';
    }

    const payload = {
      channel_type: channelType,
      channel_name: channelName,
      credentials,
      auto_respond: autoRespond,
      business_hours_only: false,
    };

    try {
      const url = channel
        ? `http://localhost:8001/api/v1/channels/${channel.id}`
        : `http://localhost:8001/api/v1/websites/${websiteId}/channels`;
      
      const method = channel ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(channel ? 'Channel updated successfully!' : 'Channel created successfully!');
        onSuccess();
      } else {
        alert(`Error: ${data.error || 'Failed to save channel'}`);
      }
    } catch (error) {
      console.error('Error saving channel:', error);
      alert('Failed to save channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {channel ? 'Edit Channel' : 'Add New Channel'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Channel Type */}
            {!channel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Type
                </label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="whatsapp">📱 WhatsApp Business</option>
                  <option value="facebook" disabled>📘 Facebook Messenger (Coming Soon)</option>
                  <option value="instagram" disabled>📷 Instagram DM (Coming Soon)</option>
                  <option value="telegram" disabled>✈️ Telegram (Coming Soon)</option>
                </select>
              </div>
            )}

            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g., Main Store WhatsApp"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>

            {/* WhatsApp Configuration */}
            {channelType === 'whatsapp' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    WhatsApp Business API Credentials
                  </h3>
                  <p className="text-sm text-blue-800">
                    Get these from your Meta Business Account → WhatsApp → API Setup
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number ID *
                  </label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token *
                  </label>
                  <textarea
                    value={accessTokenWA}
                    onChange={(e) => setAccessTokenWA(e.target.value)}
                    placeholder="EAAxxxxxxxxxxxxxxx..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account ID *
                  </label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    value={webhookVerifyToken}
                    onChange={(e) => setWebhookVerifyToken(e.target.value)}
                    placeholder="your_verify_token"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use this token when setting up the webhook in Meta Business Manager
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Webhook URL:</h4>
                  <code className="text-sm bg-white px-3 py-2 rounded border block">
                    http://your-domain.com/api/v1/webhooks/whatsapp
                  </code>
                </div>
              </>
            )}

            {/* Auto Respond */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRespond"
                checked={autoRespond}
                onChange={(e) => setAutoRespond(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="autoRespond" className="ml-2 text-sm text-gray-700">
                Enable AI Auto-Response
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{channel ? 'Update' : 'Create'} Channel</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChannelManagement;
