/**
 * CallCenter AI Chat Widget
 * Embeddable chat widget for customer websites
 * 
 * Usage:
 * <script src="http://your-domain.com/chat-widget.js"></script>
 * <script>
 *   CallCenterChat.init({
 *     apiUrl: 'http://your-domain.com:8443',
 *     tenantId: 'demo-tenant',
 *     position: 'bottom-right',
 *     primaryColor: '#4F46E5',
 *     title: 'Chat with us',
 *     subtitle: 'We typically reply instantly'
 *   });
 * </script>
 */

(function() {
  'use strict';

  // Widget state
  let config = {
    apiUrl: '',
    tenantId: '',
    position: 'bottom-right',
    primaryColor: '#4F46E5',
    title: 'Chat with us',
    subtitle: 'We typically reply instantly',
    welcomeMessage: 'Hi! How can I help you today?'
  };

  let state = {
    isOpen: false,
    sessionId: null,
    sessionKey: null,
    conversationId: null,
    messages: [],
    isTyping: false,
    ws: null,
    wsConnected: false,
    heartbeatInterval: null,
    sessionRestored: false
  };

  // LocalStorage keys
  const STORAGE_KEY = 'cc_chat_session';
  const STORAGE_EXPIRY = 30 * 60 * 1000; // 30 minutes

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <!-- Chat Bubble Button -->
      <div id="cc-chat-bubble" class="cc-chat-bubble cc-${config.position}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>

      <!-- Chat Window -->
      <div id="cc-chat-window" class="cc-chat-window cc-${config.position} cc-hidden">
        <!-- Header -->
        <div class="cc-chat-header" style="background-color: ${config.primaryColor}">
          <div class="cc-chat-header-info">
            <h3>${config.title}</h3>
            <p>${config.subtitle}</p>
          </div>
          <button id="cc-chat-close" class="cc-close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div id="cc-chat-messages" class="cc-chat-messages">
          <div class="cc-message cc-message-bot">
            <div class="cc-message-content">${config.welcomeMessage}</div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div id="cc-typing-indicator" class="cc-typing-indicator cc-hidden">
          <div class="cc-typing-dot"></div>
          <div class="cc-typing-dot"></div>
          <div class="cc-typing-dot"></div>
        </div>

        <!-- Input -->
        <div class="cc-chat-input">
          <input 
            type="text" 
            id="cc-message-input" 
            placeholder="Type a message..."
            autocomplete="off"
          />
          <button id="cc-send-btn" style="background-color: ${config.primaryColor}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>

        <!-- End Chat Button -->
        <div class="cc-chat-actions">
          <button id="cc-end-chat-btn" class="cc-end-chat-btn">
            End Chat
          </button>
        </div>

        <!-- Powered by -->
        <div class="cc-chat-footer">
          Powered by <strong>CallCenter AI</strong>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.id = 'cc-chat-widget';
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);
  }

  // Create widget styles
  function createStyles() {
    const css = `
      #cc-chat-widget * {
        box-sizing: border-box;
      }

      .cc-chat-bubble {
        position: fixed;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${config.primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9998;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .cc-chat-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .cc-chat-bubble svg {
        width: 28px;
        height: 28px;
      }

      .cc-chat-bubble.cc-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .cc-chat-bubble.cc-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .cc-chat-window {
        position: fixed;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 100px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        transition: opacity 0.3s, transform 0.3s;
      }

      .cc-chat-window.cc-bottom-right {
        bottom: 100px;
        right: 20px;
      }

      .cc-chat-window.cc-bottom-left {
        bottom: 100px;
        left: 20px;
      }

      .cc-chat-window.cc-hidden {
        opacity: 0;
        transform: scale(0.9);
        pointer-events: none;
      }

      .cc-chat-header {
        padding: 20px;
        color: white;
        border-radius: 12px 12px 0 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .cc-chat-header-info h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .cc-chat-header-info p {
        margin: 4px 0 0 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .cc-close-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
        transition: opacity 0.2s;
      }

      .cc-close-btn:hover {
        opacity: 1;
      }

      .cc-close-btn svg {
        width: 24px;
        height: 24px;
      }

      .cc-chat-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: #f9fafb;
      }

      .cc-message {
        margin-bottom: 16px;
        animation: cc-fadeIn 0.3s ease-in;
      }

      @keyframes cc-fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cc-message-content {
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 80%;
        word-wrap: break-word;
        line-height: 1.5;
        font-size: 14px;
      }

      .cc-message-bot .cc-message-content {
        background: white;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        margin-right: auto;
      }

      .cc-message-user .cc-message-content {
        background: ${config.primaryColor};
        color: white;
        margin-left: auto;
      }

      .cc-message-agent .cc-message-content {
        background: #10b981;
        color: white;
        margin-right: auto;
      }

      .cc-message-agent::before {
        content: "Agent";
        display: block;
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 4px;
        opacity: 0.8;
        text-transform: uppercase;
      }

      .cc-typing-indicator {
        padding: 12px 20px;
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .cc-typing-indicator.cc-hidden {
        display: none;
      }

      .cc-typing-dot {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: cc-typing 1.4s infinite;
      }

      .cc-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .cc-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes cc-typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }

      .cc-chat-input {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        background: white;
      }

      .cc-chat-input input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .cc-chat-input input:focus {
        border-color: ${config.primaryColor};
      }

      .cc-chat-input button {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
      }

      .cc-chat-input button:hover {
        opacity: 0.9;
      }

      .cc-chat-input button svg {
        width: 20px;
        height: 20px;
      }

      .cc-chat-actions {
        padding: 8px 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: center;
      }

      .cc-end-chat-btn {
        padding: 8px 20px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .cc-end-chat-btn:hover {
        background: #dc2626;
      }

      .cc-chat-footer {
        padding: 8px 16px;
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
        background: #f9fafb;
        border-radius: 0 0 12px 12px;
      }

      @media (max-width: 480px) {
        .cc-chat-window {
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          border-radius: 0;
        }

        .cc-chat-header {
          border-radius: 0;
        }

        .cc-chat-footer {
          border-radius: 0;
        }
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Session persistence functions
  function saveSessionToStorage() {
    try {
      const sessionData = {
        sessionId: state.sessionId,
        sessionKey: state.sessionKey,
        conversationId: state.conversationId,
        messages: state.messages,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      console.log('✅ Session saved to localStorage:', {
        sessionKey: sessionData.sessionKey,
        conversationId: sessionData.conversationId,
        messageCount: sessionData.messages.length
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  function loadSessionFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);
      const age = Date.now() - sessionData.timestamp;

      // Check if session is expired (older than 30 minutes)
      if (age > STORAGE_EXPIRY) {
        console.log('⏰ Session expired, clearing storage');
        clearSession();
        return null;
      }

      console.log('✅ Found saved session, age:', Math.round(age / 1000), 'seconds');
      return sessionData;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ Session cleared from storage');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  async function restoreSession(sessionData) {
    try {
      console.log('🔄 Attempting to restore session:', sessionData.sessionKey);
      console.log('📊 Session data:', sessionData);
      
      // Verify session is still active on backend using the correct endpoint
      const response = await fetch(`${config.apiUrl}/api/v1/chat/public/status/${sessionData.conversationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.log('❌ Session not found on backend (HTTP', response.status, '), starting new session');
        clearSession();
        return false;
      }

      const data = await response.json();
      console.log('📡 Backend response:', data);
      
      if (data.success && data.data && (data.data.status === 'active' || data.data.status === 'queued')) {
        // Session is still active, restore it
        state.sessionId = sessionData.conversationId;  // This is the numeric ID
        state.sessionKey = sessionData.sessionKey;     // This is the session key
        state.conversationId = sessionData.conversationId;
        state.messages = sessionData.messages || [];
        state.sessionRestored = true;

        console.log('💾 Restoring', state.messages.length, 'messages from localStorage');

        // Restore messages in UI
        const messagesContainer = document.getElementById('cc-chat-messages');
        
        // Clear existing messages and add welcome message
        messagesContainer.innerHTML = `<div class="cc-message cc-message-bot">
          <div class="cc-message-content">${config.welcomeMessage}</div>
        </div>`;
        
        // Restore each saved message
        if (state.messages.length > 0) {
          state.messages.forEach((msg, index) => {
            console.log(`  📝 Restoring message ${index + 1}:`, msg);
            const messageDiv = document.createElement('div');
            messageDiv.className = `cc-message cc-message-${msg.type}`;
            messageDiv.innerHTML = `<div class="cc-message-content">${escapeHtml(msg.content)}</div>`;
            messagesContainer.appendChild(messageDiv);
          });
          
          // Scroll to bottom
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          console.log('✅ Restored', state.messages.length, 'messages to UI');
        } else {
          console.log('⚠️ No messages to restore');
        }

        // Reconnect WebSocket
        connectWebSocket();
        
        console.log('✅ Session restored successfully');
        // Don't add "restored" message - just continue seamlessly
        return true;
      } else {
        console.log('❌ Session ended or abandoned (status:', data.data?.status, '), starting new session');
        clearSession();
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      clearSession();
      return false;
    }
  }

  // API functions
  async function startSession() {
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/chat/public/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: config.tenantId,
          channel: 'web_widget',
          customer_name: 'Guest',
          customer_email: null
        })
      });

      const data = await response.json();
      if (data.success && data.data) {
        // API returns: session_id (the key), conversation_id (numeric ID)
        state.sessionKey = data.data.session_id;           // This is the session key string
        state.sessionId = data.data.conversation_id;        // This is the numeric ID
        state.conversationId = data.data.conversation_id;   // Keep for backwards compat
        
        console.log('🆕 New session created:', {
          sessionKey: state.sessionKey,
          sessionId: state.sessionId,
          conversationId: state.conversationId
        });
        
        // Save session to localStorage
        saveSessionToStorage();
        
        // Connect to WebSocket for real-time updates
        connectWebSocket();
        
        // Start heartbeat
        startHeartbeat();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start chat session:', error);
      return false;
    }
  }

  // Heartbeat mechanism
  function startHeartbeat() {
    // Clear any existing heartbeat
    if (state.heartbeatInterval) {
      clearInterval(state.heartbeatInterval);
    }

    // Send heartbeat every 30 seconds
    state.heartbeatInterval = setInterval(() => {
      if (state.ws && state.wsConnected) {
        try {
          state.ws.send(JSON.stringify({ type: 'ping' }));
          console.log('💓 Heartbeat sent');
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
      // Update session timestamp in localStorage
      saveSessionToStorage();
    }, 30000);
  }

  function stopHeartbeat() {
    if (state.heartbeatInterval) {
      clearInterval(state.heartbeatInterval);
      state.heartbeatInterval = null;
    }
  }

  function connectWebSocket() {
    if (!state.sessionKey || state.ws) return;

    try {
      const wsUrl = config.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      state.ws = new WebSocket(`${wsUrl}/ws/public/${state.sessionKey}`);

      state.ws.onopen = () => {
        state.wsConnected = true;
        console.log('🔌 WebSocket connected');
        startHeartbeat(); // Start heartbeat when connected
      };

      state.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      state.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        state.wsConnected = false;
      };

      state.ws.onclose = () => {
        state.wsConnected = false;
        state.ws = null;
        console.log('🔌 WebSocket disconnected');
        stopHeartbeat(); // Stop heartbeat when disconnected
        
        // Attempt to reconnect after 3 seconds if session is still active
        if (state.sessionKey) {
          setTimeout(() => {
            if (!state.wsConnected && state.sessionKey) {
              connectWebSocket();
            }
          }, 3000);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  function handleWebSocketMessage(data) {
    switch (data.type) {
      case 'chat.message.new':
        // New message from agent
        if (data.payload.sender_type === 'agent') {
          hideTyping();
          addMessage(data.payload.body, 'agent');
        }
        break;
      
      case 'chat.session.assigned':
        // Agent joined the chat
        updateSubtitle('Connected to ' + (data.payload.agent_name || 'an agent'));
        break;
      
      case 'chat.typing':
        // Agent is typing
        if (data.payload.sender_type === 'agent' && data.payload.is_typing) {
          showTyping();
        } else {
          hideTyping();
        }
        break;
    }
  }

  function updateSubtitle(text) {
    const subtitle = document.querySelector('.cc-chat-header p');
    if (subtitle) {
      subtitle.textContent = text;
    }
  }

  async function sendMessage(message) {
    if (!state.sessionKey) {
      const started = await startSession();
      if (!started) {
        addMessage('Sorry, unable to connect. Please try again later.', 'bot');
        return;
      }
    }

    try {
      showTyping();
      
      const response = await fetch(`${config.apiUrl}/api/v1/chat/public/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: state.sessionKey,  // Use sessionKey (the string), not sessionId
          message: message,
          metadata: {
            page_url: window.location.href,
            page_title: document.title
          }
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.success && data.data) {
        const reply = data.data;
        const senderType = reply.is_agent ? 'agent' : 'bot';
        addMessage(reply.content, senderType);
        
        // Update session in localStorage after each message
        saveSessionToStorage();
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      hideTyping();
      addMessage('Sorry, unable to send message. Please try again.', 'bot');
    }
  }

  async function endChat() {
    if (!state.sessionId) return;

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/chat/public/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: state.sessionId
        })
      });

      if (response.ok) {
        console.log('✅ Chat ended successfully');
      }
    } catch (error) {
      console.error('Failed to end chat:', error);
    } finally {
      // Cleanup regardless of API success
      if (state.ws) {
        state.ws.close();
        state.ws = null;
      }
      stopHeartbeat();
      clearSession();
      
      // Reset state
      state.sessionId = null;
      state.sessionKey = null;
      state.conversationId = null;
      state.messages = [];
      state.sessionRestored = false;
      
      // Reset UI
      const messagesContainer = document.getElementById('cc-chat-messages');
      messagesContainer.innerHTML = `<div class="cc-message cc-message-bot">
        <div class="cc-message-content">${config.welcomeMessage}</div>
      </div>`;
      
      addMessage('Chat ended. Thank you!', 'bot');
      
      // Close the widget after 2 seconds
      setTimeout(() => {
        if (state.isOpen) toggleChat();
      }, 2000);
    }
  }

  // UI functions
  function addMessage(content, type) {
    const messagesContainer = document.getElementById('cc-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `cc-message cc-message-${type}`;
    messageDiv.innerHTML = `<div class="cc-message-content">${escapeHtml(content)}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    state.messages.push({ content, type, timestamp: new Date() });
  }

  function showTyping() {
    document.getElementById('cc-typing-indicator').classList.remove('cc-hidden');
    const messagesContainer = document.getElementById('cc-chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('cc-typing-indicator').classList.add('cc-hidden');
  }

  async function toggleChat() {
    state.isOpen = !state.isOpen;
    const chatWindow = document.getElementById('cc-chat-window');
    
    if (state.isOpen) {
      chatWindow.classList.remove('cc-hidden');
      document.getElementById('cc-message-input').focus();
      
      console.log('🔵 Chat opened. State:', {
        sessionId: state.sessionId,
        sessionKey: state.sessionKey,
        sessionRestored: state.sessionRestored,
        messageCount: state.messages.length
      });
      
      // Try to restore session from localStorage
      if (!state.sessionId && !state.sessionRestored) {
        console.log('🔍 No active session, checking localStorage...');
        const savedSession = loadSessionFromStorage();
        if (savedSession) {
          console.log('📦 Found saved session, attempting restoration...');
          const restored = await restoreSession(savedSession);
          if (!restored) {
            // Restoration failed, start new session
            console.log('❌ Restoration failed, starting new session');
            await startSession();
          }
        } else {
          // No saved session, start new one
          console.log('🆕 No saved session, starting new one');
          await startSession();
        }
      } else {
        console.log('✅ Session already active, no restoration needed');
      }
    } else {
      chatWindow.classList.add('cc-hidden');
      console.log('🔵 Chat closed');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Event handlers
  function setupEventListeners() {
    document.getElementById('cc-chat-bubble').addEventListener('click', toggleChat);
    document.getElementById('cc-chat-close').addEventListener('click', toggleChat);

    const input = document.getElementById('cc-message-input');
    const sendBtn = document.getElementById('cc-send-btn');
    const endChatBtn = document.getElementById('cc-end-chat-btn');

    sendBtn.addEventListener('click', () => {
      const message = input.value.trim();
      if (message) {
        addMessage(message, 'user');
        input.value = '';
        sendMessage(message);
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });

    endChatBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to end this chat?')) {
        endChat();
      }
    });

    // Handle page unload - update timestamp but don't end session
    window.addEventListener('beforeunload', () => {
      if (state.sessionId) {
        saveSessionToStorage();
      }
    });
  }

  // Public API
  window.CallCenterChat = {
    init: function(options) {
      config = { ...config, ...options };

      if (!config.apiUrl || !config.tenantId) {
        console.error('CallCenterChat: apiUrl and tenantId are required');
        return;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          createStyles();
          createWidget();
          setupEventListeners();
        });
      } else {
        createStyles();
        createWidget();
        setupEventListeners();
      }
    },

    open: function() {
      if (!state.isOpen) toggleChat();
    },

    close: function() {
      if (state.isOpen) toggleChat();
    },

    sendMessage: function(message) {
      if (message) {
        if (!state.isOpen) toggleChat();
        addMessage(message, 'user');
        sendMessage(message);
      }
    }
  };
})();
