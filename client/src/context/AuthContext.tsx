import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: 'PARENT' | 'MENTOR' | 'ADMIN';
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | undefined>;
  sendRegistrationOtp: (
    email: string,
    name?: string
  ) => Promise<{ message: string; cooldownSeconds: number }>;
  register: (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    timezone?: string,
    otpCode?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { apiUrl } from '../config/api.js';

const API_BASE = apiUrl('/api/auth');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap initial auth using HTTP-only cookie refresh
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setAccessToken(data.accessToken);
        }
      } catch {
        // Not logged in or refresh token invalid/expired
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const safeParseJson = async (res: Response) => {
    try {
      if (typeof res.text === 'function') {
        const text = await res.text();
        if (!text || !text.trim()) {
          return {};
        }
        try {
          return JSON.parse(text);
        } catch {
          // If JSON parse fails, check if res.json is mock-defined
          if (typeof res.json === 'function') {
            try {
              return await res.json();
            } catch {
              // fallback
            }
          }
          throw new Error(
            res.ok
              ? 'Invalid response from server'
              : `Server returned error (${res.status} ${res.statusText || 'Error'}). Please make sure the backend server is running on port 4000.`
          );
        }
      }
      if (typeof res.json === 'function') {
        return await res.json();
      }
      return {};
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Failed to parse server response');
    }
  };

  const sendRegistrationOtp = async (email: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/send-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send registration OTP');
      }

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      return data.user as User;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    timezone?: string,
    otpCode?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phoneNumber, timezone, otpCode }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
      });
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        error,
        login,
        sendRegistrationOtp,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
