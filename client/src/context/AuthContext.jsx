import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  fetchMe,
  fetchUserEmail,
  decodeJwt,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ps_auth_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ps_user_info');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    const initialToken = localStorage.getItem('ps_auth_token');
    if (initialToken) {
      const decoded = decodeJwt(initialToken);
      if (decoded) {
        return {
          id: decoded.sub,
          email: decoded.email || '',
          username: localStorage.getItem('ps_username') || (decoded.email ? decoded.email.split('@')[0] : 'User'),
          exp: decoded.exp,
        };
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState('login'); // 'login' | 'register'
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());

  const refreshUserEmail = useCallback(async () => {
    try {
      const fetchedEmail = await fetchUserEmail();
      if (fetchedEmail && typeof fetchedEmail === 'string') {
        setUser((prev) => {
          const updated = {
            ...(prev || {}),
            email: fetchedEmail,
          };
          localStorage.setItem('ps_user_info', JSON.stringify(updated));
          return updated;
        });
        return fetchedEmail;
      }
    } catch (err) {
      console.warn('Failed to fetch sender email via GET /email:', err);
    }
    return null;
  }, []);

  const updateApiBaseUrl = useCallback((newUrl) => {
    setApiBaseUrl(newUrl);
    setApiBaseUrlState(newUrl);
  }, []);

  const openAuthModal = useCallback((tab = 'login') => {
    setAuthModalInitialTab(tab);
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  }, []);

  const handleAuthSuccess = useCallback(async (jwtToken, customUsername = null) => {
    setToken(jwtToken);
    localStorage.setItem('ps_auth_token', jwtToken);

    const decoded = decodeJwt(jwtToken);

    let senderEmail = decoded?.email || '';
    try {
      const fetchedEmail = await fetchUserEmail();
      if (fetchedEmail) senderEmail = fetchedEmail;
    } catch {
      // Ignore fallback
    }

    const resolvedUsername =
      customUsername ||
      (senderEmail ? senderEmail.split('@')[0] : `User_${Math.floor(1000 + Math.random() * 9000)}`);

    const userInfo = {
      id: decoded?.sub || 'unknown',
      email: senderEmail,
      username: resolvedUsername,
      exp: decoded?.exp || null,
    };

    setUser(userInfo);
    localStorage.setItem('ps_user_info', JSON.stringify(userInfo));
    localStorage.setItem('ps_username', resolvedUsername);
    setAuthError(null);
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const jwtToken = await loginUser(email, password);
        handleAuthSuccess(jwtToken);
        return { success: true, token: jwtToken };
      } catch (err) {
        const errorMsg = err.message || 'Login failed';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (userName, email, password) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const jwtToken = await registerUser(userName, email, password);
        
        // Backend /register does not set the auth cookie, but /login does.
        // We must log in immediately after registration to receive the session cookie.
        await loginUser(email, password);

        handleAuthSuccess(jwtToken, userName);
        return { success: true, token: jwtToken };
      } catch (err) {
        const errorMsg = err.message || 'Registration failed';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ps_auth_token');
    localStorage.removeItem('ps_user_info');
    setAuthError(null);
  }, []);

  const verifyMe = useCallback(async () => {
    if (!token) {
      throw new Error('No authentication token present');
    }
    return await fetchMe(token);
  }, [token]);

  // Sync token validation & fetch sender email strictly via GET /email on initial mount
  useEffect(() => {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.exp) {
        // check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          console.warn('Session expired. Logging out.');
          logout();
          return;
        }
      }
      refreshUserEmail();
    }
  }, [token, logout, refreshUserEmail]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isLoading,
    authError,
    setAuthError,
    isAuthModalOpen,
    authModalInitialTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    verifyMe,
    apiBaseUrl,
    updateApiBaseUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
