import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import {
  MessageSquare,
  Check,
  Smile,
  Image as ImageIcon,
  Star,
  X,
  Users,
  Send,
} from 'lucide-react';

interface WidgetConfig {
  primary_color: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  greeting_message: string;
  placeholder_text: string;
  team_name: string;
  show_agent_avatar: boolean;
  show_agent_name: boolean;
  company_name: string;
  enable_pre_chat_form: boolean;
  pre_chat_fields: any[];
  require_email: boolean;
  require_name: boolean;
  enable_proactive_chat: boolean;
  proactive_delay: number;
  proactive_message: string;
  show_unread_count: boolean;
  enable_typing_indicator: boolean;
  enable_read_receipts: boolean;
  enable_emoji: boolean;
  enable_file_upload: boolean;
  enable_quick_replies: boolean;
  quick_replies: string[];
  enable_rating: boolean;
  enable_product_showcase: boolean;
  showcase_products: any[];
}

export default function WidgetDemoPage() {
  const { accessToken } = useAuthStore();
  const [config, setConfig] = useState<WidgetConfig>({
    primary_color: '#4f46e5',
    position: 'bottom-right',
    greeting_message: 'Hi! How can we help you today?',
    placeholder_text: 'Type your message...',
    team_name: 'Support Team',
    show_agent_avatar: true,
    show_agent_name: true,
    company_name: 'Your Company',
    enable_pre_chat_form: false,
    pre_chat_fields: [],
    require_email: false,
    require_name: true,
    enable_proactive_chat: false,
    proactive_delay: 10,
    proactive_message: 'Need help? We\'re here to assist you!',
    show_unread_count: true,
    enable_typing_indicator: true,
    enable_read_receipts: true,
    enable_emoji: true,
    enable_file_upload: true,
    enable_quick_replies: false,
    quick_replies: [],
    enable_rating: true,
    enable_product_showcase: false,
    showcase_products: [],
  });

  const [isOpen, setIsOpen] = useState(false);
  const [showPreChatForm, setShowPreChatForm] = useState(true);
  const [showProactive, setShowProactive] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [agentAssigned, setAgentAssigned] = useState(false);

  // Load widget configuration
  useEffect(() => {
    loadWidget();
  }, []);

  // Auto-refresh config every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadWidget();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle pre-chat form state based on config
  useEffect(() => {
    if (isOpen) {
      if (!config.enable_pre_chat_form) {
        // Pre-chat form disabled - always skip form
        if (showPreChatForm || messages.length === 0) {
          setShowPreChatForm(false);
          if (messages.length === 0) {
            setMessages([{
              id: 1,
              type: 'bot',
              text: config.greeting_message,
              timestamp: new Date(),
            }]);
          }
        }
      } else if (config.enable_pre_chat_form && messages.length === 0) {
        // Pre-chat form enabled - ensure form is shown for new chats
        setShowPreChatForm(true);
      }
    }
  }, [config.enable_pre_chat_form, isOpen]);
  
  // Show proactive message after delay
  useEffect(() => {
    if (config.enable_proactive_chat && !isOpen) {
      const timer = setTimeout(() => {
        setShowProactive(true);
      }, config.proactive_delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [config.enable_proactive_chat, config.proactive_delay, isOpen]);

  const loadWidget = async () => {
    try {
      const response = await axios.get('/api/v1/chat/widgets/1', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.success) {
        setConfig({ ...config, ...response.data.data });
      }
    } catch (error) {
      console.error('Failed to load widget:', error);
    }
  };

  const handleOpenWidget = () => {
    setIsOpen(true);
    setShowProactive(false);
    
    if (!config.enable_pre_chat_form) {
      // Pre-chat form disabled - start chat immediately
      setShowPreChatForm(false);
      setMessages([{
        id: 1,
        type: 'bot',
        text: config.greeting_message,
        timestamp: new Date(),
      }]);
    } else {
      // Pre-chat form enabled - show form first
      setShowPreChatForm(true);
      setMessages([]);
    }
  };

  const handleStartChat = async () => {
    setShowPreChatForm(false);
    
    // Start a real chat session with the backend
    try {
      const response = await axios.post('/api/v1/chat/public/start', {
        tenant_id: 'demo-tenant',
        channel: 'web-widget',
        customer_name: 'Demo User',
        customer_email: 'demo@example.com',
      });

      if (response.data.success) {
        const { session_id, message } = response.data.data;
        setSessionKey(session_id);
        
        setMessages([{
          id: 1,
          type: 'bot',
          text: message || config.greeting_message,
          sender_name: 'AI Assistant',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Failed to start chat session:', error);
      // Fallback to greeting message
      setMessages([{
        id: 1,
        type: 'bot',
        text: config.greeting_message,
        sender_name: 'AI Assistant',
        timestamp: new Date(),
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      text: userMessage,
      sender_name: 'You',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    setIsTyping(true);

    // If no session, start one first
    if (!sessionKey) {
      await handleStartChat();
      // Wait a bit for session to be created
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // Send message to backend AI
      const response = await axios.post('/api/v1/chat/public/message', {
        session_id: sessionKey,
        message: userMessage,
      });

      setIsTyping(false);

      if (response.data.success) {
        const aiResponse = response.data.data;
        
        // Check if agent was assigned or handover triggered
        if (aiResponse.is_agent || aiResponse.status === 'agent_assigned') {
          setAgentAssigned(true);
        }

        // Check if handover is recommended
        if (aiResponse.action === 'handoff') {
          setAgentAssigned(true);
        }

        setMessages(prev => [...prev, {
          id: prev.length + 1,
          type: aiResponse.is_agent ? 'agent' : 'bot',
          text: aiResponse.content,
          sender_name: aiResponse.sender_name || 'AI Assistant',
          timestamp: new Date(aiResponse.timestamp),
          confidence: aiResponse.confidence,
          intent: aiResponse.intent,
          sentiment: aiResponse.sentiment,
        }]);
      }
    } catch (error: any) {
      setIsTyping(false);
      console.error('Failed to send message:', error);
      
      // Show error message to user
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again or contact support.',
        sender_name: 'System',
        timestamp: new Date(),
        error: error.response?.data?.error?.message || error.message,
      }]);
    }
  };

  const positionClass = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }[config.position];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Demo Page Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Widget Demo Page</h1>
          <p className="text-xl text-gray-600 mb-6">
            This is a live demo page that shows your chat widget configuration in real-time.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">🔄 Live Updates Enabled</h2>
            <p className="text-blue-800 text-sm">
              Any changes you make in the Widget Designer will automatically appear here within 2 seconds.
              Try changing colors, messages, or enabling features!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Current Configuration</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Company:</dt>
                  <dd className="font-medium text-gray-900">{config.company_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Position:</dt>
                  <dd className="font-medium text-gray-900 capitalize">{config.position.replace('-', ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Primary Color:</dt>
                  <dd className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: config.primary_color }}></div>
                    <span className="font-medium text-gray-900">{config.primary_color}</span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Pre-Chat Form:</dt>
                  <dd className="font-medium text-gray-900">{config.enable_pre_chat_form ? 'Enabled' : 'Disabled'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Features Enabled</h3>
              <div className="space-y-2 text-sm">
                {config.enable_proactive_chat && <div className="flex items-center space-x-2 text-green-600"><Check className="w-4 h-4" /> <span>Proactive Chat</span></div>}
                {config.enable_typing_indicator && <div className="flex items-center space-x-2 text-green-600"><Check className="w-4 h-4" /> <span>Typing Indicator</span></div>}
                {config.enable_emoji && <div className="flex items-center space-x-2 text-green-600"><Check className="w-4 h-4" /> <span>Emoji Picker</span></div>}
                {config.enable_file_upload && <div className="flex items-center space-x-2 text-green-600"><Check className="w-4 h-4" /> <span>File Upload</span></div>}
                {config.enable_quick_replies && <div className="flex items-center space-x-2 text-green-600"><Check className="w-4 h-4" /> <span>Quick Replies</span></div>}
                {config.enable_rating && <div className="flex items-center space-x-2 text-green-600"><Check className="w-4 h-4" /> <span>Chat Rating</span></div>}
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2>About This Demo</h2>
            <p>
              This page simulates a real website with the chat widget embedded. The widget behavior, styling,
              and features match exactly what your customers will see on your website.
            </p>
            <ul>
              <li>Click the chat button in the {config.position.replace('-', ' ')} corner to open the widget</li>
              <li>Test the pre-chat form (if enabled)</li>
              <li>Send messages to see the interaction flow</li>
              <li>Try the features you've enabled (emoji, file upload, quick replies)</li>
            </ul>
          </div>
        </div>

        {/* Additional demo content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Feature 1</h3>
            <p className="text-gray-600 text-sm">Sample website content to demonstrate the chat widget placement.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Feature 2</h3>
            <p className="text-gray-600 text-sm">The widget will appear on top of your content without blocking it.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Feature 3</h3>
            <p className="text-gray-600 text-sm">Test responsiveness by resizing your browser window.</p>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <div className={`fixed ${positionClass} z-50`}>
        {/* Proactive Message */}
        {showProactive && !isOpen && (
          <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-xl p-4 max-w-xs mb-3 animate-fade-in">
            <button
              onClick={() => setShowProactive(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm text-gray-900 pr-6">{config.proactive_message}</p>
            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: config.primary_color }}></div>
              <span>{config.company_name}</span>
            </div>
          </div>
        )}

        {/* Chat Button */}
        {!isOpen && (
          <button
            onClick={handleOpenWidget}
            className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center transform transition-all hover:scale-110 relative"
            style={{ backgroundColor: config.primary_color }}
          >
            <MessageSquare className="w-8 h-8 text-white" />
            {config.show_unread_count && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            )}
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden">
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
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowPreChatForm(true);
                  setMessages([]);
                  setSessionKey(null);
                  setAgentAssigned(false);
                  setIsTyping(false);
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {config.enable_pre_chat_form && showPreChatForm ? (
                <div className="p-4 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Welcome! 👋</h3>
                    <p className="text-sm text-gray-600 mt-1">Please fill in your details to start chatting</p>
                  </div>

                  {config.require_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                        placeholder="Enter your name"
                      />
                    </div>
                  )}

                  {config.require_email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                        placeholder="Enter your email"
                      />
                    </div>
                  )}

                  {config.pre_chat_fields.slice(0, 3).map((field: any) => (
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
                        />
                      ) : field.type === 'select' ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                          style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                        >
                          <option>{field.placeholder || 'Select an option'}</option>
                          {field.options?.map((option: string, idx: number) => (
                            <option key={idx}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                          style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
                          placeholder={field.placeholder || ''}
                        />
                      )}
                    </div>
                  ))}

                  <button
                    onClick={handleStartChat}
                    className="w-full py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    Start Chat
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  {/* Agent Handover Notice */}
                  {agentAssigned && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 text-center">
                        🙋 Connected to human agent
                      </p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                      {(msg.type === 'bot' || msg.type === 'agent') && config.show_agent_avatar && (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0"
                          style={{ backgroundColor: msg.type === 'agent' ? '#10b981' : config.primary_color }}
                        >
                          {msg.type === 'agent' ? '👤' : '🤖'}
                        </div>
                      )}
                      <div className="flex flex-col max-w-xs">
                        {config.show_agent_name && msg.sender_name && (
                          <span className="text-xs text-gray-500 mb-1 px-1">
                            {msg.sender_name}
                          </span>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            msg.type === 'user'
                              ? 'text-white'
                              : 'bg-white shadow-sm'
                          }`}
                          style={msg.type === 'user' ? { backgroundColor: config.primary_color } : {}}
                        >
                          <p className={`text-sm whitespace-pre-wrap ${msg.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {msg.text}
                          </p>
                          {msg.confidence && (
                            <p className="text-xs text-gray-400 mt-1">
                              Confidence: {(msg.confidence * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && config.enable_typing_indicator && (
                    <div className="flex justify-start mb-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        🤖
                      </div>
                      <div className="bg-white shadow-sm rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {config.enable_quick_replies && config.quick_replies.length > 0 && messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {config.quick_replies.slice(0, 3).map((reply: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setInputValue(reply)}
                          className="px-3 py-1.5 text-sm rounded-full border-2 hover:bg-gray-50 transition-colors"
                          style={{ borderColor: config.primary_color, color: config.primary_color }}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {config.enable_product_showcase && config.showcase_products.length > 0 && messages.length === 1 && (
                    <div className="space-y-2 mt-4">
                      {config.showcase_products.slice(0, 2).map((product: any, index: number) => (
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
                </div>
              )}
            </div>

            {/* Input Area */}
            {!showPreChatForm && (
              <div className="p-4 bg-white border-t border-gray-200">
                {/* Session Info (for testing) */}
                {sessionKey && (
                  <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    Session: {sessionKey.substring(0, 20)}...
                    {agentAssigned && <span className="ml-2 text-green-600">● Agent Connected</span>}
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                    placeholder={config.placeholder_text}
                    disabled={isTyping}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100"
                    style={{ '--tw-ring-color': config.primary_color } as React.CSSProperties}
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
                      onClick={handleSendMessage}
                      className="p-2 rounded-lg text-white"
                      style={{ backgroundColor: config.primary_color }}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {config.enable_rating && messages.length > 2 && (
                  <div className="flex items-center justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="text-yellow-400 hover:text-yellow-500">
                        <Star className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
