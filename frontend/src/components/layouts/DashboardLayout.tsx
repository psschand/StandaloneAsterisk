import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
  LogOut,
  Menu,
  X,
  Building2,
  Shield,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { UserRole } from '../../types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[]; // If undefined, visible to all roles
}

const allNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  
  // Superadmin-only sections
  { name: 'Tenants', href: '/admin/tenants', icon: Building2, roles: ['superadmin'] },
  { name: 'System Users', href: '/admin/users', icon: Shield, roles: ['superadmin'] },
  
  // Admin-only sections (tenant_admin)
  { name: 'Knowledge Base', href: '/admin/knowledge-base', icon: BookOpen, roles: ['superadmin', 'tenant_admin', 'manager'] },
  { name: 'Extensions', href: '/extensions', icon: Settings, roles: ['superadmin', 'tenant_admin'] },
  { name: 'DIDs', href: '/dids', icon: Phone, roles: ['superadmin', 'tenant_admin'] },
  
  // Admin/Manager sections
  { name: 'Queues', href: '/queues', icon: ListOrdered, roles: ['superadmin', 'tenant_admin', 'manager'] },
  { name: 'Agents', href: '/agents', icon: Users, roles: ['superadmin', 'tenant_admin', 'manager'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['superadmin', 'tenant_admin', 'manager'] },
  
  // Agent sections (customer-facing work)
  { name: 'Calls', href: '/calls', icon: Phone, roles: ['superadmin', 'tenant_admin', 'manager', 'agent'] },
  { name: 'Contacts', href: '/contacts', icon: UserCircle, roles: ['superadmin', 'tenant_admin', 'manager', 'agent'] },
  { name: 'CDRs', href: '/cdrs', icon: FileText, roles: ['superadmin', 'tenant_admin', 'manager', 'agent'] },
  { name: 'Tickets', href: '/tickets', icon: MessageSquare, roles: ['superadmin', 'tenant_admin', 'manager', 'agent'] },
  { name: 'Chat', href: '/chat', icon: MessageCircle, roles: ['superadmin', 'tenant_admin', 'manager', 'agent'] },
  { name: 'Softphone', href: '/softphone', icon: Smartphone, roles: ['superadmin', 'tenant_admin', 'manager', 'agent'] },
  
  // All authenticated users
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter navigation based on user role
  const navigation = useMemo(() => {
    let userRole = user?.role;
    console.log('🔍 Original user role:', userRole);
    // Map backend 'admin' role to 'tenant_admin' for frontend
    if (userRole === 'admin' as any) {
      userRole = 'tenant_admin' as UserRole;
      console.log('✅ Mapped admin to tenant_admin');
    }
    const filtered = allNavigation.filter(item => {
      if (!item.roles) return true; // No role restriction
      return userRole && item.roles.includes(userRole);
    });
    console.log('📋 Navigation items:', filtered.length, 'items');
    console.log('📋 Navigation:', filtered.map(i => i.name));
    return filtered;
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:relative lg:flex lg:flex-col lg:w-64 ${
          sidebarOpen ? '' : 'hidden lg:flex'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Phone className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">CallCenter</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 flex items-center justify-end space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                Welcome back, <span className="font-medium">{user?.first_name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
