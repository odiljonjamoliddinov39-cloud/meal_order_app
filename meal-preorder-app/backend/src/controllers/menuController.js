import dayjs from 'dayjs';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const createMenuDaySchema = z.object({
  date: z.string(),
  orderDeadline: z.string(),
  isOpen: z.boolean().optional().default(true)
});

const createMenuItemSchema = z.object({
  menuDayId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  price: z.number().positive(),
  plannedQuantity: z.number().int().positive(),
  isActive: z.boolean().optional().default(true)
});

export async function getMenuDays(req, res) {
  const days = await prisma.menuDay.findMany({
    where: { date: { gte: dayjs().startOf('day').toDate() } },
    orderBy: { date: 'asc' },
    include: { items: true }
  });
  res.json(days);
}

export async function getMenuItemsByDate(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date query is required' });

  const start = dayjs(String(date)).startOf('day').toDate();
  const end = dayjs(String(date)).endOf('day').toDate();

  const menuDay = await prisma.menuDay.findFirst({
    where: { date: { gte: start, lte: end } },
    include: { items: true }
  });

  if (!menuDay) return res.status(404).json({ message: 'Menu day not found' });
  res.json(menuDay);
}

export async function createMenuDay(req, res) {
  const parsed = createMenuDaySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const date = new Date(parsed.data.date);
  const orderDeadline = new Date(parsed.data.orderDeadline);

  // Check if a menu day already exists for this date
  const existingDay = await prisma.menuDay.findFirst({
    where: { date: date }
  });

  if (existingDay) {
    return res.status(409).json({ message: 'A menu day already exists for this date' });
  }

  const day = await prisma.menuDay.create({
    data: {
      date: date,
      orderDeadline: orderDeadline,
      isOpen: parsed.data.isOpen
    }
  });

  res.status(201).json(day);
}

export async function createMenuItem(req, res) {
  const parsed = createMenuItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const item = await prisma.menuItem.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null
    }
  });

  res.status(201).json(item);
}

export async function updateMenuItem(req, res) {
  const itemId = req.params.id;
  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: req.body
  });

  res.json(item);
}
