import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  unreadCount: number;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, role: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple JWT decoder for React Native (works on web and native)
function decodeToken(token: string): User | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Replace URL safe characters
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Pad base64 string
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decode base64 - use Buffer or atob depending on environment
    let raw: string;
    if (typeof Buffer !== 'undefined') {
      raw = Buffer.from(base64, 'base64').toString('utf-8');
    } else if (typeof atob === 'function') {
      raw = atob(base64);
    } else {
      // Fallback for environments without atob or Buffer
      raw = decodeURIComponent(escape(
        base64.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      ));
    }

    const decoded = JSON.parse(raw);

    return {
      username: decoded.sub,
      role: decoded.role || 'worker',
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load token on mount
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          const decoded = decodeToken(storedToken);
          if (decoded) {
            setToken(storedToken);
            setUser(decoded);
          } else {
            // Token invalid or expired
            await AsyncStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredAuth();
  }, []);

  // Poll notifications periodically when user is logged in
  useEffect(() => {
    let intervalId: any;
    if (token) {
      refreshNotifications();
      // Poll every 15 seconds to fetch new review alerts
      intervalId = setInterval(() => {
        refreshNotifications();
      }, 15000);
    } else {
      setUnreadCount(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token]);

  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const data = await api.notifications.list(token);
      if (Array.isArray(data)) {
        const unread = data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications for badge:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const data = await api.auth.login({ username, password });
      const jwtToken = data.access_token;
      const decoded = decodeToken(jwtToken);
      
      if (!decoded) {
        throw new Error('Authentication succeeded but token could not be parsed.');
      }

      await AsyncStorage.setItem('auth_token', jwtToken);
      setToken(jwtToken);
      setUser(decoded);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, fullName: string, role: string, password: string) => {
    try {
      // 1. Register user
      await api.auth.register({ username, full_name: fullName, role, password });
      // 2. Automatically log in after registration
      await login(username, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const currentToken = token;

    // Clear local auth state first to avoid UI getting stuck on a failed storage call.
    setToken(null);
    setUser(null);

    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.warn('Failed to remove auth token from storage:', error);
    }

    if (currentToken) {
      // Fire-and-forget server logout to avoid UI hanging on slow networks.
      void api.auth.logout(currentToken).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        unreadCount,
        login,
        register,
        logout,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
