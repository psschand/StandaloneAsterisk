import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Brain,
  MessageSquare,
  Target,
  BookOpen,
  Save,
  X,
  Check,
  Play,
  Pause,
  Clock,
  TrendingUp,
  CheckCircle,
  Sparkles,
  FileText,
  Loader,
  Sliders,
  Globe,
  Lightbulb,
} from 'lucide-react';

interface AIAgent {
  id?: number;
  name: string;
  description: string;
  type: 'chat' | 'voice' | 'email' | 'multi-channel';
  status: 'active' | 'inactive' | 'training';
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'custom';
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  knowledge_base_ids: number[];
  enabled_capabilities: string[];
  
  // Behavior Settings
  fallback_to_human: boolean;
  confidence_threshold: number;
  response_style: 'professional' | 'friendly' | 'casual' | 'technical';
  language: string;
  
  // Integration
  channels: string[];
  triggers: string[];
  working_hours?: {
    enabled: boolean;
    schedule: { [key: string]: { start: string; end: string } };
  };
  
  // Statistics
  total_conversations?: number;
  success_rate?: number;
  avg_response_time?: number;
  last_trained?: string;
  
  created_at?: string;
  updated_at?: string;
}

interface KnowledgeBase {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'inactive';
  documents_count: number;
  last_updated: string;
}

const capabilities = [
  { id: 'faq', name: 'FAQ Answering', icon: MessageSquare, color: 'blue' },
  { id: 'appointment', name: 'Appointment Booking', icon: Clock, color: 'green' },
  { id: 'lead_qualification', name: 'Lead Qualification', icon: Target, color: 'purple' },
  { id: 'product_recommendation', name: 'Product Recommendations', icon: Sparkles, color: 'pink' },
  { id: 'ticket_creation', name: 'Ticket Creation', icon: FileText, color: 'amber' },
  { id: 'order_status', name: 'Order Status', icon: TrendingUp, color: 'indigo' },
  { id: 'sentiment_analysis', name: 'Sentiment Analysis', icon: Brain, color: 'purple' },
  { id: 'multilingual', name: 'Multilingual Support', icon: Globe, color: 'teal' },
];

const models = [
  { value: 'gpt-4', label: 'GPT-4 (Most Capable)', description: 'Best for complex tasks, $$$' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast)', description: 'Good balance, $$' },
  { value: 'claude-3', label: 'Claude 3 (Smart)', description: 'Excellent reasoning, $$' },
  { value: 'custom', label: 'Custom Model', description: 'Your own fine-tuned model, $' },
];

const responseStyles = [
  { value: 'professional', label: 'Professional', emoji: '👔', description: 'Formal business tone' },
  { value: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', emoji: '👋', description: 'Relaxed conversational' },
  { value: 'technical', label: 'Technical', emoji: '🔧', description: 'Detailed and precise' },
];

export default function AIAgentManager() {
  const { accessToken } = useAuthStore();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<AIAgent>({
    name: '',
    description: '',
    type: 'chat',
    status: 'inactive',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 500,
    system_prompt: 'You are a helpful AI assistant for customer support.',
    knowledge_base_ids: [],
    enabled_capabilities: [],
    fallback_to_human: true,
    confidence_threshold: 0.75,
    response_style: 'friendly',
    language: 'en',
    channels: ['chat'],
    triggers: ['greeting', 'faq'],
  });

  useEffect(() => {
    loadAgents();
    loadKnowledgeBases();
  }, []);

  const loadAgents = async () => {
    try {
      // Mock data for now - replace with actual API
      const mockAgents: AIAgent[] = [
        {
          id: 1,
          name: 'Customer Support Bot',
          description: 'Handles common customer inquiries and FAQs',
          type: 'chat',
          status: 'active',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 500,
          system_prompt: 'You are a helpful customer support assistant.',
          knowledge_base_ids: [1, 2],
          enabled_capabilities: ['faq', 'ticket_creation', 'sentiment_analysis'],
          fallback_to_human: true,
          confidence_threshold: 0.75,
          response_style: 'friendly',
          language: 'en',
          channels: ['chat', 'email'],
          triggers: ['greeting', 'faq'],
          total_conversations: 1247,
          success_rate: 87.5,
          avg_response_time: 1.2,
          last_trained: '2024-10-15',
          created_at: '2024-09-01',
        },
        {
          id: 2,
          name: 'Sales Assistant',
          description: 'Qualifies leads and schedules demos',
          type: 'multi-channel',
          status: 'active',
          model: 'gpt-4',
          temperature: 0.8,
          max_tokens: 600,
          system_prompt: 'You are a friendly sales assistant.',
          knowledge_base_ids: [3],
          enabled_capabilities: ['lead_qualification', 'appointment', 'product_recommendation'],
          fallback_to_human: true,
          confidence_threshold: 0.80,
          response_style: 'professional',
          language: 'en',
          channels: ['chat', 'voice', 'email'],
          triggers: ['pricing', 'demo', 'features'],
          total_conversations: 582,
          success_rate: 92.3,
          avg_response_time: 1.5,
          last_trained: '2024-10-20',
          created_at: '2024-09-15',
        },
      ];
      setAgents(mockAgents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load agents:', error);
      setLoading(false);
    }
  };

  const loadKnowledgeBases = async () => {
    try {
      const response = await axios.get('/api/v1/admin/knowledge-base', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setKnowledgeBases(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      // Mock data
      setKnowledgeBases([
        {
          id: 1,
          title: 'Product Documentation',
          description: 'Complete product documentation and guides',
          category: 'Product',
          status: 'active',
          documents_count: 45,
          last_updated: '2024-10-25',
        },
        {
          id: 2,
          title: 'Common FAQs',
          description: 'Frequently asked questions and answers',
          category: 'Support',
          status: 'active',
          documents_count: 120,
          last_updated: '2024-10-28',
        },
        {
          id: 3,
          title: 'Sales Playbook',
          description: 'Sales strategies and objection handling',
          category: 'Sales',
          status: 'active',
          documents_count: 28,
          last_updated: '2024-10-20',
        },
      ]);
    }
  };

  const handleCreateAgent = () => {
    setFormData({
      name: '',
      description: '',
      type: 'chat',
      status: 'inactive',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 500,
      system_prompt: 'You are a helpful AI assistant for customer support. Answer questions accurately and professionally.',
      knowledge_base_ids: [],
      enabled_capabilities: [],
      fallback_to_human: true,
      confidence_threshold: 0.75,
      response_style: 'friendly',
      language: 'en',
      channels: ['chat'],
      triggers: [],
    });
    setSelectedAgent(null);
    setIsModalOpen(true);
  };

  const handleEditAgent = (agent: AIAgent) => {
    setFormData(agent);
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleSaveAgent = async () => {
    setSaving(true);
    try {
      // Mock save - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (selectedAgent) {
        setAgents(agents.map(a => a.id === selectedAgent.id ? { ...formData, id: selectedAgent.id } : a));
      } else {
        setAgents([...agents, { ...formData, id: Date.now() }]);
      }
      
      setIsModalOpen(false);
      alert('Agent saved successfully!');
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      setAgents(agents.filter(a => a.id !== agentId));
      alert('Agent deleted successfully!');
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to delete agent');
    }
  };

  const handleToggleStatus = async (agent: AIAgent) => {
    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      setAgents(agents.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
    }
  };

  const toggleCapability = (capId: string) => {
    const caps = formData.enabled_capabilities.includes(capId)
      ? formData.enabled_capabilities.filter(c => c !== capId)
      : [...formData.enabled_capabilities, capId];
    setFormData({ ...formData, enabled_capabilities: caps });
  };

  const toggleKnowledgeBase = (kbId: number) => {
    const kbs = formData.knowledge_base_ids.includes(kbId)
      ? formData.knowledge_base_ids.filter(k => k !== kbId)
      : [...formData.knowledge_base_ids, kbId];
    setFormData({ ...formData, knowledge_base_ids: kbs });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <span>AI Agent Manager</span>
          </h1>
          <p className="text-gray-600 mt-1">Create and configure AI-powered conversational agents</p>
        </div>
        <button
          onClick={handleCreateAgent}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          <span>Create Agent</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Bot className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{agents.length}</span>
          </div>
          <p className="text-purple-100">Total Agents</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">{agents.filter(a => a.status === 'active').length}</span>
          </div>
          <p className="text-green-100">Active Agents</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + (a.total_conversations || 0), 0)}
            </span>
          </div>
          <p className="text-blue-100">Total Conversations</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-2xl font-bold">
              {(agents.reduce((sum, a) => sum + (a.success_rate || 0), 0) / agents.length).toFixed(1)}%
            </span>
          </div>
          <p className="text-amber-100">Avg Success Rate</p>
        </div>
      </div>

      {/* Agents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your AI Agents</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and monitor your AI agents</p>
        </div>

        {agents.length === 0 ? (
          <div className="p-12 text-center">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Agents Yet</h3>
            <p className="text-gray-600 mb-6">Create your first AI agent to automate customer interactions</p>
            <button
              onClick={handleCreateAgent}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Agent</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {agents.map((agent) => (
              <div key={agent.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      agent.status === 'active' ? 'bg-green-100' : 
                      agent.status === 'training' ? 'bg-yellow-100' : 
                      'bg-gray-100'
                    }`}>
                      <Bot className={`w-6 h-6 ${
                        agent.status === 'active' ? 'text-green-600' : 
                        agent.status === 'training' ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          agent.status === 'active' ? 'bg-green-100 text-green-700' :
                          agent.status === 'training' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {agent.model}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{agent.description}</p>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{agent.total_conversations || 0} conversations</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{agent.success_rate || 0}% success rate</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{agent.avg_response_time || 0}s response</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{agent.knowledge_base_ids.length} KB linked</span>
                        </div>
                      </div>
                      
                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-2">
                        {agent.enabled_capabilities.slice(0, 3).map((capId) => {
                          const cap = capabilities.find(c => c.id === capId);
                          if (!cap) return null;
                          const Icon = cap.icon;
                          return (
                            <span
                              key={capId}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              <Icon className="w-3 h-3" />
                              <span>{cap.name}</span>
                            </span>
                          );
                        })}
                        {agent.enabled_capabilities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{agent.enabled_capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(agent)}
                      className={`p-2 rounded-lg transition-colors ${
                        agent.status === 'active'
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={agent.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditAgent(agent)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      title="Edit Agent"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id!)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Delete Agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedAgent ? 'Edit AI Agent' : 'Create New AI Agent'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agent Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Customer Support Bot"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agent Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="chat">Chat Only</option>
                        <option value="voice">Voice Only</option>
                        <option value="email">Email Only</option>
                        <option value="multi-channel">Multi-Channel</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="What does this agent do?"
                    />
                  </div>
                </div>

                {/* Model Configuration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-purple-600" />
                    <span>Model Configuration</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Model
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {models.map((model) => (
                          <button
                            key={model.value}
                            onClick={() => setFormData({ ...formData, model: model.value as any })}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              formData.model === model.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{model.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{model.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Precise</span>
                          <span>Creative</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          value={formData.max_tokens}
                          onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          min="100"
                          max="4000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Response length limit</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {responseStyles.map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setFormData({ ...formData, response_style: style.value as any })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              formData.response_style === style.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-1">{style.emoji}</div>
                            <div className="font-medium text-sm text-gray-900">{style.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{style.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>System Prompt</span>
                  </h3>
                  <textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="Define the agent's personality, role, and instructions..."
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    <Lightbulb className="w-4 h-4 inline mr-1" />
                    Tip: Be specific about the agent's role, tone, and how to handle different scenarios.
                  </p>
                </div>

                {/* Capabilities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Capabilities</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {capabilities.map((cap) => {
                      const Icon = cap.icon;
                      const isEnabled = formData.enabled_capabilities.includes(cap.id);
                      return (
                        <button
                          key={cap.id}
                          onClick={() => toggleCapability(cap.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isEnabled
                              ? `border-${cap.color}-500 bg-${cap.color}-50`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-5 h-5 ${isEnabled ? `text-${cap.color}-600` : 'text-gray-400'}`} />
                            <span className="font-medium text-gray-900">{cap.name}</span>
                            {isEnabled && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Knowledge Base */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    <span>Knowledge Base</span>
                  </h3>
                  <div className="space-y-2">
                    {knowledgeBases.map((kb) => {
                      const isLinked = formData.knowledge_base_ids.includes(kb.id);
                      return (
                        <button
                          key={kb.id}
                          onClick={() => toggleKnowledgeBase(kb.id)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isLinked
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">{kb.title}</span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  {kb.documents_count} docs
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{kb.description}</p>
                            </div>
                            {isLinked && <Check className="w-5 h-5 text-purple-600 ml-3" />}
                          </div>
                        </button>
                      );
                    })}
                    {knowledgeBases.length === 0 && (
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600">No knowledge bases available</p>
                        <a
                          href="/admin/knowledge-base"
                          className="text-purple-600 hover:text-purple-700 text-sm mt-2 inline-block"
                        >
                          Create a knowledge base →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Behavior Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <span>Behavior Settings</span>
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Fallback to Human Agent</div>
                        <div className="text-sm text-gray-600">Transfer to human when confidence is low</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.fallback_to_human}
                        onChange={(e) => setFormData({ ...formData, fallback_to_human: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confidence Threshold: {(formData.confidence_threshold * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="0.95"
                        step="0.05"
                        value={formData.confidence_threshold}
                        onChange={(e) => setFormData({ ...formData, confidence_threshold: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum confidence to respond without human assistance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAgent}
                disabled={saving || !formData.name.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
