import axios from 'axios';
import { getRequestTelegramUser, getTelegramHeaders } from './telegramAuth.js';

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
  }

  return 'https://mealorderbackend-production.up.railway.app/api';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
});

api.interceptors.request.use(async (config) => {
  const requestUrl = String(config.url || '');
  const isAdminRequest = requestUrl.startsWith('/admin');

  config.headers = config.headers || {};

  if (!isAdminRequest) {
    const telegramUser = await getRequestTelegramUser();
    Object.assign(config.headers, getTelegramHeaders(telegramUser));
  }

  return config;
});

export default api;
