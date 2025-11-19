import React, { useState, useEffect } from 'react';
import {
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Activity,
  Lock,
  Unlock
} from 'lucide-react';
import apiClient from '../../lib/api';

interface BlockedIP {
  ip: string;
  ban_time?: string;
  reason?: string;
  jail_name: string;
  failed?: number;
  banned_at?: string;
}

interface SecurityStats {
  jail_name: string;
  currently_failed: string;
  total_failed: string;
  currently_banned: string;
  total_banned: string;
  firewall_blocked_total: number;
}

interface FirewallLog {
  timestamp: string;
  message: string;
  source_ip: string;
}

const SecurityManagement: React.FC = () => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [firewallLogs, setFirewallLogs] = useState<FirewallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [activeTab, setActiveTab] = useState<'blocked' | 'logs' | 'stats'>('blocked');

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBlockedIPs(),
        loadStats(),
        loadFirewallLogs()
      ]);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedIPs = async () => {
    try {
      const response = await apiClient.get('/api/v1/security/blocked-ips');
      setBlockedIPs(response.data.data.blocked_ips || []);
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/security/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFirewallLogs = async () => {
    try {
      const response = await apiClient.get('/api/v1/security/firewall-logs?limit=50');
      setFirewallLogs(response.data.data.logs || []);
    } catch (error) {
      console.error('Error loading firewall logs:', error);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP.trim()) {
      alert('Please enter an IP address');
      return;
    }

    try {
      await apiClient.post('/api/v1/security/block-ip', {
        ip: newIP,
        jail_name: 'asterisk',
        reason: blockReason || 'Manually blocked by admin'
      });
      
      setShowBlockModal(false);
      setNewIP('');
      setBlockReason('');
      loadData();
      alert('IP blocked successfully');
    } catch (error: any) {
      console.error('Error blocking IP:', error);
      alert(`Failed to block IP: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/security/unblock-ip/${ip}?jail=asterisk`);
      loadData();
      alert('IP unblocked successfully');
    } catch (error: any) {
      console.error('Error unblocking IP:', error);
      alert(`Failed to unblock IP: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Management</h1>
              <p className="text-gray-600">Manage firewall and fail2ban protection</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowBlockModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Block IP
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Banned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currently_banned}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Banned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_banned}</p>
              </div>
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_failed}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Firewall Blocks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.firewall_blocked_total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('blocked')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'blocked'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Ban className="w-4 h-4 inline mr-2" />
            Blocked IPs ({blockedIPs.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Firewall Logs ({firewallLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Statistics
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Blocked IPs Tab */}
        {activeTab === 'blocked' && (
          <div className="overflow-x-auto">
            {blockedIPs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No blocked IPs</p>
                <p className="text-sm">All systems secure</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blockedIPs.map((ip, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {ip.ip}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {ip.jail_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ip.reason || 'Automatic ban'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleUnblockIP(ip.ip)}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          <Unlock className="w-4 h-4 mr-1" />
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Firewall Logs Tab */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            {firewallLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No firewall activity</p>
                <p className="text-sm">No blocked attempts logged yet</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {firewallLogs.slice().reverse().map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {log.source_ip}
                            </span>
                            <span className="text-xs text-gray-500">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-600 font-mono pl-6">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Fail2ban Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Jail Name:</span>
                    <span className="font-medium">{stats.jail_name}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Currently Failed:</span>
                    <span className="font-medium text-yellow-600">{stats.currently_failed}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Total Failed:</span>
                    <span className="font-medium text-orange-600">{stats.total_failed}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Currently Banned:</span>
                    <span className="font-medium text-red-600">{stats.currently_banned}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Total Banned:</span>
                    <span className="font-medium text-red-800">{stats.total_banned}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Firewall Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Total Blocked Packets:</span>
                    <span className="font-medium text-blue-600">{stats.firewall_blocked_total}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Protection Status:</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Multi-layer Protection:</strong> Your system is protected by firewall
                      (network layer), Asterisk ACL (application layer), and fail2ban (behavioral layer).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block IP Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Block IP Address</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Suspicious activity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleBlockIP}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-4 h-4 inline mr-2" />
                  Block IP
                </button>
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setNewIP('');
                    setBlockReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityManagement;
