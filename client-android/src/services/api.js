/**
 * API service for Android Client
 * Default target: Online Render server (https://helloagain-reverse-proxy.onrender.com)
 */

export const PRODUCTION_ONLINE_URL = 'https://helloagain-reverse-proxy.onrender.com';
export const PRODUCTION_WS_URL = 'wss://helloagain-reverse-proxy.onrender.com/ws';

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('ha_android_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
    // When running in a web browser on localhost (not inside native Android shell),
    // use relative path to route through Vite proxy and avoid browser CORS blocks
    const isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform?.();
    if (!isNative && window.location.hostname === 'localhost') {
      return '';
    }
  }
  return PRODUCTION_ONLINE_URL;
}

export function setApiBaseUrl(url) {
  if (!url) return;
  const cleaned = url.trim().replace(/\/+$/, '');
  localStorage.setItem('ha_android_api_url', cleaned);
}

export function resetApiBaseUrl() {
  localStorage.removeItem('ha_android_api_url');
}

export function getWsBaseUrl(token = null) {
  const apiUrl = getApiBaseUrl();
  let baseWs = PRODUCTION_WS_URL;
  if (apiUrl) {
    baseWs = apiUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:') + '/ws';
  } else if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    baseWs = `${protocol}//${window.location.host}/ws`;
  }
  if (token && typeof token === 'string' && token.includes('.') && token.split('.').length === 3) {
    const sep = baseWs.includes('?') ? '&' : '?';
    return `${baseWs}${sep}token=${encodeURIComponent(token)}`;
  }
  return baseWs;
}

/**
 * Clean token string helper
 */
function cleanTokenResponse(tokenData) {
  if (typeof tokenData === 'string') {
    return tokenData.replace(/^"(.*)"$/, '$1');
  }
  if (tokenData && tokenData.access_token) {
    return tokenData.access_token;
  }
  return tokenData;
}

/**
 * Safely decodes a JWT without external libraries
 */
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const cleanToken = token.replace(/^"(.*)"$/, '$1');
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Failed to parse JWT payload:', err);
    return null;
  }
}

/**
 * Standardized error message extraction from FastAPI responses
 */
async function parseErrorResponse(response) {
  try {
    const data = await response.json();
    if (data && data.detail) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
      }
      return JSON.stringify(data.detail);
    }
  } catch {}
  return response.statusText || `Request failed with status ${response.status}`;
}

/**
 * Helper to get active saved token
 */
export function getStoredToken() {
  return localStorage.getItem('ha_auth_token') || null;
}

/**
 * Login user via POST /login
 */
export async function loginUser(email, password) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message || 'Authentication Failed');
  }

  const rawToken = await response.json();
  return cleanTokenResponse(rawToken);
}

/**
 * Register user via POST /register
 */
export async function registerUser(userName, email, password) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ userName, email, password }),
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message || 'Registration Failed');
  }

  const rawToken = await response.json();
  return cleanTokenResponse(rawToken);
}

/**
 * Fetch authenticated user info & conversations via GET /userinfo
 */
export async function fetchUserInfo(token = null) {
  const baseUrl = getApiBaseUrl();
  const activeToken = token || getStoredToken();
  const headers = {};
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const response = await fetch(`${baseUrl}/userinfo?_t=${Date.now()}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message || 'Failed to fetch user info');
  }

  return response.json();
}

/**
 * Fetch message history for a recipient via POST/GET /messageHistory?reciever_email_addr=<EMAIL>&limit=<N>&before_id=<ID>
 */
export async function fetchMessageHistory(receiverEmail, token = null, limit = 20, beforeId = null) {
  const baseUrl = getApiBaseUrl();
  const activeToken = token || getStoredToken();
  const encodedEmail = encodeURIComponent(receiverEmail);
  const beforeQuery = beforeId != null ? `&before_id=${beforeId}` : '';
  const headers = {
    'Content-Type': 'application/json',
  };
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const postUrl = `${baseUrl}/messageHistory?reciever_email_addr=${encodedEmail}&limit=${limit}${beforeQuery}&_t=${Date.now()}`;
  const postResponse = await fetch(postUrl, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      reciever_email_addr: receiverEmail,
      limit,
      before_id: beforeId,
    }),
  });

  if (postResponse.ok) {
    return await postResponse.json();
  }

  const errorText = await postResponse.text();
  console.warn(`[api] POST /messageHistory HTTP ${postResponse.status}:`, errorText);
  throw new Error(`Failed to fetch message history (${postResponse.status}): ${errorText || postResponse.statusText}`);
}

/**
 * Health check on server
 */
export async function checkServerHealth(url = null) {
  const target = (url || getApiBaseUrl()).replace(/\/+$/, '');
  const start = Date.now();
  try {
    const res = await fetch(`${target}/`, { method: 'GET', mode: 'cors' });
    const ping = Date.now() - start;
    return { online: res.ok || res.status < 500, ping, status: res.status };
  } catch (err) {
    return { online: false, ping: null, error: err.message };
  }
}
