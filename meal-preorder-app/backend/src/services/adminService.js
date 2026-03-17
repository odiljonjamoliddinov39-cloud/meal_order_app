import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

export async function ensureSeedAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.adminSeedPassword, 10);

  return prisma.user.create({
    data: {
      fullName: 'Admin',
      role: 'ADMIN',
      phone: null,
      username: env.adminSeedEmail,
      passwordHash
    }
  });
}
