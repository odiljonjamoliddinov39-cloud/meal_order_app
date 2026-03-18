import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

// Check if running in Telegram WebApp
const isTelegram = typeof window !== 'undefined' && window.Telegram?.WebApp;

api.interceptors.request.use((config) => {
  if (isTelegram && window.Telegram.WebApp.initData) {
    // Send Telegram init data for validation
    config.headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
  } else {
    // Fallback to dev headers for local development
    config.headers['x-dev-user-id'] = import.meta.env.VITE_DEV_USER_ID || '123456789';
    config.headers['x-dev-user-name'] = import.meta.env.VITE_DEV_USER_NAME || 'Demo Customer';
  }
  return config;
});

export default api;
