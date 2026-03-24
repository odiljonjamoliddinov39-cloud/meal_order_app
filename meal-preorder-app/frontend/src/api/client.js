import axios from 'axios';

const api = axios.create({
  baseURL: 'https://meal-order-app-n8ec.onrender.com/api',
});

api.interceptors.request.use((config) => {
  let telegramUserId = '123456789';
  let telegramUserName = 'Demo User';

  if (window.Telegram && window.Telegram.WebApp) {
    const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;

    if (tgUser) {
      telegramUserId = tgUser.id;
      telegramUserName =
        tgUser.first_name +
        (tgUser.last_name ? ' ' + tgUser.last_name : '');
    }
  }

  config.headers = config.headers || {};
  config.headers['x-telegram-user-id'] = String(telegramUserId);
  config.headers['x-telegram-user-name'] = String(telegramUserName);

  return config;
});

export default api;