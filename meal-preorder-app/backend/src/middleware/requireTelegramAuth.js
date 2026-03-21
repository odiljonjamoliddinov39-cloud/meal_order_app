import crypto from 'crypto';
import prisma from '../lib/prisma.js';

function parseInitData(raw) {
  const params = new URLSearchParams(raw);
  const data = {};

  for (const [key, value] of params.entries()) {
    data[key] = value;
  }

  return data;
}

function buildDataCheckString(raw) {
  const params = new URLSearchParams(raw);
  const pairs = [];

  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue;
    pairs.push([key, value]);
  }

  pairs.sort((a, b) => a[0].localeCompare(b[0]));

  return pairs.map(([key, value]) => `${key}=${value}`).join('\n');
}

function validateTelegramInitData(rawInitData, botToken, maxAgeSeconds = 86400) {
  if (!rawInitData || !botToken) {
    return { ok: false, reason: 'Missing init data or bot token' };
  }

  const parsed = parseInitData(rawInitData);
  const receivedHash = parsed.hash;
  const authDate = Number(parsed.auth_date);

  if (!receivedHash) {
    return { ok: false, reason: 'Missing hash' };
  }

  if (!authDate || Number.isNaN(authDate)) {
    return { ok: false, reason: 'Invalid auth_date' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) {
    return { ok: false, reason: 'Init data expired' };
  }

  const dataCheckString = buildDataCheckString(rawInitData);

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const valid =
    receivedHash.length === computedHash.length &&
    crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(computedHash));

  if (!valid) {
    return { ok: false, reason: 'Invalid signature' };
  }

  let user = null;
  if (parsed.user) {
    try {
      user = JSON.parse(parsed.user);
    } catch {
      return { ok: false, reason: 'Invalid user payload' };
    }
  }

  return {
    ok: true,
    user,
    authDate,
    raw: rawInitData,
  };
}

export default async function requireTelegramAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const rawInitData = authHeader.startsWith('tma ')
      ? authHeader.slice(4)
      : req.headers['x-telegram-init-data'];

    if (!rawInitData) {
      return res.status(401).json({ message: 'Telegram auth required' });
    }

    const result = validateTelegramInitData(
      rawInitData,
      process.env.TELEGRAM_BOT_TOKEN,
      60 * 60 * 24
    );

    if (!result.ok || !result.user?.id) {
      return res.status(401).json({
        message: 'Invalid Telegram auth',
        reason: result.reason,
      });
    }

    const tgUser = result.user;

    const appUser = await prisma.user.upsert({
      where: {
        telegramId: String(tgUser.id),
      },
      update: {
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        username: tgUser.username || null,
        photoUrl: tgUser.photo_url || null,
      },
      create: {
        telegramId: String(tgUser.id),
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        username: tgUser.username || null,
        photoUrl: tgUser.photo_url || null,
        role: 'CUSTOMER',
      },
    });

    req.telegramUser = tgUser;
    req.user = appUser;

    next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({ message: 'Telegram auth failed' });
  }
}