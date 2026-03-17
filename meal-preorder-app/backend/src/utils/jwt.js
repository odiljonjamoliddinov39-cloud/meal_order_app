import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAdminToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
