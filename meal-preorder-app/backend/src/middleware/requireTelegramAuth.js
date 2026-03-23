export default function requireTelegramAuth(req, res, next) {
  try {
    const telegramUserId =
      req.headers['x-telegram-user-id'] ||
      req.query.telegramUserId;

    const telegramUserName =
      req.headers['x-telegram-user-name'] ||
      req.query.telegramUserName ||
      'Demo Customer';

    // Dev mode bypass
    if (telegramUserId) {
      req.user = {
        telegramId: String(telegramUserId),
        firstName: telegramUserName,
      };
      return next();
    }

    return res.status(401).json({
      message: 'Telegram auth required',
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({
      message: 'Telegram auth middleware failed',
      error: error.message,
    });
  }
}