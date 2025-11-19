import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Layouts
import ModularDashboardLayout from './components/layouts/ModularDashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Components
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { SoftphoneProvider } from './contexts/SoftphoneContext';
import GlobalSoftphoneWidget from './components/softphone/GlobalSoftphoneWidget';

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
import LiveChats from './pages/chat/LiveChats';
import Settings from './pages/Settings';
import SoftphoneSetup from './pages/softphone/SoftphoneSetup';
import Softphone from './pages/softphone/SoftphoneSimple';
import ChatWidgetDesigner from './pages/ChatWidgetDesigner';
import AIAgentManager from './pages/AIAgentManager';
import WidgetDemoPage from './pages/WidgetDemoPage';
import WebsiteManagement from './pages/WebsiteManagement';
import AIProfileManagement from './pages/AIProfileManagement';
import ChannelManagement from './pages/ChannelManagement';
import WidgetManagement from './pages/WidgetManagement';
import SIPTrunks from './pages/SIPTrunks';
import OutboundRoutes from './pages/OutboundRoutes';
import QueueManagement from './pages/QueueManagement';
import CallRouting from './pages/CallRouting';
import IVRBuilder from './pages/IVRBuilder';
import DialplanVisualizer from './pages/DialplanVisualizer';

// Admin Pages
import Tenants from './pages/admin/Tenants';
import SystemUsers from './pages/admin/SystemUsers';
import KnowledgeBase from './pages/admin/KnowledgeBase';
import Extensions from './pages/admin/Extensions';
import SecurityManagement from './pages/admin/SecurityManagement';

// Telephony Pages
import DIDsManagement from './pages/DIDsManagement';
import QueueDashboard from './pages/QueueDashboard';
import CallControl from './pages/CallControl';

// Legal Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import About from './pages/legal/About';
import Contact from './pages/legal/Contact';

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
        <SoftphoneProvider>
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
          
          {/* Global Softphone Widget - shows on all pages when minimized */}
          <GlobalSoftphoneWidget />
          
          <Routes>
          {/* Public Legal Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

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
            <Route path="/chat/web" element={<LiveChats />} />
            <Route path="/chat-widget-designer" element={<ChatWidgetDesigner />} />
            <Route path="/widget-management" element={<WidgetManagement />} />
            <Route path="/widget-demo" element={<WidgetDemoPage />} />
            <Route path="/softphone" element={<Softphone />} />
            <Route path="/softphone/setup" element={<SoftphoneSetup />} />
            <Route path="/sip-trunks" element={<SIPTrunks />} />
            <Route path="/outbound-routes" element={<OutboundRoutes />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* AI Routes */}
            <Route path="/ai-agents" element={<AIAgentManager />} />
            <Route path="/websites" element={<WebsiteManagement />} />
            <Route path="/ai-profiles" element={<AIProfileManagement />} />
            
            {/* Channel Routes */}
            <Route path="/websites/:websiteId/channels" element={<ChannelManagement />} />
            
            {/* Admin Routes */}
            <Route path="/admin/tenants" element={<Tenants />} />
            <Route path="/admin/users" element={<SystemUsers />} />
            <Route path="/admin/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/admin/extensions" element={<Extensions />} />
            <Route path="/admin/security" element={<SecurityManagement />} />
            
            {/* Telephony Routes */}
            <Route path="/dids" element={<DIDsManagement />} />
            <Route path="/queue-dashboard" element={<QueueDashboard />} />
            <Route path="/queue-management" element={<QueueManagement />} />
            <Route path="/call-routing" element={<CallRouting />} />
            <Route path="/ivr-builder" element={<IVRBuilder />} />
            <Route path="/dialplan-visualizer" element={<DialplanVisualizer />} />
            <Route path="/call-control" element={<CallControl />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SoftphoneProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
