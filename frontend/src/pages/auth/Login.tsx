
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/api';
import config from '../../config';
import { Phone, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setTokens, setLoading } = useAuthStore();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setLoading(true);

    try {
      // Auto-detect tenant based on email domain
      let tenantId = 'demo-tenant'; // Default
      if (credentials.email.endsWith('@callcenter.com')) {
        tenantId = 'demo-tenant'; // Demo tenant
      } else if (credentials.email.endsWith('@test.com')) {
        tenantId = 'demo-tenant'; // Demo tenant
      }

      console.log('🔐 Attempting login with:', { email: credentials.email, tenantId });
      
      const response = await apiClient.post<any>(
        config.api.auth.login,
        {
          ...credentials,
          tenant_id: tenantId,
        }
      );

      console.log('📥 Full response:', response);
      console.log('📦 response.data:', response.data);
      console.log('📦 response.data.data:', response.data.data);

      // Backend returns { success, data: { access_token, refresh_token, user }, message }
      const responseData = response.data.data || response.data;
      console.log('📦 Using data from:', responseData);
      
      const { access_token, refresh_token, user } = responseData;
      console.log('🔑 Extracted:', { 
        hasToken: !!access_token, 
        hasRefresh: !!refresh_token, 
        hasUser: !!user,
        userRoles: user?.roles 
      });

      if (!access_token || !user) {
        throw new Error('Invalid response: missing access_token or user');
      }

      // Extract role from roles array (use first role if multiple)
      const userWithRole = {
        ...user,
        role: user.roles?.[0]?.role || undefined,
        tenant_id: user.roles?.[0]?.tenant_id || tenantId,
      };
      
      console.log('👤 User with role:', userWithRole);

      setTokens(access_token, refresh_token);
      setUser(userWithRole);
      navigate('/');
    } catch (err: any) {
      console.error('❌ Login error FULL:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error message:', err.message);
      
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.message ||
        'Invalid email or password'
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CallCenter</h1>
            <p className="text-sm text-gray-600">Sign in to your account</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input"
            placeholder="Enter your email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="input"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
          <p className="text-sm font-medium text-blue-900 mb-2">Test Credentials:</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Superadmin:</strong> admin@callcenter.com / password123</p>
            <p><strong>Manager:</strong> manager@test.com / password123</p>
            <p><strong>Agent:</strong> agent100@test.com / password123</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          CallCenter Management System v1.0
        </p>
      </div>
    </div>
  );
}
