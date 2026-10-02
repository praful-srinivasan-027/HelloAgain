import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  fetchUserInfo,
  decodeJwt,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/api';

const AuthContext = createContext(null);

/**
 * Parse /userinfo 'all conversation' tuples into clean contact objects.
 * Backend returns: [username, email, conv_id]
 * Fallback:        [email, conv_id]
 */
function parseContacts(rawList) {
  if (!Array.isArray(rawList)) return [];
  const contacts = [];
  const seenEmails = new Set();

  for (const item of rawList) {
    if (!item || !Array.isArray(item)) continue;
    let username = null;
    let email = null;

    if (item.length >= 3) {
      username = item[0] ? String(item[0]).trim() : null;
      email = item[1] ? String(item[1]).trim().toLowerCase() : null;
    } else if (item.length >= 1) {
      email = item[0] ? String(item[0]).trim().toLowerCase() : null;
    }

    if (!email || !email.includes('@')) continue;
    if (seenEmails.has(email)) continue;
    seenEmails.add(email);

    contacts.push({
      id: email,
      email,
      username: username || null,
    });
  }

  return contacts;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('ps_auth_token');
    return t && t.split('.').length === 3 ? t : null;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ps_user_info');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Single source of truth for known contacts from backend /userinfo
  // NEVER persisted in localStorage to prevent stale cache conflicts.
  const [contacts, setContacts] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState('login');
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());

  const refreshUserInfo = useCallback(async () => {
    try {
      const data = await fetchUserInfo();
      if (!data) return null;

      if (data.email) {
        setUser((prev) => {
          const updated = {
            id: data.id != null ? String(data.id) : prev?.id,
            email: data.email,
            username: data.username || prev?.username || data.email.split('@')[0],
          };
          localStorage.setItem('ps_user_info', JSON.stringify(updated));
          return updated;
        });
      }

      if (data['all conversation']) {
        const parsed = parseContacts(data['all conversation']);
        setContacts(parsed);
      }

      return data;
    } catch (err) {
      console.warn('[AuthContext] /userinfo fetch error:', err.message);
      return null;
    }
  }, []);

  // On mount: check token expiration & fetch fresh user info from backend
  useEffect(() => {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded?.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        console.warn('[AuthContext] Token expired, resetting session');
        setToken(null);
        setUser(null);
        setContacts([]);
        localStorage.removeItem('ps_auth_token');
        localStorage.removeItem('ps_user_info');
        return;
      }
    }
    refreshUserInfo();
  }, [refreshUserInfo, token]);

  const handleAuthSuccess = useCallback(async (jwtToken, registeredUsername = null) => {
    if (jwtToken && typeof jwtToken === 'string' && jwtToken.split('.').length === 3) {
      setToken(jwtToken);
      localStorage.setItem('ps_auth_token', jwtToken);
    }

    const data = await refreshUserInfo();

    // If /userinfo succeeded, user & contacts are already set.
    // If not, decode token as fallback.
    if (!data && jwtToken) {
      const decoded = decodeJwt(jwtToken);
      if (decoded) {
        const fallbackUser = {
          id: decoded.sub || decoded.id,
          email: decoded.email || '',
          username: registeredUsername || decoded.email?.split('@')[0] || 'User',
        };
        setUser(fallbackUser);
        localStorage.setItem('ps_user_info', JSON.stringify(fallbackUser));
      }
    }

    setAuthError(null);
    setIsAuthModalOpen(false);
  }, [refreshUserInfo]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const jwt = await loginUser(email, password);
      await handleAuthSuccess(jwt);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const register = useCallback(async (userName, email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const jwt = await registerUser(userName, email, password);
      // Establish session cookie
      await loginUser(email, password);
      await handleAuthSuccess(jwt, userName);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setContacts([]);
    localStorage.removeItem('ps_auth_token');
    localStorage.removeItem('ps_user_info');
    setAuthError(null);
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

  const updateApiBaseUrl = useCallback((url) => {
    setApiBaseUrl(url);
    setApiBaseUrlState(url);
  }, []);

  const value = {
    token,
    user,
    contacts,
    isAuthenticated: Boolean(token || user?.email),
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
    refreshUserInfo,
    apiBaseUrl,
    updateApiBaseUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
