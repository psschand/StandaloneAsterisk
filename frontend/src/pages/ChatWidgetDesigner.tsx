import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import {
  Palette,
  MessageSquare,
  FormInput,
  Sparkles,
  Eye,
  Save,
  Code,
  Download,
  Zap,
  Users,
  TrendingUp,
  Bell,
  Image as ImageIcon,
  Type,
  Mail,
  Phone as PhoneIcon,
  Hash,
  Calendar,
  Link as LinkIcon,
  ToggleLeft,
  List,
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Check,
  Smile,
  Gift,
  Star,
  Crown,
  Target,
  Database,
} from 'lucide-react';

interface WidgetConfig {
  id?: number;
  name: string;
  widget_key?: string;
  
  // Appearance
  primary_color: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  greeting_message: string;
  placeholder_text: string;
  team_name: string;
  show_agent_avatar: boolean;
  show_agent_name: boolean;
  offline_message: string;
  
  // Branding
  company_name: string;
  company_logo?: string;
  welcome_image?: string;
  favicon?: string;
  
  // Pre-chat Form
  enable_pre_chat_form: boolean;
  pre_chat_fields: FormField[];
  require_email: boolean;
  require_name: boolean;
  
  // Marketing Features
  enable_proactive_chat: boolean;
  proactive_delay: number; // seconds
  proactive_message: string;
  show_unread_count: boolean;
  enable_sound: boolean;
  
  // Sales Features
  enable_product_showcase: boolean;
  showcase_products: Product[];
  enable_lead_capture: boolean;
  lead_capture_trigger: 'on_exit' | 'after_time' | 'on_scroll';
  lead_capture_delay: number;
  
  // UX Enhancements
  enable_typing_indicator: boolean;
  enable_read_receipts: boolean;
  enable_emoji: boolean;
  enable_file_upload: boolean;
  enable_quick_replies: boolean;
  quick_replies: string[];
  
  // Gamification
  enable_rating: boolean;
  enable_satisfaction_survey: boolean;
  show_chat_history: boolean;
  enable_chat_transcript: boolean;
  
  // AI Features
  enable_ai_suggestions: boolean;
  enable_smart_replies: boolean;
  enable_sentiment_analysis: boolean;
  
  // AI Agent & RAG Configuration
  enable_ai_agent: boolean;
  ai_model: string; // 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gpt-4' etc
  enable_rag: boolean;
  rag_knowledge_bases: string[]; // IDs or names of knowledge bases
  rag_max_results: number;
  rag_confidence_threshold: number;
  
  // Handover Rules
  enable_auto_handover: boolean;
  handover_confidence_threshold: number; // 0-1, trigger handover if AI confidence below this
  handover_on_keywords: string[]; // Keywords that trigger immediate handover
  handover_message: string;
  max_ai_messages: number; // Max messages before forcing handover
  handover_timeout_minutes: number; // Auto-handover if no resolution in X minutes
  
  // Analytics
  track_visitor_info: boolean;
  track_page_views: boolean;
  track_referrer: boolean;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'date' | 'url' | 'checkbox';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select
  order: number;
}

interface Product {
  id: string;
  name: string;
  image?: string;
  price?: string;
  url?: string;
}

const fieldTypes = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: PhoneIcon },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'textarea', label: 'Text Area', icon: FormInput },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: ToggleLeft },
];

interface KnowledgeBaseCategory {
  category: string;
  count: number;
  subcategories?: string[];
}

export default function ChatWidgetDesigner() {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'appearance' | 'form' | 'ai-agent' | 'marketing' | 'ux' | 'embed'>('appearance');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseCategory[]>([]);
  const [loadingKBs, setLoadingKBs] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>({
    name: 'Default Widget',
    primary_color: '#4f46e5',
    position: 'bottom-right',
    greeting_message: 'Hi! How can we help you today?',
    placeholder_text: 'Type your message...',
    team_name: 'Support Team',
    show_agent_avatar: true,
    show_agent_name: true,
    offline_message: 'We\'re currently offline. Leave us a message!',
    company_name: 'Your Company',
    enable_pre_chat_form: false,
    pre_chat_fields: [],
    require_email: false,
    require_name: true,
    enable_proactive_chat: false,
    proactive_delay: 10,
    proactive_message: 'Need help? We\'re here to assist you!',
    show_unread_count: true,
    enable_sound: true,
    enable_product_showcase: false,
    showcase_products: [],
    enable_lead_capture: false,
    lead_capture_trigger: 'on_exit',
    lead_capture_delay: 30,
    enable_typing_indicator: true,
    enable_read_receipts: true,
    enable_emoji: true,
    enable_file_upload: true,
    enable_quick_replies: false,
    quick_replies: ['How can I help?', 'Tell me more', 'Contact sales'],
    enable_rating: true,
    enable_satisfaction_survey: true,
    show_chat_history: true,
    enable_chat_transcript: true,
    enable_ai_suggestions: false,
    enable_smart_replies: false,
    enable_sentiment_analysis: false,
    // AI Agent & RAG
    enable_ai_agent: true,
    ai_model: 'gemini-1.5-flash',
    enable_rag: true,
    rag_knowledge_bases: [],
    rag_max_results: 3,
    rag_confidence_threshold: 0.7,
    // Handover Rules
    enable_auto_handover: true,
    handover_confidence_threshold: 0.6,
    handover_on_keywords: ['human', 'agent', 'manager', 'supervisor', 'speak to someone'],
    handover_message: 'Let me connect you with one of our specialists who can better assist you.',
    max_ai_messages: 10,
    handover_timeout_minutes: 5,
    track_visitor_info: true,
    track_page_views: true,
    track_referrer: true,
  });

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showPreChatForm, setShowPreChatForm] = useState(true);

  // Load existing widget config
  useEffect(() => {
    loadWidget();
  }, []);

  const loadWidget = async () => {
    try {
      const response = await axios.get('/api/v1/chat/widgets/1', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        const loadedData = response.data.data;
        
        // Parse JSON fields if they're strings
        if (typeof loadedData.pre_chat_fields === 'string') {
          try {
            loadedData.pre_chat_fields = JSON.parse(loadedData.pre_chat_fields);
          } catch (e) {
            loadedData.pre_chat_fields = [];
          }
        }
        if (typeof loadedData.quick_replies === 'string') {
          try {
            loadedData.quick_replies = JSON.parse(loadedData.quick_replies);
          } catch (e) {
            loadedData.quick_replies = [];
          }
        }
        if (typeof loadedData.showcase_products === 'string') {
          try {
            loadedData.showcase_products = JSON.parse(loadedData.showcase_products);
          } catch (e) {
            loadedData.showcase_products = [];
          }
        }
        
        // Merge loaded data with defaults (loaded data takes precedence)
        setConfig({ ...config, ...loadedData });
      }
    } catch (error) {
      console.error('Failed to load widget:', error);
    }
  };

  // Fetch available knowledge bases
  const fetchKnowledgeBases = async () => {
    setLoadingKBs(true);
    try {
      const response = await axios.get('/api/v1/knowledge-base/categories', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setKnowledgeBases(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
      setKnowledgeBases([]);
    } finally {
      setLoadingKBs(false);
    }
  };

  // Load KBs when switching to AI Agent tab
  useEffect(() => {
    if (activeTab === 'ai-agent' && knowledgeBases.length === 0) {
      fetchKnowledgeBases();
    }
  }, [activeTab]);

  const saveWidget = async () => {
    setSaving(true);
    try {
      // Prepare payload - convert arrays to JSON strings for backend
      const payload = {
        ...config,
        // Convert array fields to JSON strings if they're arrays
        pre_chat_fields: Array.isArray(config.pre_chat_fields) 
          ? JSON.stringify(config.pre_chat_fields) 
          : config.pre_chat_fields,
        quick_replies: Array.isArray(config.quick_replies) 
          ? JSON.stringify(config.quick_replies) 
          : config.quick_replies,
        showcase_products: Array.isArray(config.showcase_products) 
          ? JSON.stringify(config.showcase_products) 
          : config.showcase_products,
      };
      
      const response = await axios.put('/api/v1/chat/widgets/1', payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        alert('Widget configuration saved successfully!');
        // Reload to get the latest data
        await loadWidget();
      }
    } catch (error) {
      console.error('Failed to save widget:', error);
      alert('Failed to save widget configuration');
    } finally {
      setSaving(false);
    }
  };

  const addFormField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      order: config.pre_chat_fields.length,
    };
    setConfig({ ...config, pre_chat_fields: [...config.pre_chat_fields, newField] });
  };

  const updateFormField = (id: string, updates: Partial<FormField>) => {
    setConfig({
      ...config,
      pre_chat_fields: config.pre_chat_fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const removeFormField = (id: string) => {
    setConfig({
      ...config,
      pre_chat_fields: config.pre_chat_fields.filter(field => field.id !== id),
    });
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      name: 'New Product',
      price: '$0.00',
    };
    setConfig({ ...config, showcase_products: [...config.showcase_products, newProduct] });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setConfig({
      ...config,
      showcase_products: config.showcase_products.map(product =>
        product.id === id ? { ...product, ...updates } : product
      ),
    });
  };

  const removeProduct = (id: string) => {
    setConfig({
      ...config,
      showcase_products: config.showcase_products.filter(product => product.id !== id),
    });
  };

  const addQuickReply = () => {
    setConfig({ ...config, quick_replies: [...config.quick_replies, 'New reply'] });
  };

  const updateQuickReply = (index: number, value: string) => {
    const newReplies = [...config.quick_replies];
    newReplies[index] = value;
    setConfig({ ...config, quick_replies: newReplies });
  };

  const removeQuickReply = (index: number) => {
    setConfig({ ...config, quick_replies: config.quick_replies.filter((_, i) => i !== index) });
  };

  const generateEmbedCode = () => {
    const widgetKey = config.widget_key || 'YOUR_WIDGET_KEY';
    return `<!-- CallCenter Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatWidget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'ChatWidget', '${window.location.origin}/chat-widget.js'));
  ChatWidget('init', { widgetKey: '${widgetKey}' });
</script>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'form', name: 'Pre-Chat Form', icon: FormInput },
    { id: 'ai-agent', name: 'AI Agent & RAG', icon: Sparkles },
    { id: 'marketing', name: 'Marketing & Sales', icon: TrendingUp },
    { id: 'ux', name: 'UX Features', icon: Sparkles },
    { id: 'embed', name: 'Embed Code', icon: Code },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Widget Designer</h1>
          <p className="text-gray-600 mt-1">Customize your chat widget with advanced features</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={saveWidget}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Features Enabled</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {Object.values(config).filter(v => v === true).length}
            </div>
            <p className="text-indigo-100 text-sm">Active customizations</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
                  
                  {/* Widget Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Widget Name
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="My Chat Widget"
                    />
                  </div>

                  {/* Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={config.company_name}
                        onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Your Company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={config.primary_color}
                          onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                          className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.primary_color}
                          onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="#4f46e5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Widget Position
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setConfig({ ...config, position: pos as any })}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            config.position === pos
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Greeting Message
                      </label>
                      <textarea
                        value={config.greeting_message}
                        onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Hi! How can we help you today?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={config.placeholder_text}
                        onChange={(e) => setConfig({ ...config, placeholder_text: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Type your message..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={config.team_name}
                        onChange={(e) => setConfig({ ...config, team_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Support Team"
                      />
                      <p className="mt-1 text-xs text-gray-500">Displayed in the chat header</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offline Message
                      </label>
                      <textarea
                        value={config.offline_message}
                        onChange={(e) => setConfig({ ...config, offline_message: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="We're currently offline..."
                      />
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="mt-6 space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.show_agent_avatar}
                        onChange={(e) => setConfig({ ...config, show_agent_avatar: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Show agent avatar</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.show_agent_name}
                        onChange={(e) => setConfig({ ...config, show_agent_name: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Show agent name</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Form Builder Tab */}
            {activeTab === 'form' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pre-Chat Form</h3>
                    <p className="text-sm text-gray-600 mt-1">Collect visitor information before chat starts</p>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.enable_pre_chat_form}
                      onChange={(e) => setConfig({ ...config, enable_pre_chat_form: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Form</span>
                  </label>
                </div>

                {config.enable_pre_chat_form && (
                  <>
                    {/* Required Fields */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Required Fields</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.require_name}
                            onChange={(e) => setConfig({ ...config, require_name: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Require name</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={config.require_email}
                            onChange={(e) => setConfig({ ...config, require_email: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Require email</span>
                        </label>
                      </div>
                    </div>

                    {/* Custom Fields */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Custom Fields</h4>
                        <button
                          onClick={addFormField}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Field</span>
                        </button>
                      </div>

                      {config.pre_chat_fields.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FormInput className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No custom fields yet. Click "Add Field" to create one.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {config.pre_chat_fields.map((field) => {
                            return (
                              <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0 mt-2">
                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Field Label
                                        </label>
                                        <input
                                          type="text"
                                          value={field.label}
                                          onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Field label"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Field Type
                                        </label>
                                        <select
                                          value={field.type}
                                          onChange={(e) => updateFormField(field.id, { type: e.target.value as any })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        >
                                          {fieldTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                              {type.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {field.type !== 'checkbox' && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Placeholder
                                        </label>
                                        <input
                                          type="text"
                                          value={field.placeholder || ''}
                                          onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Enter placeholder text..."
                                        />
                                      </div>
                                    )}

                                    {field.type === 'select' && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Options (comma-separated)
                                        </label>
                                        <input
                                          type="text"
                                          value={field.options?.join(', ') || ''}
                                          onChange={(e) => updateFormField(field.id, { options: e.target.value.split(',').map(o => o.trim()) })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                          placeholder="Option 1, Option 2, Option 3"
                                        />
                                      </div>
                                    )}

                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                      />
                                      <span className="text-xs text-gray-700">Required field</span>
                                    </label>
                                  </div>
                                  <button
                                    onClick={() => removeFormField(field.id)}
                                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Marketing & Sales Tab */}
            {activeTab === 'marketing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Marketing & Sales Features</h3>

                {/* Proactive Chat */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Proactive Chat</h4>
                        <p className="text-sm text-gray-600">Auto-engage visitors with a message</p>
                      </div>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enable_proactive_chat}
                        onChange={(e) => setConfig({ ...config, enable_proactive_chat: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>
                  </div>
                  {config.enable_proactive_chat && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delay (seconds)
                        </label>
                        <input
                          type="number"
                          value={config.proactive_delay}
                          onChange={(e) => setConfig({ ...config, proactive_delay: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Proactive Message
                        </label>
                        <textarea
                          value={config.proactive_message}
                          onChange={(e) => setConfig({ ...config, proactive_message: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Need help? We're here to assist you!"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Lead Capture */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Exit Intent Lead Capture</h4>
                        <p className="text-sm text-gray-600">Capture leads before visitors leave</p>
                      </div>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enable_lead_capture}
                        onChange={(e) => setConfig({ ...config, enable_lead_capture: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </label>
                  </div>
                  {config.enable_lead_capture && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trigger
                        </label>
                        <select
                          value={config.lead_capture_trigger}
                          onChange={(e) => setConfig({ ...config, lead_capture_trigger: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="on_exit">On Exit Intent</option>
                          <option value="after_time">After Time Delay</option>
                          <option value="on_scroll">On Scroll Depth</option>
                        </select>
                      </div>
                      {config.lead_capture_trigger === 'after_time' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delay (seconds)
                          </label>
                          <input
                            type="number"
                            value={config.lead_capture_delay}
                            onChange={(e) => setConfig({ ...config, lead_capture_delay: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Showcase */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Gift className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Product Showcase</h4>
                        <p className="text-sm text-gray-600">Show products in chat</p>
                      </div>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enable_product_showcase}
                        onChange={(e) => setConfig({ ...config, enable_product_showcase: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                  {config.enable_product_showcase && (
                    <div>
                      <button
                        onClick={addProduct}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 mb-4"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                      {config.showcase_products.length > 0 && (
                        <div className="space-y-3">
                          {config.showcase_products.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex items-start space-x-3">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <input
                                    type="text"
                                    value={product.name}
                                    onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Product name"
                                  />
                                  <input
                                    type="text"
                                    value={product.price || ''}
                                    onChange={(e) => updateProduct(product.id, { price: e.target.value })}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Price"
                                  />
                                  <input
                                    type="url"
                                    value={product.url || ''}
                                    onChange={(e) => updateProduct(product.id, { url: e.target.value })}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Product URL"
                                  />
                                </div>
                                <button
                                  onClick={() => removeProduct(product.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sound & Notifications */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Enable notification sounds</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.enable_sound}
                      onChange={(e) => setConfig({ ...config, enable_sound: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Hash className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Show unread message count</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.show_unread_count}
                      onChange={(e) => setConfig({ ...config, show_unread_count: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* AI Agent & RAG Tab */}
            {activeTab === 'ai-agent' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">AI Agent & RAG Configuration</h3>

                {/* AI Agent Enable */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Enable AI Agent</h4>
                        <p className="text-sm text-gray-600">Use AI to handle customer conversations</p>
                      </div>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enable_ai_agent}
                        onChange={(e) => setConfig({ ...config, enable_ai_agent: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>

                  {config.enable_ai_agent && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Model
                        </label>
                        <select
                          value={config.ai_model}
                          onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Cost-effective)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced)</option>
                          <option value="gpt-4">GPT-4 (Premium)</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Balanced)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* RAG Configuration */}
                {config.enable_ai_agent && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Database className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">RAG (Retrieval-Augmented Generation)</h4>
                          <p className="text-sm text-gray-600">Use knowledge bases to enhance AI responses</p>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.enable_rag}
                          onChange={(e) => setConfig({ ...config, enable_rag: e.target.checked })}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>
                    </div>

                    {config.enable_rag && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Knowledge Bases
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            Select which knowledge bases the AI should use to answer questions
                          </p>
                          <div className="space-y-2">
                            {loadingKBs ? (
                              <div className="p-4 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                Loading knowledge bases...
                              </div>
                            ) : knowledgeBases.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No knowledge bases found</p>
                                <p className="text-xs mt-1">Create knowledge base entries to enable RAG</p>
                              </div>
                            ) : (
                              <>
                                {knowledgeBases.map((kb) => (
                                  <div key={kb.category} className="p-3 bg-white rounded-lg border border-gray-300 hover:border-purple-300 transition-colors">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={config.rag_knowledge_bases.includes(kb.category)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setConfig({
                                              ...config,
                                              rag_knowledge_bases: [...config.rag_knowledge_bases, kb.category]
                                            });
                                          } else {
                                            setConfig({
                                              ...config,
                                              rag_knowledge_bases: config.rag_knowledge_bases.filter(c => c !== kb.category)
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                      />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{kb.category}</div>
                                        <div className="text-xs text-gray-500">
                                          {kb.count} {kb.count === 1 ? 'entry' : 'entries'}
                                          {kb.subcategories && kb.subcategories.length > 0 && (
                                            <span> • {kb.subcategories.length} subcategories</span>
                                          )}
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                ))}
                                <button
                                  onClick={fetchKnowledgeBases}
                                  className="text-xs text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                                >
                                  <Database className="w-3 h-3" />
                                  <span>Refresh knowledge bases</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Results
                            </label>
                            <input
                              type="number"
                              value={config.rag_max_results}
                              onChange={(e) => setConfig({ ...config, rag_max_results: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              min="1"
                              max="10"
                            />
                            <p className="text-xs text-gray-500 mt-1">Number of knowledge base entries to retrieve</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confidence Threshold
                            </label>
                            <input
                              type="number"
                              value={config.rag_confidence_threshold}
                              onChange={(e) => setConfig({ ...config, rag_confidence_threshold: parseFloat(e.target.value) })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              min="0"
                              max="1"
                              step="0.05"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum similarity score (0-1)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Handover Rules */}
                {config.enable_ai_agent && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Auto-Handover to Human Agents</h4>
                          <p className="text-sm text-gray-600">Define when AI should transfer to a human</p>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.enable_auto_handover}
                          onChange={(e) => setConfig({ ...config, enable_auto_handover: e.target.checked })}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                      </label>
                    </div>

                    {config.enable_auto_handover && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confidence Threshold
                          </label>
                          <input
                            type="range"
                            value={config.handover_confidence_threshold}
                            onChange={(e) => setConfig({ ...config, handover_confidence_threshold: parseFloat(e.target.value) })}
                            className="w-full"
                            min="0"
                            max="1"
                            step="0.05"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>More handovers (0)</span>
                            <span className="font-medium text-orange-600">
                              {config.handover_confidence_threshold.toFixed(2)}
                            </span>
                            <span>Less handovers (1)</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Hand over to human if AI confidence is below this threshold
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Handover Keywords
                          </label>
                          <input
                            type="text"
                            value={config.handover_on_keywords.join(', ')}
                            onChange={(e) => setConfig({ 
                              ...config, 
                              handover_on_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            placeholder="human, agent, manager, supervisor"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Comma-separated keywords that trigger immediate handover
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Handover Message
                          </label>
                          <textarea
                            value={config.handover_message}
                            onChange={(e) => setConfig({ ...config, handover_message: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            placeholder="Let me connect you with one of our specialists..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Message shown when transferring to a human agent
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max AI Messages
                            </label>
                            <input
                              type="number"
                              value={config.max_ai_messages}
                              onChange={(e) => setConfig({ ...config, max_ai_messages: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              min="1"
                              max="50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Force handover after this many AI responses</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Timeout (minutes)
                            </label>
                            <input
                              type="number"
                              value={config.handover_timeout_minutes}
                              onChange={(e) => setConfig({ ...config, handover_timeout_minutes: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              min="1"
                              max="60"
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-handover if unresolved after X minutes</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* UX Features Tab */}
            {activeTab === 'ux' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">UX Enhancements</h3>

                {/* Chat Experience */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Chat Experience</h4>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Show typing indicator</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_typing_indicator}
                        onChange={(e) => setConfig({ ...config, enable_typing_indicator: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Show read receipts</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_read_receipts}
                        onChange={(e) => setConfig({ ...config, enable_read_receipts: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Smile className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Enable emoji picker</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_emoji}
                        onChange={(e) => setConfig({ ...config, enable_emoji: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Enable file upload</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_file_upload}
                        onChange={(e) => setConfig({ ...config, enable_file_upload: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Quick Replies */}
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Quick Replies</h4>
                      <p className="text-sm text-gray-600">Suggested responses for faster interaction</p>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enable_quick_replies}
                        onChange={(e) => setConfig({ ...config, enable_quick_replies: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                  {config.enable_quick_replies && (
                    <div>
                      <button
                        onClick={addQuickReply}
                        className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 mb-3"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Reply</span>
                      </button>
                      <div className="space-y-2">
                        {config.quick_replies.map((reply, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={reply}
                              onChange={(e) => updateQuickReply(index, e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              placeholder="Quick reply text"
                            />
                            <button
                              onClick={() => removeQuickReply(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Post-Chat Features */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Post-Chat Features</h4>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Star className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Enable chat rating</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_rating}
                        onChange={(e) => setConfig({ ...config, enable_rating: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Smile className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Satisfaction survey</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_satisfaction_survey}
                        onChange={(e) => setConfig({ ...config, enable_satisfaction_survey: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Download className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Enable chat transcript</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_chat_transcript}
                        onChange={(e) => setConfig({ ...config, enable_chat_transcript: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Show chat history</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.show_chat_history}
                        onChange={(e) => setConfig({ ...config, show_chat_history: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>

                {/* AI Features */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">AI-Powered Features</h4>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">PRO</span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">AI suggestions for agents</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_ai_suggestions}
                        onChange={(e) => setConfig({ ...config, enable_ai_suggestions: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Smart reply suggestions</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_smart_replies}
                        onChange={(e) => setConfig({ ...config, enable_smart_replies: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smile className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Sentiment analysis</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.enable_sentiment_analysis}
                        onChange={(e) => setConfig({ ...config, enable_sentiment_analysis: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Analytics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Analytics & Tracking</h4>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Track visitor information</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.track_visitor_info}
                        onChange={(e) => setConfig({ ...config, track_visitor_info: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <Eye className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Track page views</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.track_page_views}
                        onChange={(e) => setConfig({ ...config, track_page_views: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <LinkIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Track referrer source</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.track_referrer}
                        onChange={(e) => setConfig({ ...config, track_referrer: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Embed Code Tab */}
            {activeTab === 'embed' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Embed Code</h3>
                  <p className="text-sm text-gray-600">Copy this code and paste it before the closing <code className="px-1 py-0.5 bg-gray-100 rounded">&lt;/body&gt;</code> tag of your website.</p>
                </div>

                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
                    <code>{generateEmbedCode()}</code>
                  </pre>
                  <button
                    onClick={copyEmbedCode}
                    className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Code className="w-5 h-5 text-blue-600 mt-0.5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Installation Instructions</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Copy the embed code above</li>
                        <li>Open your website's HTML file or template</li>
                        <li>Paste the code right before the closing <code>&lt;/body&gt;</code> tag</li>
                        <li>Save and publish your website</li>
                        <li>The chat widget will appear automatically!</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/chat-widget.js"
                    target="_blank"
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">View Widget Script</h4>
                      <p className="text-sm text-gray-600">Check the widget JavaScript file</p>
                    </div>
                    <Code className="w-5 h-5 text-gray-400" />
                  </a>
                  <a
                    href="/widget-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">Test Widget (Live Demo)</h4>
                      <p className="text-sm text-gray-600">Opens in new tab with live updates</p>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Live Widget Preview</h2>
                  <p className="text-sm text-gray-600">See how your widget looks in real-time</p>
                </div>
                {config.enable_pre_chat_form && (
                  <button
                    onClick={() => setShowPreChatForm(!showPreChatForm)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {showPreChatForm ? 'Show Chat View' : 'Show Pre-Chat Form'}
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setPreviewOpen(false);
                  setShowPreChatForm(true); // Reset to show form on next open
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Simulated Website */}
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Website</h1>
                <p className="text-gray-600 mb-4">
                  This is a simulation of how the chat widget will appear on your website.
                  The widget will appear in the {config.position.split('-').join(' ')} corner.
                </p>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <p>Your website content here</p>
                </div>
              </div>

              {/* Chat Widget Preview */}
              <div
                className={`fixed ${
                  config.position === 'bottom-right' ? 'bottom-6 right-6' :
                  config.position === 'bottom-left' ? 'bottom-6 left-6' :
                  config.position === 'top-right' ? 'top-20 right-6' :
                  'top-20 left-6'
                } z-50`}
                style={{
                  position: 'fixed',
                  ...(config.position === 'bottom-right' ? { bottom: '24px', right: '24px' } :
                      config.position === 'bottom-left' ? { bottom: '24px', left: '24px' } :
                      config.position === 'top-right' ? { top: '80px', right: '24px' } :
                      { top: '80px', left: '24px' })
                }}
              >
                {/* Chat Bubble (Closed State) */}
                <div className="flex flex-col items-end space-y-3">
                  {/* Proactive Message */}
                  {config.enable_proactive_chat && (
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs animate-fade-in">
                      <p className="text-sm text-gray-900">{config.proactive_message}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                        <span>{config.company_name}</span>
                      </div>
                    </div>
                  )}

                  {/* Chat Button */}
                  <button
                    className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <MessageSquare className="w-8 h-8 text-white" />
                    {config.show_unread_count && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        3
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Chat Widget */}
              <div
                className={`fixed ${
                  config.position === 'bottom-right' ? 'bottom-6 right-6' :
                  config.position === 'bottom-left' ? 'bottom-6 left-6' :
                  config.position === 'top-right' ? 'top-20 right-6' :
                  'top-20 left-6'
                } z-50`}
                style={{
                  position: 'fixed',
                  ...(config.position === 'bottom-right' ? { bottom: '100px', right: '24px' } :
                      config.position === 'bottom-left' ? { bottom: '100px', left: '24px' } :
                      config.position === 'top-right' ? { top: '150px', right: '24px' } :
                      { top: '150px', left: '24px' })
                }}
              >
                <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-4 text-white flex items-center justify-between"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <div className="flex items-center space-x-3">
                      {config.show_agent_avatar && (
                        <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        {config.show_agent_name && (
                          <div className="font-semibold">{config.team_name || 'Support Team'}</div>
                        )}
                        <div className="text-xs opacity-90">{config.company_name}</div>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  {/* Messages Area / Pre-Chat Form */}
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    {/* Pre-Chat Form */}
                    {config.enable_pre_chat_form && showPreChatForm ? (
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h3 className="font-semibold text-gray-900 text-lg">Welcome! 👋</h3>
                          <p className="text-sm text-gray-600 mt-1">Please fill in your details to start chatting</p>
                        </div>

                        {/* Name Field */}
                        {config.require_name && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name {config.require_name && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                              style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                              placeholder="Enter your name"
                              readOnly
                            />
                          </div>
                        )}

                        {/* Email Field */}
                        {config.require_email && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email {config.require_email && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="email"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                              style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                              placeholder="Enter your email"
                              readOnly
                            />
                          </div>
                        )}

                        {/* Custom Fields */}
                        {config.pre_chat_fields.slice(0, 3).map((field) => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                                placeholder={field.placeholder || ''}
                                rows={3}
                                readOnly
                              />
                            ) : field.type === 'select' ? (
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                                disabled
                              >
                                <option>{field.placeholder || 'Select an option'}</option>
                                {field.options?.map((option, idx) => (
                                  <option key={idx}>{option}</option>
                                ))}
                              </select>
                            ) : field.type === 'checkbox' ? (
                              <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded" disabled />
                                <span className="text-sm text-gray-700">{field.placeholder || field.label}</span>
                              </label>
                            ) : (
                              <input
                                type={field.type}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                                placeholder={field.placeholder || ''}
                                readOnly
                              />
                            )}
                          </div>
                        ))}

                        <button
                          onClick={() => setShowPreChatForm(false)}
                          className="w-full py-3 text-white rounded-lg font-medium hover:opacity-90"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          Start Chat
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Greeting Message */}
                        <div className="flex items-start space-x-2 mb-4">
                          {config.show_agent_avatar && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
                              style={{ backgroundColor: config.primary_color }}
                            >
                              AI
                            </div>
                          )}
                          <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                            <p className="text-sm text-gray-900">{config.greeting_message}</p>
                            {config.enable_read_receipts && (
                              <div className="flex justify-end mt-1">
                                <Check className="w-3 h-3 text-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>

                    {/* Typing Indicator */}
                    {config.enable_typing_indicator && (
                      <div className="flex items-start space-x-2 mb-4">
                        {config.show_agent_avatar && (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            AI
                          </div>
                        )}
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Replies */}
                    {config.enable_quick_replies && config.quick_replies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {config.quick_replies.slice(0, 3).map((reply, index) => (
                          <button
                            key={index}
                            className="px-3 py-1.5 text-sm rounded-full border-2 hover:bg-gray-50 transition-colors"
                            style={{ borderColor: config.primary_color, color: config.primary_color }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Product Showcase */}
                    {config.enable_product_showcase && config.showcase_products.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {config.showcase_products.slice(0, 2).map((product, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                            <div className="font-medium text-sm text-gray-900">{product.name}</div>
                            {product.price && (
                              <div className="text-lg font-bold mt-1" style={{ color: config.primary_color }}>
                                {product.price}
                              </div>
                            )}
                            <button
                              className="mt-2 w-full py-1.5 text-sm text-white rounded-lg hover:opacity-90"
                              style={{ backgroundColor: config.primary_color }}
                            >
                              View Product
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                      </>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder={config.placeholder_text}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                        readOnly
                      />
                      <div className="flex space-x-1">
                        {config.enable_emoji && (
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Smile className="w-5 h-5" />
                          </button>
                        )}
                        {config.enable_file_upload && (
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          className="p-2 rounded-lg text-white"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Rating */}
                    {config.enable_rating && (
                      <div className="mt-3 flex items-center justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} className="text-yellow-400 hover:text-yellow-500">
                            <Star className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">💡 Tip:</span> Changes are reflected in real-time. Save to apply to your website.
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
