import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export function requireAdminAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ message: 'Admin login required' });
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET is required for admin auth');
    return res.status(500).json({ message: 'Admin auth is not configured' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Admin session expired' });
  }
}
