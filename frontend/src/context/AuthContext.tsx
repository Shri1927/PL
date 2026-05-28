import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

export type AuthUser = {
  userId: string | number;
  role: string;
  name?: string;
  mobile?: string;
  email?: string;
  customerId?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]                   = useState<AuthUser | null>(null);
  const [loading, setLoading]             = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * On mount, call /auth/me to restore session from the HttpOnly cookie.
   * No localStorage reads — tokens are never accessible to JavaScript.
   */
  useEffect(() => {
    // Proactively clean up legacy storage keys from before the security hardening
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    api.get('/auth/me')
      .then((res) => {
        const profile = res.data?.data;
        if (profile) {
          setUser({
            userId:     profile.userId,
            role:       profile.role,
            name:       profile.name,
            mobile:     profile.mobile,
            email:      profile.email,
            customerId: profile.customerId,
          });
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // 401 = no valid session — user must log in
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Called after a successful login API call from the Login / Register
   * component. The backend has already set the HttpOnly cookies; we just
   * cache the profile data (which was returned in the response body) in
   * React state so the UI renders immediately without a /me round-trip.
   *
   * NOTE: no token or PII is written to localStorage.
   */
  const login = useCallback((userData: AuthUser) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  /**
   * Calls the backend /auth/logout endpoint which clears the HttpOnly cookies
   * server-side, then resets in-memory auth state.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local cleanup even if the request fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Listen for the auth:logout event dispatched by api.ts on 401 failures
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        userRole: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
