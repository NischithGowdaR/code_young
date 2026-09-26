/**
 * API Configuration & Base URL
 * - If VITE_API_BASE_URL is set in environment, uses that URL (e.g. https://codeyoung-production-39f3.up.railway.app).
 * - Otherwise defaults to relative path `/api` (which Vite proxies to http://localhost:4000 in local dev).
 */

const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;

const RAW_URL = envUrl || '';

export const API_BASE_URL = RAW_URL.replace(/\/+$/, '');

/**
 * Builds a complete URL for any API endpoint.
 * Example: apiUrl('/api/auth/login') -> '/api/auth/login' (or 'https://your-domain.com/api/auth/login' if configured)
 */
export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!API_BASE_URL) {
    return cleanPath;
  }

  if (API_BASE_URL.endsWith('/api') && cleanPath.startsWith('/api')) {
    return `${API_BASE_URL}${cleanPath.slice(4)}`;
  }

  if (!API_BASE_URL.endsWith('/api') && !cleanPath.startsWith('/api')) {
    return `${API_BASE_URL}/api${cleanPath}`;
  }

  return `${API_BASE_URL}${cleanPath}`;
};
