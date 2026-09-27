/**
 * API Configuration & Base URL
 * - If VITE_API_BASE_URL is set in environment, uses that URL.
 * - Otherwise defaults to your live deployed Render backend: https://code-young.onrender.com
 */

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;

const RAW_URL = envUrl || (isLocal ? 'http://localhost:4000' : 'https://code-young.onrender.com');

export const API_BASE_URL = RAW_URL.replace(/\/+$/, '');

/**
 * Builds a complete URL for any API endpoint.
 * Example: apiUrl('/api/auth/login') -> 'https://code-young.onrender.com/api/auth/login'
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
