const TELEGRAM_USER_CACHE_KEY = 'meal_preorder_telegram_user_v1';
const AUTH_WAIT_MS = 1600;
const AUTH_POLL_MS = 80;

function hasWindow() {
  return typeof window !== 'undefined';
}

export function getTelegramWebApp() {
  if (!hasWindow() || !window.Telegram) return null;
  return window.Telegram.WebApp || null;
}

function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getTelegramDisplayName(user) {
  if (!user) return '';

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user.username) return `@${user.username}`;

  return '';
}

function normalizeTelegramUser(user) {
  if (!user || user.id == null) return null;

  return {
    id: String(user.id),
    first_name: safeTrim(user.first_name),
    last_name: safeTrim(user.last_name),
    username: safeTrim(user.username).replace(/^@/, ''),
    photo_url: safeTrim(user.photo_url),
  };
}

function readCachedUser() {
  if (!hasWindow()) return null;

  try {
    return normalizeTelegramUser(JSON.parse(localStorage.getItem(TELEGRAM_USER_CACHE_KEY) || 'null'));
  } catch {
    return null;
  }
}

function writeCachedUser(user) {
  if (!hasWindow() || !user) return;

  try {
    localStorage.setItem(TELEGRAM_USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Some Telegram WebViews deny storage; the current in-memory value still works.
  }
}

function parseUserFromInitData(initData) {
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const rawUser = params.get('user');
    if (!rawUser) return null;

    return normalizeTelegramUser(JSON.parse(rawUser));
  } catch {
    return null;
  }
}

function parseUserFromLaunchParams() {
  if (!hasWindow()) return null;

  const locations = [window.location.hash, window.location.search];

  for (const value of locations) {
    if (!value) continue;

    try {
      const params = new URLSearchParams(value.replace(/^[?#]/, ''));
      const initData = params.get('tgWebAppData');
      const user = parseUserFromInitData(initData);
      if (user) return user;
    } catch {
      // Ignore malformed launch params and keep looking.
    }
  }

  return null;
}

export function getTelegramUser(options = {}) {
  const allowCache = options.allowCache !== false;
  const webApp = getTelegramWebApp();

  let user =
    normalizeTelegramUser(webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user);

  if (!user && webApp && webApp.initData) {
    user = parseUserFromInitData(webApp.initData);
  }

  if (!user) {
    user = parseUserFromLaunchParams();
  }

  if (user) {
    writeCachedUser(user);
    return user;
  }

  return allowCache ? readCachedUser() : null;
}

export function isLocalDevelopment() {
  if (import.meta.env.DEV) return true;
  if (!hasWindow()) return false;

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.app.github.dev');
}

export function getDevTelegramUser() {
  if (!isLocalDevelopment()) return null;

  return {
    id: String(import.meta.env.VITE_DEV_USER_ID || '123456789'),
    first_name: safeTrim(import.meta.env.VITE_DEV_USER_NAME || 'Demo User'),
    last_name: '',
    username: safeTrim(import.meta.env.VITE_DEV_USERNAME || 'demo_user'),
    photo_url: '',
  };
}

export async function waitForTelegramUser(maxWaitMs = AUTH_WAIT_MS) {
  const deadline = Date.now() + maxWaitMs;
  let user = getTelegramUser();

  while (!user && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, AUTH_POLL_MS));
    user = getTelegramUser();
  }

  return user;
}

export async function getRequestTelegramUser() {
  const user = await waitForTelegramUser();
  return user || getDevTelegramUser();
}

export function getTelegramHeaders(user) {
  if (!user || !user.id) return {};

  return {
    'x-telegram-user-id': String(user.id),
    'x-telegram-user-name': getTelegramDisplayName(user) || 'Telegram User',
    'x-telegram-first-name': user.first_name || '',
    'x-telegram-last-name': user.last_name || '',
    'x-telegram-username': user.username || '',
  };
}

export function initTelegramWebApp() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  try {
    webApp.ready();
    webApp.expand();
  } catch {
    // Older WebViews may expose a partial Telegram object.
  }
}
