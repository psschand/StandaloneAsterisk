import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Globe,
  MessageSquare,
  Code,
  Eye,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Widget {
  id: number;
  tenant_id: string;
  website_id: number | null;
  name: string;
  widget_key: string;
  enabled: boolean;
  primary_color: string;
  position: string;
  title: string;
  subtitle: string;
  created_at: string;
  updated_at: string;
}

interface Website {
  id: number;
  name: string;
  domain: string;
}

const WidgetManagement: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [websites, setWebsites] = useState<Map<number, Website>>(new Map());
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch widgets
      const widgetsResponse = await fetch(`${API_BASE}/chat/widgets`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const widgetsData = await widgetsResponse.json();
      
      // Fetch websites
      const websitesResponse = await fetch(`${API_BASE}/websites`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const websitesData = await websitesResponse.json();
      
      if (widgetsData.success) {
        setWidgets(widgetsData.data || []);
      }
      
      if (websitesData.success) {
        const websiteMap = new Map();
        (websitesData.data || []).forEach((site: Website) => {
          websiteMap.set(site.id, site);
        });
        setWebsites(websiteMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWidget = async (widgetId: number) => {
    if (!confirm('Are you sure you want to delete this widget? This cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE}/chat/widgets/${widgetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete widget');
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
      alert('Failed to delete widget');
    }
  };

  const copyEmbedCode = (widgetKey: string, widgetId: number) => {
    const embedCode = `<!-- CallCenter Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','cw','${window.location.origin}/widget.js'));
  cw('init', { widgetKey: '${widgetKey}' });
</script>`;
    
    navigator.clipboard.writeText(embedCode);
    setCopiedId(widgetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWebsiteInfo = (websiteId: number | null) => {
    if (!websiteId) {
      return { name: 'Shared Widget', domain: 'Multiple websites', color: 'bg-gray-100 text-gray-800' };
    }
    const website = websites.get(websiteId);
    return website 
      ? { name: website.name, domain: website.domain, color: 'bg-blue-100 text-blue-800' }
      : { name: 'Unknown Website', domain: 'N/A', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Widget Management</h1>
            <p className="text-gray-600 mt-1">
              Manage chat widgets for your websites
            </p>
          </div>
          <button
            onClick={() => navigate('/chat-widget-designer')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Widget
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💡 How it works:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Each website automatically gets a default widget when created</li>
              <li>Widgets can be website-specific or shared across multiple websites</li>
              <li>Each widget can have its own AI agent configuration</li>
              <li>Copy the embed code and paste it into your website's HTML</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : widgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets yet</h3>
          <p className="text-gray-600 mb-4">
            Create a website first, and a default widget will be generated automatically
          </p>
          <button
            onClick={() => navigate('/websites')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Websites
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => {
            const websiteInfo = getWebsiteInfo(widget.website_id);
            
            return (
              <div
                key={widget.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Widget Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                      style={{ backgroundColor: widget.primary_color }}
                    >
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{widget.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          widget.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {widget.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Website Association */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center text-sm mb-1">
                    <Globe className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-700">Website:</span>
                  </div>
                  <div className={`mt-2 px-3 py-2 rounded-lg ${websiteInfo.color}`}>
                    <p className="font-medium text-sm">{websiteInfo.name}</p>
                    <p className="text-xs mt-0.5 opacity-75">{websiteInfo.domain}</p>
                  </div>
                  {widget.website_id && (
                    <button
                      onClick={() => navigate(`/websites/${widget.website_id}/channels`)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Manage Channels
                    </button>
                  )}
                </div>

                {/* Widget Info */}
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium text-gray-900 capitalize">{widget.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Widget Key:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {widget.widget_key.substring(0, 12)}...
                    </code>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyEmbedCode(widget.widget_key, widget.id)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 flex items-center justify-center text-sm"
                    title="Copy embed code"
                  >
                    {copiedId === widget.id ? (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Code className="w-4 h-4 mr-1" />
                        Embed
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/chat-widget-designer?id=${widget.id}`)}
                    className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-center text-sm"
                    title="Edit widget"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteWidget(widget.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center text-sm"
                    title="Delete widget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Last Updated */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Updated: {new Date(widget.updated_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WidgetManagement;
