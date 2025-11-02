import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { getModulesForRole, getQuickAccessItems } from '../../config/modules';

export default function ModularDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['dashboard']));

  // Get modules for user role
  const modules = useMemo(() => getModulesForRole(user?.role), [user?.role]);
  const quickAccessItems = useMemo(() => getQuickAccessItems(user?.role), [user?.role]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Auto-expand module when navigating to one of its items
  useMemo(() => {
    modules.forEach(module => {
      const isActive = module.items.some(item => location.pathname === item.href);
      if (isActive && !expandedModules.has(module.id)) {
        setExpandedModules(prev => new Set(prev).add(module.id));
      }
    });
  }, [location.pathname, modules]);

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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 lg:relative lg:flex lg:flex-col ${
          sidebarOpen ? '' : 'hidden lg:flex'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CC</span>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">CallCenter</span>
                <p className="text-xs text-gray-500">Omnichannel Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {modules.map((module) => {
              const isExpanded = expandedModules.has(module.id);
              const hasActiveItem = module.items.some(item => location.pathname === item.href);
              const ModuleIcon = module.icon;

              return (
                <div key={module.id} className="mb-2">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      hasActiveItem
                        ? `bg-${module.color}-50 text-${module.color}-700`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-md ${hasActiveItem ? `bg-${module.color}-100` : 'bg-gray-100'}`}>
                        <ModuleIcon className={`w-4 h-4 ${hasActiveItem ? `text-${module.color}-600` : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{module.name}</span>
                          {module.isNew && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              NEW
                            </span>
                          )}
                          {module.comingSoon && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              SOON
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {/* Module Items */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
                      {module.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        const ItemIcon = item.icon;
                        const isDisabled = item.badge === 'Soon';

                        return (
                          <Link
                            key={item.href}
                            to={isDisabled ? '#' : item.href}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                                return;
                              }
                              setSidebarOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm ${
                              isActive
                                ? `bg-${module.color}-50 text-${module.color}-700 font-medium`
                                : isDisabled
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <ItemIcon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                typeof item.badge === 'number'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3 mb-3 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.first_name?.charAt(0) || 'U'}{user?.last_name?.charAt(0) || ''}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
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
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold text-gray-900">
                  {modules.find(m => m.items.some(i => i.href === location.pathname))?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {modules.find(m => m.items.some(i => i.href === location.pathname))?.items.find(i => i.href === location.pathname)?.description || 'Welcome back'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                <span className="text-gray-400">Welcome,</span>{' '}
                <span className="font-medium text-gray-900">{user?.first_name}</span>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user?.first_name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gray-50">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16 px-2">
            {quickAccessItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate max-w-full">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
