import { create } from 'zustand';
import type { User } from '../types';
import { decodeJWT } from '../lib/jwt';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initFromStorage: () => void;
}

// Initialize user from token on store creation
const initializeUser = () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    const payload = decodeJWT(token);
    if (payload) {
      return {
        id: payload.user_id,
        email: payload.email,
        role: payload.role as any,
        tenant_id: payload.tenant_id,
        first_name: '',
        last_name: '',
        created_at: '',
        updated_at: '',
      };
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: initializeUser(),
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  setUser: (user) => {
    console.log('💾 Setting user:', user);
    set({ user, isAuthenticated: true });
  },
  
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Decode JWT to get role and tenant_id
    const payload = decodeJWT(accessToken);
    
    set((state) => ({ 
      accessToken, 
      refreshToken, 
      isAuthenticated: true,
      // Update user with decoded token data
      user: state.user ? {
        ...state.user,
        role: payload?.role as any,
        tenant_id: payload?.tenant_id,
      } : null,
    }));
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false 
    });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Initialize user from stored token
  initFromStorage: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = decodeJWT(token);
      if (payload) {
        set({
          user: {
            id: payload.user_id,
            email: payload.email,
            role: payload.role as any,
            tenant_id: payload.tenant_id,
            first_name: '',
            last_name: '',
            created_at: '',
            updated_at: '',
          },
          isAuthenticated: true,
        });
      }
    }
  },
}));
