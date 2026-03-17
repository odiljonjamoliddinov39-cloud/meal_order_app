import dayjs from 'dayjs';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const createOrderSchema = z.object({
  menuDayId: z.string(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive()
  })).min(1)
});

async function upsertCustomer(customer) {
  return prisma.user.upsert({
    where: { telegramId: customer.telegramId },
    update: {
      fullName: customer.fullName,
      username: customer.username
    },
    create: {
      telegramId: customer.telegramId,
      fullName: customer.fullName,
      username: customer.username,
      role: 'CUSTOMER'
    }
  });
}

export async function createOrder(req, res) {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const customer = await upsertCustomer(req.customer);
  const { menuDayId, items } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const menuDay = await tx.menuDay.findUnique({
      where: { id: menuDayId },
      include: { items: true }
    });

    if (!menuDay) throw new Error('Menu day not found');
    if (!menuDay.isOpen) throw new Error('Ordering is closed for this day');
    if (dayjs().isAfter(dayjs(menuDay.orderDeadline))) throw new Error('Deadline passed');

    let totalAmount = 0;
    const orderItemsData = [];

    for (const requested of items) {
      const dbItem = menuDay.items.find((x) => x.id === requested.menuItemId && x.isActive);
      if (!dbItem) throw new Error('Menu item not found');

      const remaining = dbItem.plannedQuantity - dbItem.orderedQuantity;
      if (requested.quantity > remaining) {
        throw new Error(`Not enough stock for ${dbItem.name}`);
      }

      const subtotal = Number(dbItem.price) * requested.quantity;
      totalAmount += subtotal;

      await tx.menuItem.update({
        where: { id: dbItem.id },
        data: { orderedQuantity: { increment: requested.quantity } }
      });

      orderItemsData.push({
        menuItemId: dbItem.id,
        quantity: requested.quantity,
        priceAtOrderTime: dbItem.price,
        subtotal
      });
    }

    const order = await tx.order.create({
      data: {
        userId: customer.id,
        menuDayId,
        totalAmount,
        status: 'CONFIRMED',
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: { include: { menuItem: true } },
        menuDay: true
      }
    });

    return order;
  });

  res.status(201).json(result);
}

export async function getMyOrders(req, res) {
  const customer = await prisma.user.findUnique({
    where: { telegramId: req.customer.telegramId }
  });

  if (!customer) return res.json([]);

  const orders = await prisma.order.findMany({
    where: { userId: customer.id },
    include: {
      items: { include: { menuItem: true } },
      menuDay: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(orders);
}

export async function getAdminOrders(req, res) {
  const { date } = req.query;
  const where = {};

  if (date) {
    where.menuDay = {
      date: {
        gte: dayjs(String(date)).startOf('day').toDate(),
        lte: dayjs(String(date)).endOf('day').toDate()
      }
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: true,
      menuDay: true,
      items: { include: { menuItem: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(orders);
}
