// User and Authentication Types
// User roles
export type UserRole = 'superadmin' | 'tenant_admin' | 'manager' | 'supervisor' | 'agent' | 'viewer';

export interface User {
  id: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
  tenant_id?: string;
  status?: string;
  avatar_url?: string;
  roles?: Array<{
    id: number;
    tenant_id: string;
    role: UserRole;
  }>;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  max_agents: number;
  max_dids: number;
  max_concurrent_calls: number;
  features?: {
    webrtc?: boolean;
    sms?: boolean;
    recording?: boolean;
    queue?: boolean;
    ivr?: boolean;
    chat?: boolean;
    helpdesk?: boolean;
    analytics?: boolean;
    api?: boolean;
  };
  billing_email?: string;
  contact_name?: string;
  contact_phone?: string;
  trial_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Agent Types
export interface Agent {
  id: number;
  user_id: number;
  extension: string;
  status: string;
  current_call_id?: string;
  last_status_change: string;
  created_at: string;
  updated_at: string;
}

// Call Types
export interface Call {
  id: string;
  tenant_id: number;
  channel_id: string;
  caller_id: string;
  callee_id: string;
  direction: string;
  status: string;
  queue_id?: number;
  agent_id?: number;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration?: number;
  recording_url?: string;
}

// Queue Types
export interface Queue {
  id: number;
  tenant_id: number;
  name: string;
  extension: string;
  max_wait_time: number;
  strategy: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  waiting_calls?: number;
  available_agents?: number;
}

export interface QueueMember {
  id: number;
  queue_id: number;
  agent_id: number;
  penalty: number;
  paused: boolean;
  created_at: string;
}

// CDR Types
export interface CDR {
  id: number;
  tenant_id: number;
  call_id: string;
  caller_id: string;
  callee_id: string;
  direction: string;
  duration: number;
  billsec: number;
  disposition: string;
  recording_url?: string;
  created_at: string;
}

// DID Types
export interface DID {
  id: number;
  tenant_id: number;
  number: string;
  country_code: string;
  provider: string;
  destination_type: string;
  destination_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Contact Types
export interface Contact {
  id: number;
  tenant_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Ticket Types
export interface Ticket {
  id: number;
  tenant_id: number;
  contact_id?: number;
  agent_id?: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  channel: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Chat Types
export interface ChatSession {
  id: number;
  tenant_id: number;
  widget_id: number;
  visitor_id: string;
  agent_id?: number;
  status: string;
  started_at: string;
  ended_at?: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: 'visitor' | 'agent';
  sender_id: string;
  message: string;
  created_at: string;
}

// Dashboard Statistics
export interface DashboardStats {
  active_calls: number;
  waiting_calls: number;
  available_agents: number;
  total_agents: number;
  calls_today: number;
  answered_calls_today: number;
  average_wait_time: number;
  average_call_duration: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
