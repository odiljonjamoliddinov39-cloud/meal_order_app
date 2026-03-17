// Placeholder for Telegram Mini App initData validation.
// For development, you can pass x-dev-user-id and x-dev-user-name headers.

export function customerAuth(req, res, next) {
  const devUserId = req.headers['x-dev-user-id'];
  const devUserName = req.headers['x-dev-user-name'] || 'Dev User';

  if (!devUserId) {
    return res.status(401).json({
      message: 'Customer auth missing. Add Telegram validation or dev headers.'
    });
  }

  req.customer = {
    telegramId: String(devUserId),
    fullName: String(devUserName),
    username: req.headers['x-dev-username'] || null
  };

  next();
}
