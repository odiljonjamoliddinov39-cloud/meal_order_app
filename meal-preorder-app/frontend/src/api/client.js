import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const tgUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;

  const devUserId = import.meta.env.VITE_DEV_USER_ID;
  const devUserName = import.meta.env.VITE_DEV_USER_NAME;

  const telegramUserId = tgUser?.id || devUserId;
  const telegramUserName =
    tgUser?.first_name ||
    [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') ||
    devUserName ||
    'Demo Customer';

  config.headers = config.headers || {};

  if (telegramUserId) {
    config.headers['x-telegram-user-id'] = String(telegramUserId);
  }

  if (telegramUserName) {
    config.headers['x-telegram-user-name'] = String(telegramUserName);
  }

  return config;
});

export default api;