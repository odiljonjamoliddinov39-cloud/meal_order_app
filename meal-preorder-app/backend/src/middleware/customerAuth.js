import crypto from 'crypto';
import { env } from '../config/env.js';

// Validate Telegram WebApp init data
function validateTelegramInitData(initData) {
  if (!env.telegramBotToken) return null;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256')
    .update(env.telegramBotToken)
    .digest();

  const hmac = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hmac === hash ? Object.fromEntries(urlParams.entries()) : null;
}

export function customerAuth(req, res, next) {
  const telegramInitData = req.headers['x-telegram-init-data'];
  const devUserId = req.headers['x-dev-user-id'];
  const devUserName = req.headers['x-dev-user-name'] || 'Dev User';

  if (telegramInitData) {
    // Validate Telegram init data
    const validatedData = validateTelegramInitData(telegramInitData);
    if (!validatedData || !validatedData.user) {
      return res.status(401).json({ message: 'Invalid Telegram init data' });
    }

    const user = JSON.parse(validatedData.user);
    req.customer = {
      telegramId: String(user.id),
      fullName: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
      username: user.username || null
    };
  } else if (devUserId) {
    // Fallback for development
    req.customer = {
      telegramId: String(devUserId),
      fullName: String(devUserName),
      username: req.headers['x-dev-username'] || null
    };
  } else {
    return res.status(401).json({
      message: 'Customer auth missing. Add Telegram init data or dev headers.'
    });
  }

  next();
}
