
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import {
  MessageSquare,
  User,
  Clock,
  Search,
  Send,
  Bot,
  UserCircle,
  Mail,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Use empty string to make relative API calls through nginx proxy
// When concatenating, this will produce absolute paths like /api/v1/...
const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to ensure absolute path
const getApiUrl = (path: string) => {
  if (API_URL) return `${API_URL}${path}`;
  return path; // Already starts with /api/
};

interface ChatSession {
  id: number;
  session_key: string;
  status: string;
  visitor_name: string | null;
  visitor_email: string | null;
  message_count?: number;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: 'visitor' | 'bot' | 'agent';
  sender_id?: number;
  sender_name: string;
  message_type: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const ChatPage: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const selectedSessionRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wsConnected, setWsConnected] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Fetch all chat sessions
  const fetchSessions = useCallback(async () => {
    console.log('🔍 Fetching sessions...');
    try {
      const response = await axios.get(getApiUrl('/api/v1/chat/sessions'), {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page: 1, page_size: 50 },
      });
      
      console.log('📋 Sessions response:', response.data);
      
      if (response.data.success) {
        // Handle both paginated and non-paginated responses
        let sessionsList = [];
        if (Array.isArray(response.data.data)) {
          // Direct array response
          sessionsList = response.data.data;
        } else if (response.data.data?.items) {
          // Paginated response with items
          sessionsList = response.data.data.items;
        }
        console.log(`✅ Loaded ${sessionsList.length} sessions:`, sessionsList);
        
        // Debug: Log session statuses
        const statusCounts = sessionsList.reduce((acc: any, s: any) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Session statuses:', statusCounts);
        console.log('🔍 Unassigned sessions:', sessionsList.filter((s: any) => !s.assigned_to_id));
        
        // Debug: Log sessions with messages
        const withMessages = sessionsList.filter((s: any) => s.message_count && s.message_count > 0);
        console.log(`💬 Sessions with messages (${withMessages.length}):`, withMessages.map((s: any) => ({
          id: s.id,
          message_count: s.message_count,
          assigned_to_id: s.assigned_to_id,
          assigned_to_id_type: typeof s.assigned_to_id,
          should_show_indicator: !s.assigned_to_id,
          visitor: s.visitor_name
        })));
        
        // Debug: Check first unassigned session with messages
        const firstUnassignedWithMsg = withMessages.find((s: any) => !s.assigned_to_id);
        if (firstUnassignedWithMsg) {
          console.log('🔍 First unassigned session with messages:', firstUnassignedWithMsg);
        }
        
        setSessions(sessionsList);
      } else {
        console.error('❌ Sessions fetch failed:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Fetch messages for a session
  const fetchMessages = useCallback(async (sessionId: number) => {
    console.log(`📨 Fetching messages for session ${sessionId}...`);
    try {
      const response = await axios.get(
        getApiUrl(`/api/v1/chat/sessions/${sessionId}/messages`),
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page: 1, page_size: 100 },
        }
      );
      
      console.log('📨 Messages response:', response.data);
      
      if (response.data.success) {
        // Handle both paginated and non-paginated responses
        let messagesList = [];
        if (Array.isArray(response.data.data)) {
          messagesList = response.data.data;
        } else if (response.data.data?.items) {
          messagesList = response.data.data.items;
        }
        console.log(`✅ Loaded ${messagesList.length} messages:`, messagesList);
        setMessages(messagesList);
      } else {
        console.error('❌ Messages fetch failed:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [accessToken]);

  // Send a message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedSession || sending) return;

    setSending(true);
    const messageText = messageInput; // Capture before clearing
    try {
      const response = await axios.post(
        getApiUrl(`/api/v1/chat/sessions/${selectedSession.id}/messages`),
        { body: messageText },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        setMessageInput('');
        // Optimistically add message to UI
        const newMessage: ChatMessage = {
          id: response.data.data.id,
          session_id: selectedSession.id,
          sender_type: 'agent' as const,
          sender_name: user?.email || 'You',
          message_type: response.data.data.message_type,
          body: messageText,
          is_read: true,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
        console.log('✅ Message sent and added to UI:', newMessage.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Assign session to current agent
  const assignToMe = async (sessionId: number) => {
    console.log('🚀 [ASSIGN] Attempting to assign session:', sessionId, 'to agent:', user?.id);
    console.log('📡 [ASSIGN] API URL:', getApiUrl(`/api/v1/chat/sessions/${sessionId}/assign`));
    
    try {
      const response = await axios.post(
        getApiUrl(`/api/v1/chat/sessions/${sessionId}/assign`),
        { agent_id: user?.id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      console.log('📥 [ASSIGN] Response received:', response.status, response.data);

      if (response.data.success) {
        console.log('✅ [ASSIGN] Session assigned successfully');
        fetchSessions(); // Refresh the list
        
        // If this is the selected session, update it
        if (selectedSession?.id === sessionId) {
          setSelectedSession(prev => prev ? {...prev, assigned_to_id: user?.id || null, assigned_to_name: user?.email || null} : null);
        }
      } else {
        console.warn('⚠️ [ASSIGN] Response indicated failure:', response.data);
      }
    } catch (error: any) {
      console.error('❌ [ASSIGN] Failed to assign session:', error);
      console.error('❌ [ASSIGN] Error details:', error.response?.data || error.message);
      alert('Failed to assign session. Please try again.');
    }
  };

  // Transfer session to team/queue (unassign)
  const transferToQueue = async () => {
    if (!selectedSession || transferring) return;

    setTransferring(true);
    try {
      const response = await axios.post(
        getApiUrl(`/api/v1/chat/sessions/${selectedSession.id}/transfer`),
        { 
          to_team: 'general-queue',
          notes: transferNotes || 'Transferred to queue'
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        console.log('✅ Session transferred successfully');
        setShowTransferModal(false);
        setTransferNotes('');
        fetchSessions();
        
        // Update selected session
        setSelectedSession(prev => prev ? {...prev, assigned_to_id: null, assigned_to_name: null} : null);
      }
    } catch (error) {
      console.error('Failed to transfer session:', error);
      alert('Failed to transfer session. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  // Keep ref in sync with selectedSession
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!accessToken) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isCleanup = false;

    const connect = () => {
      if (isCleanup) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8443/ws?token=${accessToken}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        
        // Subscribe to chat events
        if (ws) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            payload: {
              topics: [
                'chat.message.new',
                'chat.session.assigned',
                'chat.session.started',
                'chat.agent.joined'
              ]
            }
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (!isCleanup) {
          console.log('Attempting to reconnect in 3 seconds...');
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isCleanup = true;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [accessToken]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    console.log('📨 WebSocket message received:', data.type, data);
    
    switch (data.type) {
      case 'chat.message.new':
        console.log('💬 New chat message:', {
          session_id: data.payload.session_id,
          sender: data.payload.sender_name,
          body: data.payload.body,
          selectedSession: selectedSessionRef.current?.id
        });
        
        // New message received
        if (selectedSessionRef.current && data.payload.session_id === selectedSessionRef.current.id) {
          console.log('✅ Adding message to current conversation');
          // Add message to current conversation (with deduplication)
          setMessages(prev => {
            // Check if message already exists (optimistic update)
            if (prev.some(msg => msg.id === data.payload.message_id)) {
              console.log('ℹ️ Message already in UI (optimistic update)');
              return prev;
            }
            return [...prev, {
              id: data.payload.message_id,
              session_id: data.payload.session_id,
              sender_type: data.payload.sender_type,
              sender_name: data.payload.sender_name,
              message_type: data.payload.message_type,
              body: data.payload.body,
              is_read: false,
              created_at: data.payload.timestamp
            }];
          });
        } else {
          console.log('ℹ️ Message for different session or no session selected');
        }
        // Refresh sessions list to update message counts
        console.log('🔄 Refreshing sessions list...');
        fetchSessions();
        break;

      case 'chat.session.started':
      case 'chat.session.assigned':
        console.log('🆕 Session event received');
        // New session or assignment - refresh sessions list
        fetchSessions();
        break;

      case 'chat.agent.joined':
        console.log('👤 Agent joined event');
        // Agent joined notification
        if (data.payload.agent_id === user?.id) {
          console.log('You have been assigned to a chat session');
          fetchSessions();
        }
        break;
      
      default:
        console.log('❓ Unknown message type:', data.type);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load messages when session selected
  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id);
    }
  }, [selectedSession, fetchMessages]);

  // Calculate queue metrics
  // Include both 'active' and 'queued' status for unassigned sessions
  // This automatically excludes 'ended' and 'abandoned' sessions
  const unassignedSessions = sessions.filter(s => 
    !s.assigned_to_id && 
    (s.status === 'active' || s.status === 'queued')
  );
  // Only show active assigned sessions (exclude ended/abandoned)
  const mySessions = sessions.filter(s => 
    s.assigned_to_id === user?.id &&
    (s.status === 'active' || s.status === 'queued')
  );
  
  useEffect(() => {
    console.log('🔢 Queue calculation:', {
      totalSessions: sessions.length,
      unassignedAndActive: unassignedSessions.length,
      unassignedAll: sessions.filter(s => !s.assigned_to_id).length,
      activeAll: sessions.filter(s => s.status === 'active').length,
      mySessions: mySessions.length,
      statuses: sessions.map(s => ({ id: s.id, status: s.status, assigned: !!s.assigned_to_id }))
    });
    setQueueCount(unassignedSessions.length);
  }, [sessions, unassignedSessions.length, mySessions.length]);

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.session_key.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ? (session.status === 'active' || session.status === 'queued') : // Default: only active chats
      statusFilter === 'history' ? (session.status === 'ended' || session.status === 'abandoned') : // History: ended chats
      statusFilter === 'unassigned' ? !session.assigned_to_id && (session.status === 'active' || session.status === 'queued') :
      statusFilter === 'my' ? session.assigned_to_id === user?.id && (session.status === 'active' || session.status === 'queued') :
      session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'agent':
        return <UserCircle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Panel - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Chat Conversations</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-600">
                {wsConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          {/* Queue Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <div className="text-xs text-amber-600 font-medium">Queue</div>
              <div className="text-2xl font-bold text-amber-900">{queueCount}</div>
              <div className="text-xs text-amber-600">Unassigned</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
              <div className="text-xs text-indigo-600 font-medium">My Chats</div>
              <div className="text-2xl font-bold text-indigo-900">{mySessions.length}</div>
              <div className="text-xs text-indigo-600">Active</div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="all">All Active</option>
              <option value="queued">Queued</option>
              <option value="active">Active</option>
              <option value="unassigned">Unassigned</option>
              <option value="my">My Chats</option>
              <option value="history">History (Ended)</option>
            </select>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  console.log('🖱️ Session clicked:', session.id, session);
                  setSelectedSession(session);
                }}
                className={`p-4 border-b border-gray-200 cursor-pointer transition-colors relative ${
                  selectedSession?.id === session.id
                    ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                    : 'hover:bg-gray-50'
                } ${((session.message_count || 0) > 0 && session.assigned_to_id === null) ? 'bg-amber-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center relative">
                      <User className="w-5 h-5 text-indigo-600" />
                      {/* New message indicator */}
                      {((session.message_count || 0) > 0 && session.assigned_to_id === null) && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {session.message_count! > 9 ? '9+' : session.message_count}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium ${((session.message_count || 0) > 0 && session.assigned_to_id === null) ? 'text-gray-900 font-bold' : 'text-gray-900'}`}>
                        {session.visitor_name || 'Guest User'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {session.visitor_email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Message count badge for unassigned sessions */}
                    {((session.message_count || 0) > 0 && session.assigned_to_id === null) && (
                      <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                        NEW
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(session.created_at).toLocaleTimeString()}</span>
                  </div>
                  {session.assigned_to_id ? (
                    <div className="flex items-center gap-1 text-indigo-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>{session.assigned_to_id === user?.id ? 'You' : session.assigned_to_name}</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToMe(session.id);
                      }}
                      className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                    >
                      Pick
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Center Panel - Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedSession.visitor_name || 'Guest User'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedSession.visitor_email || 'No email provided'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!selectedSession.assigned_to_id && (
                    <button
                      onClick={() => assignToMe(selectedSession.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <UserCircle className="w-4 h-4" />
                      Assign to Me
                    </button>
                  )}
                  {selectedSession.assigned_to_id === user?.id && (
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Transfer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isAgent = message.sender_type === 'agent';
                  const isBot = message.sender_type === 'bot';

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isAgent ? 'justify-end' : ''}`}
                    >
                      {!isAgent && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isBot ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getSenderIcon(message.sender_type)}
                        </div>
                      )}

                      <div className={`flex flex-col ${isAgent ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            isAgent ? 'text-indigo-600' :
                            isBot ? 'text-purple-600' :
                            'text-gray-600'
                          }`}>
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className={`max-w-md px-4 py-2 rounded-lg ${
                          isAgent ? 'bg-indigo-600 text-white' :
                          isBot ? 'bg-purple-50 text-gray-900 border border-purple-200' :
                          'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        </div>
                      </div>

                      {isAgent && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sending}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              {selectedSession.assigned_to_id && selectedSession.assigned_to_id !== user?.id && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  This conversation is assigned to {selectedSession.assigned_to_name}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
            <p className="text-sm">Choose a conversation from the list to view messages</p>
          </div>
        )}
      </div>

      {/* Right Panel - Customer Context */}
      {selectedSession && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Details</h3>

          <div className="space-y-4">
            {/* Visitor Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{selectedSession.visitor_name || 'N/A'}</span>
                </div>
                {selectedSession.visitor_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{selectedSession.visitor_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Session Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Session Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-xs">{selectedSession.session_key}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(selectedSession.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedSession.status)}`}>
                    {selectedSession.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            {selectedSession.assigned_to_id && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Assigned To</h4>
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="w-4 h-4 text-gray-400" />
                  <span>{selectedSession.assigned_to_name}</span>
                  {selectedSession.assigned_to_id === user?.id && (
                    <span className="text-xs text-indigo-600">(You)</span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Actions</h4>
              <div className="space-y-2">
                {!selectedSession.assigned_to_id && (
                  <button
                    onClick={() => assignToMe(selectedSession.id)}
                    className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Assign to Me
                  </button>
                )}
                <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  View Full History
                </button>
                <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Chat</h3>
            <p className="text-sm text-gray-600 mb-4">
              Transfer this chat to the general queue. Another agent can pick it up.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Notes (Optional)
              </label>
              <textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Add context for the next agent..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={transferring}
              >
                Cancel
              </button>
              <button
                onClick={transferToQueue}
                disabled={transferring}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
