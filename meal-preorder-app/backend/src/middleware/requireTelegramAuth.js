import { prisma } from '../lib/prisma.js';

function readValue(...values) {
  for (const value of values) {
    const raw = Array.isArray(value) ? value[0] : value;
    const text = String(raw || '').trim();

    if (text && text !== 'undefined' && text !== 'null') {
      return text;
    }
  }

  return '';
}

function sanitizeProfileValue(value) {
  return String(value || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export default async function requireTelegramAuth(req, res, next) {
  try {
    const telegramUserId = readValue(
      req.headers['x-telegram-user-id'],
      req.query.telegramUserId
    ).replace(/[^\d]/g, '');

    if (!telegramUserId) {
      return res.status(401).json({
        message: 'Telegram auth required',
      });
    }

    const firstName = sanitizeProfileValue(readValue(
      req.headers['x-telegram-first-name'],
      req.query.telegramFirstName
    ));
    const lastName = sanitizeProfileValue(readValue(
      req.headers['x-telegram-last-name'],
      req.query.telegramLastName
    ));
    const username = sanitizeProfileValue(readValue(
      req.headers['x-telegram-username'],
      req.query.telegramUsername
    ).replace(/^@/, ''));
    const displayName = sanitizeProfileValue(readValue(
      req.headers['x-telegram-user-name'],
      req.query.telegramUserName
    ));
    const fallbackName = username || displayName || `user_${telegramUserId}`;

    req.user = {
      telegramId: telegramUserId,
      firstName: firstName || fallbackName,
      lastName,
      username,
    };

    await prisma.user.upsert({
      where: { telegramId: req.user.telegramId },
      update: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username,
      },
      create: {
        telegramId: req.user.telegramId,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        username: req.user.username,
        role: 'CUSTOMER',
      },
    });

    return next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({
      message: 'Telegram auth middleware failed',
      error: error.message,
    });
  }
}
