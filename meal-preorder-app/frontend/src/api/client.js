import axios from 'axios';

export function getApiBaseURL() {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const isCodespacesHost = host.endsWith('.app.github.dev');
    const pointsToLocalhost =
      configured?.includes('localhost') || configured?.includes('127.0.0.1');

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

api.interceptors.request.use((config) => {
  let telegramUserId = import.meta.env.VITE_DEV_USER_ID || '123456789';
  let telegramUserName = import.meta.env.VITE_DEV_USER_NAME || 'Demo User';

  if (window.Telegram && window.Telegram.WebApp) {
    const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;

    if (tgUser) {
      telegramUserId = tgUser.id;
      telegramUserName =
        tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '');
    }
  }

  config.headers = config.headers || {};
  config.headers['x-telegram-user-id'] = String(telegramUserId);
  config.headers['x-telegram-user-name'] = String(telegramUserName);

  return config;
});

export default api;
