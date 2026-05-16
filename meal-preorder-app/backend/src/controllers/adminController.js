import { prisma } from '../lib/prisma.js';
import { clearDiagnostics, getDiagnostics } from '../lib/diagnostics.js';

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
  plannedQuantity: Number(item.plannedQuantity || 0),
  orderedQuantity: Number(item.orderedQuantity || 0),
  availableQuantity:
    Number(item.plannedQuantity || 0) - Number(item.orderedQuantity || 0),
  type: item.type || 'meal',
  isActive: item.isActive,
  menuDayId: item.menuDayId,
});

const serializeDay = (day) => ({
  id: day.id,
  date: day.date.toISOString().slice(0, 10),
  isOpen: day.isOpen,
  items: (day.items || []).map(serializeItem),
});

const serializeOrder = (order) => ({
  id: order.id,
  status: order.status,
  totalAmount: Number(order.totalAmount || 0),
  createdAt: order.createdAt,
  customerName: getUserDisplayName(order.user),
  telegramId: order.user?.telegramId || '',
  username: order.user?.username || '',
  items: (order.items || []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    price: Number(item.priceAtOrderTime || 0),
    subtotal: Number(item.subtotal || 0),
    name: item.menuItem?.name || '',
    type: item.menuItem?.type || 'meal',
  })),
});

const validOrderStatuses = new Set(['PENDING', 'CONFIRMED', 'CANCELLED']);

const isRecordNotFound = (error) => error?.code === 'P2025';

const orderInclude = {
  user: true,
  items: {
    include: { menuItem: true },
  },
};

const applyOrderInventoryDelta = async (tx, items, multiplier) => {
  for (const item of items || []) {
    const menuItemId = item.menuItemId || item.menuItem?.id;
    const delta = Number(item.quantity || 0) * multiplier;

    if (!menuItemId || delta === 0) continue;

    const menuItem = await tx.menuItem.findUnique({
      where: { id: menuItemId },
      select: {
        name: true,
        plannedQuantity: true,
        orderedQuantity: true,
      },
    });

    if (!menuItem) continue;

    const currentOrdered = Number(menuItem.orderedQuantity || 0);

    if (delta > 0) {
      const available = Number(menuItem.plannedQuantity || 0) - currentOrdered;
      if (available < delta) {
        throw new Error(`Not enough quantity for ${menuItem.name}`);
      }
    }

    await tx.menuItem.update({
      where: { id: menuItemId },
      data: {
        orderedQuantity: Math.max(0, currentOrdered + delta),
      },
    });
  }
};

export const getAdminMenuDays = async (req, res) => {
  try {
    const days = await prisma.menuDay.findMany({
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    return res.json(days.map(serializeDay));
  } catch (error) {
    console.error('getAdminMenuDays error:', error);
    return res.status(500).json({ message: 'Failed to load admin menu days' });
  }
};

export const createAdminMenuDay = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const orderDeadline = new Date(`${date}T23:59:59.000Z`);

    const day = await prisma.menuDay.create({
      data: {
        date: new Date(`${date}T00:00:00.000Z`),
        orderDeadline,
        isOpen: true,
      },
      include: { items: true },
    });

    return res.status(201).json(serializeDay(day));
  } catch (error) {
    console.error('createAdminMenuDay error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Menu day already exists' });
    }

    return res.status(500).json({ message: 'Failed to create menu day' });
  }
};

export const createAdminMenuItem = async (req, res) => {
  try {
    const {
      dayId,
      menuDayId,
      name,
      description,
      price,
      plannedQuantity,
      quantity,
      imageUrl,
      type,
    } = req.body;

    const finalDayId = dayId || menuDayId;

    const finalQuantity = plannedQuantity ?? quantity;

    if (!finalDayId || !name || price == null || finalQuantity == null) {
      return res.status(400).json({
        message: 'dayId/menuDayId, name, price and quantity/plannedQuantity are required',
      });
    }

    const item = await prisma.menuItem.create({
      data: {
        menuDayId: finalDayId,
        name,
        description: description || '',
        price: Number(price),
        plannedQuantity: Number(finalQuantity),
        orderedQuantity: 0,
        imageUrl: imageUrl || null,
        type: type || 'meal',
        isActive: true,
      },
    });

    return res.status(201).json(serializeItem(item));
  } catch (error) {
    console.error('createAdminMenuItem error:', error);
    return res.status(500).json({ message: 'Failed to create menu item' });
  }
};

export const updateAdminMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...('name' in req.body ? { name: req.body.name } : {}),
        ...('description' in req.body
          ? { description: req.body.description || '' }
          : {}),
        ...('price' in req.body ? { price: Number(req.body.price) } : {}),
        ...('plannedQuantity' in req.body
          ? { plannedQuantity: Number(req.body.plannedQuantity) }
          : {}),
        ...('imageUrl' in req.body ? { imageUrl: req.body.imageUrl || null } : {}),
        ...('type' in req.body ? { type: req.body.type || 'meal' } : {}),
        ...('isActive' in req.body ? { isActive: Boolean(req.body.isActive) } : {}),
      },
    });

    return res.json(serializeItem(item));
  } catch (error) {
    console.error('updateAdminMenuItem error:', error);
    return res.status(500).json({ message: 'Failed to update menu item' });
  }
};

export const deleteAdminMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ message: 'Menu item disabled' });
  } catch (error) {
    console.error('deleteAdminMenuItem error:', error);
    return res.status(500).json({ message: 'Failed to delete menu item' });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
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
    console.error('getAdminOrders error:', error);
    return res.status(500).json({ message: 'Failed to load orders' });
  }
};

export const getAdminSummary = async (req, res) => {
  try {
    const [ordersCount, menuItemsCount, orders] = await Promise.all([
      prisma.order.count(),
      prisma.menuItem.count(),
      prisma.order.findMany({
        select: { totalAmount: true },
      }),
    ]);

    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    return res.json({
      ordersCount,
      menuItemsCount,
      revenue,
    });
  } catch (error) {
    console.error('getAdminSummary error:', error);
    return res.status(500).json({ message: 'Failed to load summary' });
  }
};

export const getAdminDiagnostics = async (req, res) => {
  const limit = req.query.limit || 120;
  return res.json({
    logs: getDiagnostics(limit),
  });
};

export const clearAdminDiagnostics = async (req, res) => {
  clearDiagnostics();
  return res.json({ message: 'Diagnostics cleared' });
};

export const deleteAdminMenuDay = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuDay.delete({
      where: { id },
    });

    return res.json({ message: 'Menu day deleted' });
  } catch (error) {
    console.error('deleteAdminMenuDay error:', error);
    if (isRecordNotFound(error)) {
      return res.status(404).json({ message: 'Menu day not found' });
    }

    return res.status(500).json({ message: 'Failed to delete menu day' });
  }
};

export const updateAdminOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!validOrderStatuses.has(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: orderInclude,
      });

      if (!existingOrder) return null;

      if (existingOrder.status !== status) {
        if (existingOrder.status !== 'CANCELLED' && status === 'CANCELLED') {
          await applyOrderInventoryDelta(tx, existingOrder.items, -1);
        }

        if (existingOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
          await applyOrderInventoryDelta(tx, existingOrder.items, 1);
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: orderInclude,
      });
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(serializeOrder(order));
  } catch (error) {
    console.error('updateAdminOrder error:', error);
    if (isRecordNotFound(error)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(500).json({ message: 'Failed to update order' });
  }
};

export const deleteAdminOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: orderInclude,
      });

      if (!existingOrder) return null;

      if (existingOrder.status !== 'CANCELLED') {
        await applyOrderInventoryDelta(tx, existingOrder.items, -1);
      }

      await tx.order.delete({
        where: { id },
      });

      return existingOrder;
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('deleteAdminOrder error:', error);
    if (isRecordNotFound(error)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(500).json({ message: 'Failed to delete order' });
  }
};
