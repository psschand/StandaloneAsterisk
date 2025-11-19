import {
  LayoutDashboard,
  Phone,
  Users,
  ListOrdered,
  FileText,
  UserCircle,
  MessageSquare,
  MessageCircle,
  Settings,
  Building2,
  Shield,
  Smartphone,
  BookOpen,
  Bot,
  Inbox,
  Calendar,
  Zap,
  BarChart3,
  Ticket,
  Brain,
  MessagesSquare,
  UsersRound,
  Network,
  Globe,
  Sparkles,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../types';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
  roles?: UserRole[]; // Optional role restrictions for individual nav items
}

export interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string; // Tailwind color class
  roles?: UserRole[]; // If undefined, visible to all roles
  items: NavItem[];
  isNew?: boolean;
  comingSoon?: boolean;
}

export const modules: Module[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick actions',
    color: 'indigo',
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard, description: 'System overview' },
    ],
  },
  {
    id: 'call-center',
    name: 'Call Center',
    icon: Phone,
    description: 'Voice communication & telephony',
    color: 'blue',
    roles: ['superadmin', 'tenant_admin', 'admin', 'manager', 'agent'],
    items: [
      // Admin Configuration
      { name: 'Extensions', href: '/admin/extensions', icon: Phone, description: 'SIP extension management', roles: ['superadmin', 'tenant_admin', 'admin'] },
      { name: 'SIP Trunks', href: '/sip-trunks', icon: Phone, description: 'External SIP trunk management', roles: ['superadmin', 'tenant_admin', 'admin'] },
      { name: 'Outbound Routes', href: '/outbound-routes', icon: Share2, description: 'Outbound dial plan routing', roles: ['superadmin', 'tenant_admin', 'admin'], badge: 'New' },
      { name: 'DIDs', href: '/dids', icon: Phone, description: 'Phone number management', roles: ['superadmin', 'tenant_admin', 'admin'] },
      { name: 'Call Routing', href: '/call-routing', icon: Share2, description: 'DID routing configuration', roles: ['superadmin', 'tenant_admin', 'admin'], badge: 'New' },
      { name: 'IVR Builder', href: '/ivr-builder', icon: MessageSquare, description: 'Interactive voice menus', roles: ['superadmin', 'tenant_admin', 'admin'], badge: 'New' },
      { name: 'Queue Management', href: '/queue-management', icon: ListOrdered, description: 'Configure call queues', roles: ['superadmin', 'tenant_admin', 'admin'], badge: 'New' },
      { name: 'Dialplan Visualizer', href: '/dialplan-visualizer', icon: Network, description: 'Visual call flow', roles: ['superadmin', 'tenant_admin', 'admin'], badge: 'New' },
      
      // Operations & Monitoring
      { name: 'Active Calls', href: '/calls', icon: Phone, description: 'Live call monitoring' },
      { name: 'Call Control', href: '/call-control', icon: Phone, description: 'Active call management' },
      { name: 'Queues', href: '/queues', icon: ListOrdered, description: 'Call queue management' },
      { name: 'Queue Dashboard', href: '/queue-dashboard', icon: BarChart3, description: 'Real-time queue metrics', roles: ['superadmin', 'tenant_admin', 'admin', 'manager'] },
      { name: 'Agents', href: '/agents', icon: Users, description: 'Agent status & availability' },
      
      // Tools & Records
      { name: 'Softphone', href: '/softphone', icon: Smartphone, description: 'WebRTC softphone' },
      { name: 'CDRs', href: '/cdrs', icon: FileText, description: 'Call detail records' },
    ],
  },
  {
    id: 'omnichannel-chat',
    name: 'Omnichannel Chat',
    icon: MessageCircle,
    description: 'Multi-channel customer engagement',
    color: 'green',
    roles: ['superadmin', 'tenant_admin', 'manager', 'agent'],
    isNew: true,
    items: [
      // Communication Channels
      { name: 'Websites & Properties', href: '/websites', icon: Globe, description: 'Manage websites & brands', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Widget Management', href: '/widget-management', icon: MessageSquare, description: 'Manage all widgets', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Widget Designer', href: '/chat-widget-designer', icon: Zap, description: 'Create & customize widgets', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Channel AI Settings', href: '/ai-profiles', icon: Sparkles, description: 'Configure AI per channel', roles: ['superadmin', 'tenant_admin', 'manager'] },
      
      // Active Conversations
      { name: 'Unified Inbox', href: '/chat', icon: Inbox, description: 'All conversations in one place' },
      { name: 'Live Chats', href: '/chat/web', icon: MessageCircle, description: 'Active web chats' },
      { name: 'Chat History', href: '/chat-history', icon: MessagesSquare, description: 'Past conversations', badge: 'Soon' },
      
      // Social Media Integrations
      { name: 'WhatsApp Business', href: '/channels/whatsapp', icon: Send, description: 'WhatsApp integration', badge: 'Soon', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Facebook Messenger', href: '/channels/facebook', icon: Facebook, description: 'Facebook integration', badge: 'Soon', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Instagram DM', href: '/channels/instagram', icon: Instagram, description: 'Instagram integration', badge: 'Soon', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Telegram', href: '/channels/telegram', icon: Share2, description: 'Telegram bot integration', badge: 'Soon', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Twitter DM', href: '/channels/twitter', icon: Twitter, description: 'Twitter integration', badge: 'Soon', roles: ['superadmin', 'tenant_admin', 'manager'] },
    ],
  },
  {
    id: 'agentic-ai',
    name: 'Agentic AI',
    icon: Brain,
    description: 'AI intelligence & knowledge',
    color: 'purple',
    // Visible to all roles - agents can view, admins can manage
    items: [
      { name: 'Knowledge Base', href: '/admin/knowledge-base', icon: BookOpen, description: 'Content & documentation', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'AI Agents', href: '/ai-agents', icon: Bot, description: 'Advanced AI configuration' },
      { name: 'Document Upload', href: '/ai-documents', icon: FileText, description: 'RAG content ingestion', badge: 'Soon', roles: ['superadmin', 'tenant_admin', 'manager'] },
      { name: 'Training', href: '/ai-training', icon: Zap, description: 'Model training & tuning', badge: 'Soon' },
      { name: 'Analytics', href: '/ai-analytics', icon: BarChart3, description: 'AI performance metrics', badge: 'Soon' },
    ],
  },
  {
    id: 'helpdesk',
    name: 'Helpdesk',
    icon: Ticket,
    description: 'Ticket & issue management',
    color: 'amber',
    roles: ['superadmin', 'tenant_admin', 'manager', 'agent'],
    items: [
      { name: 'Tickets', href: '/tickets', icon: Ticket, description: 'Support ticket queue' },
      { name: 'SLA Management', href: '/sla', icon: Zap, description: 'Service level agreements', badge: 'Soon' },
      { name: 'Categories', href: '/ticket-categories', icon: Inbox, description: 'Ticket categorization', badge: 'Soon' },
    ],
  },
  {
    id: 'teams',
    name: 'Teams & Collaboration',
    icon: UsersRound,
    description: 'Internal communication',
    color: 'teal',
    comingSoon: true,
    items: [
      { name: 'Team Chat', href: '/team-chat', icon: MessagesSquare, description: 'Internal messaging', badge: 'Soon' },
      { name: 'Calendar', href: '/calendar', icon: Calendar, description: 'Schedule & meetings', badge: 'Soon' },
      { name: 'Meetings', href: '/meetings', icon: Network, description: 'Video conferencing', badge: 'Soon' },
    ],
  },
  {
    id: 'admin',
    name: 'Admin & Settings',
    icon: Settings,
    description: 'System administration',
    color: 'gray',
    items: [
      { name: 'Tenants', href: '/admin/tenants', icon: Building2, description: 'Multi-tenant management', roles: ['superadmin'] },
      { name: 'System Users', href: '/admin/users', icon: Shield, description: 'User management', roles: ['superadmin', 'tenant_admin'] },
      { name: 'Security', href: '/admin/security', icon: Shield, description: 'IP blocking & firewall', roles: ['superadmin', 'tenant_admin'], badge: 'New' },
      { name: 'Contacts', href: '/contacts', icon: UserCircle, description: 'Contact directory' },
      { name: 'Settings', href: '/settings', icon: Settings, description: 'System preferences' },
    ],
  },
];

// Helper function to filter modules based on user role
export function getModulesForRole(userRole?: UserRole): Module[] {
  const mappedRole = userRole === ('admin' as any) ? 'tenant_admin' : userRole;
  
  return modules
    .map(module => {
      // Filter module items based on role
      const filteredItems = module.items.filter(item => {
        if (!item.roles) return true;
        return mappedRole && item.roles.includes(mappedRole as UserRole);
      });

      // Check if module itself should be visible
      if (module.roles && mappedRole && !module.roles.includes(mappedRole as UserRole)) {
        return null;
      }

      // Only return module if it has visible items
      if (filteredItems.length === 0) return null;

      return {
        ...module,
        items: filteredItems,
      };
    })
    .filter((module): module is Module => module !== null);
}

// Get flat navigation for mobile bottom bar (most used items)
export function getQuickAccessItems(userRole?: UserRole): NavItem[] {
  const allModules = getModulesForRole(userRole);
  const quickItems: NavItem[] = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
  ];

  // Add first item from each active module
  allModules.forEach(module => {
    if (module.id !== 'dashboard' && module.id !== 'admin' && module.items.length > 0) {
      quickItems.push(module.items[0]);
    }
  });

  return quickItems.slice(0, 5); // Limit to 5 items for mobile nav
}
