import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiUrl } from '../config/api.js';

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
    otpCode?: string,
    confirmPassword?: string
  ) => Promise<void>;
  sendForgotPasswordOtp: (
    email: string
  ) => Promise<{ message: string; cooldownSeconds: number }>;
  verifyForgotPasswordOtp: (
    email: string,
    otpCode: string
  ) => Promise<{ message: string; resetToken: string }>;
  resetPassword: (
    email: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ message: string; user: User }>;
  logout: () => Promise<void>;
  clearError: () => void;
  setAuthSession: (user: User, token: string, refreshToken?: string | null) => void;
}

const STORAGE_ACCESS_TOKEN_KEY = 'cy_access_token';
const STORAGE_REFRESH_TOKEN_KEY = 'cy_refresh_token';
const STORAGE_USER_KEY = 'cy_auth_user';

const getInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = apiUrl('/api/auth');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [accessToken, setAccessToken] = useState<string | null>(getInitialToken);
  const [isLoading, setIsLoading] = useState<boolean>(!getInitialToken());
  const [error, setError] = useState<string | null>(null);

  const persistSession = (u: User | null, token: string | null, rToken?: string | null) => {
    setUser(u);
    setAccessToken(token);
    try {
      if (u && token) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u));
        localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, token);
        if (rToken) {
          localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, rToken);
        }
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
        localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
      }
    } catch {
      // ignore storage errors
    }
  };

  // Bootstrap initial auth using cached token / /me check / HTTP-only cookie refresh
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const cachedToken = localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
      const cachedRefreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);

      // If we have an existing access token, verify with /me first
      if (cachedToken) {
        try {
          const meRes = await fetch(`${API_BASE}/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cachedToken}`,
            },
            credentials: 'include',
          });

          if (meRes.ok) {
            const meData = await meRes.json();
            if (isMounted && meData.user) {
              persistSession(meData.user, cachedToken, cachedRefreshToken);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // If /me network failure, we still keep local session to avoid sudden logout
        }
      }

      // Try refreshing session with cookie / refresh token
      try {
        const res = await fetch(`${API_BASE}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: cachedRefreshToken || undefined }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            persistSession(data.user, data.accessToken, data.refreshToken || cachedRefreshToken);
          }
        } else if (res.status === 401 && !cachedToken) {
          if (isMounted) {
            persistSession(null, null, null);
          }
        }
      } catch {
        // Not logged in or refresh token invalid/expired
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
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
        credentials: 'include',
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
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      persistSession(data.user, data.accessToken, data.refreshToken);
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
    otpCode?: string,
    confirmPassword?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword, phoneNumber, timezone, otpCode }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      persistSession(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendForgotPasswordOtp = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        const errorMsg =
          data.message ||
          data.error ||
          (res.status === 404
            ? 'No account found with this email address. Please register first.'
            : 'Failed to send password reset OTP');
        throw new Error(errorMsg);
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

  const verifyForgotPasswordOtp = async (email: string, otpCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        const errorMsg =
          data.message || data.error || 'Invalid or expired OTP. Please try again.';
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, resetToken, newPassword, confirmPassword }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        const errorMsg =
          data.message || data.error || 'Failed to reset password. Please try again.';
        throw new Error(errorMsg);
      }

      if (data.user && data.accessToken) {
        persistSession(data.user, data.accessToken, data.refreshToken);
      }

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const rToken = localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY);
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: rToken || undefined }),
      });
    } catch {
      // Ignore errors on logout
    } finally {
      persistSession(null, null, null);
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
        sendForgotPasswordOtp,
        verifyForgotPasswordOtp,
        resetPassword,
        logout,
        clearError,
        setAuthSession: persistSession,
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

