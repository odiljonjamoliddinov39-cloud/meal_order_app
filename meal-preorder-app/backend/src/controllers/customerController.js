import { prisma } from '../lib/prisma.js';

const getUserDisplayName = (user) => {
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  if (fullName) return fullName;
  if (user?.username) return `@${user.username}`;
  return '';
};

const serializeItem = (item) => ({
  id: item.id,
  name: item.name,
  description: item.description || '',
  price: Number(item.price || 0),
  imageUrl: item.imageUrl || null,
  availableQuantity: Number(item.plannedQuantity || 0) - Number(item.orderedQuantity || 0),
  plannedQuantity: Number(item.plannedQuantity || 0),
  orderedQuantity: Number(item.orderedQuantity || 0),
  date: item.menuDay?.date?.toISOString?.().slice(0, 10),
  type: item.type || 'meal',
});

const serializeOrder = (order) => ({
  id: order.id,
  totalAmount: Number(order.totalAmount || 0),
  createdAt: order.createdAt,
  customerName: getUserDisplayName(order.user),
  telegramId: order.user?.telegramId || '',
  username: order.user?.username || '',
  items: (order.items || []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    price: Number(item.priceAtOrderTime || 0),
    name: item.menuItem?.name || '',
    type: item.menuItem?.type || 'meal',
    menuItem: {
      id: item.menuItem?.id,
      name: item.menuItem?.name || '',
      price: Number(item.priceAtOrderTime || 0),
      type: item.menuItem?.type || 'meal',
    },
  })),
});

export const getMenuDays = async (req, res) => {
  try {
    const days = await prisma.menuDay.findMany({
      where: { isOpen: true },
      include: {
        items: {
          where: { isActive: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    return res.json(
      days.map((day) => ({
        id: day.id,
        date: day.date.toISOString().slice(0, 10),
        label: day.date.toISOString().slice(0, 10),
        itemsCount: day.items.length,
      }))
    );
  } catch (error) {
    console.error('getMenuDays error:', error);
    return res.status(500).json({ message: 'Failed to fetch menu days' });
  }
};

export const getMenuItemsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date query is required' });
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const day = await prisma.menuDay.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        isOpen: true,
      },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!day) return res.json([]);

    return res.json(day.items.map((item) => serializeItem({ ...item, menuDay: day })));
  } catch (error) {
    console.error('getMenuItemsByDate error:', error);
    return res.status(500).json({ message: 'Failed to fetch menu items' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items } = req.body || {};
    const safeItems = Array.isArray(items) ? items : [];

    if (safeItems.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const telegramId = String(req.user?.telegramId || '');
    const firstName = req.user?.firstName || '';
    const lastName = req.user?.lastName || '';
    const username = req.user?.username || '';

    if (!telegramId) {
      return res.status(401).json({ message: 'Telegram auth required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { telegramId },
        update: { firstName, lastName, username },
        create: {
          telegramId,
          firstName,
          lastName,
          username,
          role: 'CUSTOMER',
        },
      });

      const requestedItems = new Map();

      for (const rawItem of safeItems) {
        const itemId = String(rawItem.itemId || rawItem.id || '');
        const quantity = Math.trunc(Number(rawItem.quantity || 0));

        if (!itemId || quantity <= 0) continue;

        requestedItems.set(itemId, (requestedItems.get(itemId) || 0) + quantity);
      }

      const normalized = [];

      for (const [itemId, quantity] of requestedItems.entries()) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: itemId },
          include: { menuDay: true },
        });

        if (!menuItem || !menuItem.isActive || !menuItem.menuDay?.isOpen) continue;

        const available =
          Number(menuItem.plannedQuantity || 0) - Number(menuItem.orderedQuantity || 0);

        if (available < quantity) {
          throw new Error(`Not enough quantity for ${menuItem.name}`);
        }

        normalized.push({
          menuItem,
          quantity,
          price: Number(menuItem.price),
          subtotal: Number(menuItem.price) * quantity,
        });
      }

      if (normalized.length === 0) {
        throw new Error('No valid items in order');
      }

      const menuDayId = normalized[0].menuItem.menuDayId;

      const allSameDay = normalized.every((item) => item.menuItem.menuDayId === menuDayId);
      if (!allSameDay) {
        throw new Error('All order items must be from the same menu day');
      }

      const totalAmount = normalized.reduce((sum, item) => sum + item.subtotal, 0);

      for (const item of normalized) {
        const reserved = await tx.menuItem.updateMany({
          where: {
            id: item.menuItem.id,
            isActive: true,
            orderedQuantity: {
              lte: Number(item.menuItem.plannedQuantity || 0) - item.quantity,
            },
            menuDay: {
              is: {
                isOpen: true,
              },
            },
          },
          data: {
            orderedQuantity: {
              increment: item.quantity,
            },
          },
        });

        if (reserved.count !== 1) {
          throw new Error(`Not enough quantity for ${item.menuItem.name}`);
        }
      }

      const order = await tx.order.create({
        data: {
          userId: user.id,
          menuDayId,
          totalAmount,
          status: 'CONFIRMED',
          items: {
            create: normalized.map((item) => ({
              menuItemId: item.menuItem.id,
              quantity: item.quantity,
              priceAtOrderTime: item.price,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          user: true,
          items: {
            include: { menuItem: true },
          },
        },
      });

      return order;
    });

    return res.status(201).json({
      message: 'Order created successfully',
      order: serializeOrder(result),
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(400).json({ message: error.message || 'Failed to create order' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const telegramId = String(req.user?.telegramId || '');

    const orders = await prisma.order.findMany({
      where: {
        user: { telegramId },
      },
      include: {
        user: true,
        items: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};
