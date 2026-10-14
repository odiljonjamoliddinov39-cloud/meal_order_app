import { prisma } from './prisma.js';

// "Daily" is counted on the Tashkent calendar day (UTC+5).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

export const dayKey = (date = new Date()) =>
  new Date(date.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);

const seenToday = new Map();

export async function recordActivity(user) {
  const day = dayKey();

  if (seenToday.get(user.id) === day) return;
  seenToday.set(user.id, day);

  if (seenToday.size > 20000) seenToday.clear();

  try {
    await prisma.userActivityDay.upsert({
      where: { userId_day: { userId: user.id, day } },
      update: {},
      create: { userId: user.id, day },
    });
    await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  } catch (error) {
    seenToday.delete(user.id);
    console.error('recordActivity failed:', error?.message || error);
  }
}
