import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

api.interceptors.request.use((config) => {
  config.headers['x-dev-user-id'] = import.meta.env.VITE_DEV_USER_ID || '123456789';
  config.headers['x-dev-user-name'] = import.meta.env.VITE_DEV_USER_NAME || 'Demo Customer';
  return config;
});

export default api;
