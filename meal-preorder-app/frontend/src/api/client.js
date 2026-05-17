import axios from 'axios';
import { getRequestTelegramUser, getTelegramHeaders } from './telegramAuth.js';

const PRODUCTION_API_FALLBACK = 'https://mealorderbackend-production.up.railway.app/api';

export function getApiBaseURL() {
  const configured = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim() : '';

  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const isCodespacesHost = host.endsWith('.app.github.dev');
    const pointsToLocalhost =
      configured.includes('localhost') || configured.includes('127.0.0.1');

    if (isCodespacesHost && (!configured || pointsToLocalhost)) {
      const apiHost = host.replace(/-\d+\.app\.github\.dev$/, '-4000.app.github.dev');
      return `${protocol}//${apiHost}/api`;
    }

    if (isLocalHost) {
      return configured || 'http://localhost:4000/api';
    }

    if (configured && !pointsToLocalhost) {
      return configured;
    }

    return PRODUCTION_API_FALLBACK;
  }

  return configured || PRODUCTION_API_FALLBACK;
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const requestUrl = String(config.url || '');
  const isAdminRequest = requestUrl.startsWith('/admin');
  const isAdminLoginRequest = requestUrl === '/admin/login';
  const isMenuReadRequest =
    config.method?.toLowerCase() === 'get' && requestUrl.startsWith('/menu');

  config.headers = config.headers || {};

  if (config.method?.toLowerCase() === 'get') {
    config.headers['cache-control'] = 'no-cache';
    config.headers.pragma = 'no-cache';
  }

  if (isAdminRequest && !isAdminLoginRequest) {
    const token = localStorage.getItem('adminToken');

    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
  }

  if (!isAdminRequest && !isMenuReadRequest) {
    const telegramUser = await getRequestTelegramUser();
    Object.assign(config.headers, getTelegramHeaders(telegramUser));
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error?.config?.url || '');

    if (
      error?.response?.status === 401 &&
      requestUrl.startsWith('/admin') &&
      requestUrl !== '/admin/login'
    ) {
      localStorage.removeItem('adminToken');

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
        window.location.assign('/admin/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
