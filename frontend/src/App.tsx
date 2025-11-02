import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Layouts
import ModularDashboardLayout from './components/layouts/ModularDashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Components
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Calls from './pages/calls/Calls';
import Agents from './pages/Agents';
import Queues from './pages/Queues';
import CDRs from './pages/cdrs/CDRs';
import Contacts from './pages/contacts/Contacts';
import Tickets from './pages/Tickets';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import SoftphoneSetup from './pages/softphone/SoftphoneSetup';
import ChatWidgetDesigner from './pages/ChatWidgetDesigner';
import AIAgentManager from './pages/AIAgentManager';
import WidgetDemoPage from './pages/WidgetDemoPage';

// Admin Pages
import Tenants from './pages/admin/Tenants';
import SystemUsers from './pages/admin/SystemUsers';
import KnowledgeBase from './pages/admin/KnowledgeBase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <ModularDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/queues" element={<Queues />} />
            <Route path="/cdrs" element={<CDRs />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat-widget-designer" element={<ChatWidgetDesigner />} />
            <Route path="/widget-demo" element={<WidgetDemoPage />} />
            <Route path="/softphone" element={<SoftphoneSetup />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* AI Routes */}
            <Route path="/ai-agents" element={<AIAgentManager />} />
            
            {/* Admin Routes */}
            <Route path="/admin/tenants" element={<Tenants />} />
            <Route path="/admin/users" element={<SystemUsers />} />
            <Route path="/admin/knowledge-base" element={<KnowledgeBase />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
