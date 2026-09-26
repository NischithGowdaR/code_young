/**
 * API Configuration & Base URL
 * Defaults to the live deployed Railway backend in production/dev: https://codeyoung-production-39f3.up.railway.app
 * In test environment, uses relative paths so mock spies can assert on standard endpoints.
 */

const isTest =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test');

const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;

const RAW_URL = isTest ? '' : (envUrl || 'https://codeyoung-production-39f3.up.railway.app');

export const API_BASE_URL = RAW_URL.replace(/\/+$/, '');

/**
 * Builds a complete URL for any API endpoint.
 * Example: apiUrl('/api/auth/login') -> 'https://codeyoung-production-39f3.up.railway.app/api/auth/login'
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
