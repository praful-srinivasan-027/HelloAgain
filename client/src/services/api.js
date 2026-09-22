/**
 * API service for communicating with the FastAPI backend
 * Endpoints:
 * - POST /login -> { email, password } -> returns JWT token string
 * - POST /register -> { userName, email, password } -> returns JWT token string
 * - GET /me -> requires Authorization: Bearer <token> -> returns "hi"
 * - GET / -> health check
 */

export const DEFAULT_API_URL = '';

export function getApiBaseUrl() {
  const custom = localStorage.getItem('ps_api_url');
  if (custom !== null && custom !== undefined) {
    return custom;
  }
  return DEFAULT_API_URL;
}

export function setApiBaseUrl(url) {
  if (url === undefined || url === null) return;
  const cleaned = url.replace(/\/+$/, '');
  localStorage.setItem('ps_api_url', cleaned);
}

/**
 * Safely decodes a JWT without external libraries
 */
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    // Some responses might wrap string in quotes if raw string returned
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
        // FastAPI 422 validation errors array
        return data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
      }
      return JSON.stringify(data.detail);
    }
  } catch {
    // If not JSON
  }
  return response.statusText || `Request failed with status ${response.status}`;
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
 * Login user via POST /login
 */
export async function loginUser(email, password) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * Note: Backend schema uses `userName`, `email`, `password`
 */
export async function registerUser(userName, email, password) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * Fetch current user info via GET /me
 */
export async function fetchMe(token) {
  const baseUrl = getApiBaseUrl();
  const cleanToken = cleanTokenResponse(token);
  const response = await fetch(`${baseUrl}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
    },
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message || 'Could not validate credentials');
  }

  return response.json();
}

/**
 * Health check via GET /
 */
export async function checkBackendHealth() {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}
