export default function requireTelegramAuth(req, res, next) {
  try {
    const telegramUserId =
      req.headers['x-telegram-user-id'] ||
      req.query.telegramUserId;

    if (!telegramUserId) {
      return res.status(401).json({
        message: 'Telegram auth required',
      });
    }

    const firstName =
      req.headers['x-telegram-first-name'] ||
      req.query.telegramFirstName ||
      '';
    const lastName =
      req.headers['x-telegram-last-name'] ||
      req.query.telegramLastName ||
      '';
    const username =
      req.headers['x-telegram-username'] ||
      req.query.telegramUsername ||
      '';
    const displayName =
      req.headers['x-telegram-user-name'] ||
      req.query.telegramUserName ||
      '';

    req.user = {
      telegramId: String(telegramUserId),
      firstName: String(firstName || displayName || '').trim(),
      lastName: String(lastName || '').trim(),
      username: String(username || '').replace(/^@/, '').trim(),
    };

    return next();
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({
      message: 'Telegram auth middleware failed',
      error: error.message,
    });
  }
}
