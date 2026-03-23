import { menuDays, orders, getNextOrderId } from '../lib/store.js';

export const getMenuDays = async (req, res) => {
  try {
    const result = menuDays.map((day) => ({
      id: day.id,
      date: day.date,
      label: day.date,
      itemsCount: Array.isArray(day.items) ? day.items.length : 0,
    }));

    return res.json(result);
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

    const day = menuDays.find((item) => item.date === date);

    if (!day) {
      return res.json([]);
    }

    const items = (day.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price || 0),
      imageUrl: item.imageUrl || null,
      availableQuantity: Number(item.quantity || 0),
      date: day.date,
    }));

    return res.json(items);
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

    const normalizedItems = [];
    let totalAmount = 0;

    for (const rawItem of safeItems) {
      const itemId = Number(rawItem.itemId || rawItem.id);
      const quantity = Number(rawItem.quantity || 0);

      if (!itemId || quantity <= 0) {
        continue;
      }

      let foundItem = null;

      for (const day of menuDays) {
        const item = (day.items || []).find((menuItem) => Number(menuItem.id) === itemId);
        if (item) {
          foundItem = item;
          break;
        }
      }

      if (!foundItem) {
        continue;
      }

      if (Number(foundItem.quantity) < quantity) {
        return res.status(400).json({
          message: `Not enough quantity for ${foundItem.name}`,
        });
      }

      foundItem.quantity = Number(foundItem.quantity) - quantity;

      normalizedItems.push({
        id: foundItem.id,
        quantity,
        menuItem: {
          id: foundItem.id,
          name: foundItem.name,
          price: Number(foundItem.price),
        },
      });

      totalAmount += Number(foundItem.price) * quantity;
    }

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: 'No valid items in order' });
    }

    const newOrder = {
      id: getNextOrderId(),
      status: 'PENDING',
      totalAmount,
      createdAt: new Date().toISOString(),
      customerName: req.user?.firstName || 'Demo Customer',
      telegramId: req.user?.telegramId || '123456789',
      items: normalizedItems,
    };

    orders.unshift(newOrder);

    return res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const telegramId = String(req.user?.telegramId || '');

    const myOrders = orders.filter(
      (order) => String(order.telegramId || '') === telegramId
    );

    return res.json(myOrders);
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};