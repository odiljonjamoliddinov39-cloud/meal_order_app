import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { signAdminToken } from '../utils/jwt.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function loginAdmin(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload', errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
      username: email
    }
  });

  if (!admin || !admin.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signAdminToken({ id: admin.id, role: admin.role, fullName: admin.fullName });
  res.json({ token, admin: { id: admin.id, fullName: admin.fullName, email: admin.username } });
}
