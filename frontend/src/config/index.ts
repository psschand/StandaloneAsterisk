// Configuration for API endpoints
// Uses environment variables for deployment flexibility

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080',
  ariWsUrl: import.meta.env.VITE_ARI_WS_URL || 'ws://localhost:8088/ari/events',
  
  // API endpoints
  api: {
    auth: {
      login: '/api/v1/auth/login',
      logout: '/api/v1/auth/logout',
      refresh: '/api/v1/auth/refresh',
    },
    tenants: {
      list: '/api/v1/tenants',
      get: (id: string) => `/api/v1/tenants/${id}`,
      create: '/api/v1/tenants',
      update: (id: string) => `/api/v1/tenants/${id}`,
      delete: (id: string) => `/api/v1/tenants/${id}`,
    },
    users: {
      list: '/api/v1/users',
      get: (id: number) => `/api/v1/users/${id}`,
      create: '/api/v1/users',
      update: (id: number) => `/api/v1/users/${id}`,
      delete: (id: number) => `/api/v1/users/${id}`,
    },
    agents: '/api/v1/agents',
    queues: '/api/v1/queues',
    calls: {
      active: '/api/v1/calls/active',
      make: '/api/v1/calls/make',
      answer: (id: string) => `/api/v1/calls/${id}/answer`,
      hangup: (id: string) => `/api/v1/calls/${id}/hangup`,
      hold: (id: string) => `/api/v1/calls/${id}/hold`,
      transfer: (id: string) => `/api/v1/calls/${id}/transfer`,
      mute: (id: string) => `/api/v1/calls/${id}/mute`,
    },
    cdrs: {
      list: '/api/v1/cdrs',
      get: (id: number) => `/api/v1/cdrs/${id}`,
      export: '/api/v1/cdrs/export',
    },
    dids: '/api/v1/dids',
    contacts: {
      list: '/api/v1/contacts',
      get: (id: number) => `/api/v1/contacts/${id}`,
      create: '/api/v1/contacts',
      update: (id: number) => `/api/v1/contacts/${id}`,
      delete: (id: number) => `/api/v1/contacts/${id}`,
    },
    tickets: '/api/v1/tickets',
    chat: '/api/v1/chat',
    softphone: {
      credentials: '/api/v1/softphone/credentials',
      status: '/api/v1/softphone/status',
    },
    knowledgeBase: {
      list: '/api/v1/knowledge-base',
      get: (id: number) => `/api/v1/knowledge-base/${id}`,
      create: '/api/v1/knowledge-base',
      update: (id: number) => `/api/v1/knowledge-base/${id}`,
      delete: (id: number) => `/api/v1/knowledge-base/${id}`,
      search: '/api/v1/knowledge-base/search',
      categories: '/api/v1/knowledge-base/categories',
      stats: '/api/v1/knowledge-base/stats',
      test: '/api/v1/knowledge-base/test',
      import: '/api/v1/knowledge-base/import',
      export: '/api/v1/knowledge-base/export',
      helpful: (id: number) => `/api/v1/knowledge-base/${id}/helpful`,
    },
  },
  
  // WebSocket endpoints
  ws: {
    calls: '/ws/calls',
    agents: '/ws/agents',
    chat: '/ws/chat',
  },
};

export default config;
