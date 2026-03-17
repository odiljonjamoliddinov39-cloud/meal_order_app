import { verifyToken } from '../utils/jwt.js';

export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
