import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  fetchMe,
  fetchUserEmail,
  fetchUserInfo,
  decodeJwt,
  getApiBaseUrl,
  setApiBaseUrl,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ps_auth_token') || null);
  const [userConversations, setUserConversations] = useState([]);
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

  const refreshUserInfoData = useCallback(async () => {
    try {
      const data = await fetchUserInfo();
      if (data && data.email) {
        setUser((prev) => {
          const updated = {
            id: prev?.id || 'unknown',
            email: data.email,
            username: data.username || prev?.username || (data.email ? data.email.split('@')[0] : 'User'),
            exp: prev?.exp || null,
          };
          localStorage.setItem('ps_user_info', JSON.stringify(updated));
          return updated;
        });
        if (data['all conversation']) {
          setUserConversations(data['all conversation']);
        }
        return data;
      }
    } catch (err) {
      console.warn('Failed to fetch user info via GET /userinfo:', err);
    }
    return null;
  }, []);

  const refreshUserEmail = useCallback(async () => {
    await refreshUserInfoData();
  }, [refreshUserInfoData]);

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
    if (jwtToken) {
      setToken(jwtToken);
      localStorage.setItem('ps_auth_token', jwtToken);
    }

    const decoded = jwtToken ? decodeJwt(jwtToken) : null;
    const userId = decoded?.sub || 'unknown';

    let senderEmail = decoded?.email || '';
    let fetchedData = null;
    try {
      fetchedData = await fetchUserInfo();
      if (fetchedData?.email) senderEmail = fetchedData.email;
      if (fetchedData?.['all conversation']) setUserConversations(fetchedData['all conversation']);
    } catch {
      // Fallback if userinfo fails
    }

    const resolvedUsername =
      customUsername ||
      fetchedData?.username ||
      (senderEmail ? senderEmail.split('@')[0] : `User_${Math.floor(1000 + Math.random() * 9000)}`);

    const userInfo = {
      id: userId !== 'unknown' ? userId : (user?.id || '1'),
      email: senderEmail || user?.email || '',
      username: resolvedUsername,
      exp: decoded?.exp || null,
    };

    setUser(userInfo);
    localStorage.setItem('ps_user_info', JSON.stringify(userInfo));
    localStorage.setItem('ps_username', resolvedUsername);
    setAuthError(null);
    setIsAuthModalOpen(false);
  }, [user]);

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const jwtToken = await loginUser(email, password);
        await handleAuthSuccess(jwtToken);
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

        await handleAuthSuccess(jwtToken, userName);
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
    setUserConversations([]);
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

  // Sync token validation & fetch user info strictly via GET /userinfo on initial mount
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
      refreshUserInfoData();
    } else {
      // Try fetching userinfo with HttpOnly cookie
      refreshUserInfoData();
    }
  }, [token, logout, refreshUserInfoData]);

  const value = {
    token,
    user,
    userConversations,
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
    verifyMe,
    apiBaseUrl,
    updateApiBaseUrl,
    refreshUserInfoData,
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
