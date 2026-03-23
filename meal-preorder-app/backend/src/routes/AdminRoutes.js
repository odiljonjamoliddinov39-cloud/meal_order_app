import { Router } from 'express';
import { loginAdmin } from '../controllers/adminController.js';
import {
  menuDays,
  orders,
  getNextDayId,
  getNextItemId,
  getNextOrderId,
} from '../lib/store.js';

const router = Router();

router.post('/admin/login', loginAdmin);

router.get('/admin/menu/days', (req, res) => {
  res.json(menuDays);
});

router.post('/admin/menu/days', (req, res) => {
  try {
    const { date } = req.body || {};

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const existingDay = menuDays.find((day) => day.date === date);
    if (existingDay) {
      return res.status(400).json({ message: 'This menu day already exists' });
    }

    const newDay = {
      id: getNextDayId(),
      date,
      items: [],
    };

    menuDays.push(newDay);

    return res.status(201).json(newDay);
  } catch (error) {
    console.error('Create day error:', error);
    return res.status(500).json({ message: 'Failed to create menu day' });
  }
});

router.post('/admin/menu/items', (req, res) => {
  try {
    const { dayId, name, price, quantity } = req.body || {};

    if (!dayId || !name || price === undefined || quantity === undefined) {
      return res.status(400).json({
        message: 'dayId, name, price and quantity are required',
      });
    }

    const targetDay = menuDays.find((day) => Number(day.id) === Number(dayId));

    if (!targetDay) {
      return res.status(404).json({ message: 'Menu day not found' });
    }

    const newItem = {
      id: getNextItemId(),
      name,
      price: Number(price),
      quantity: Number(quantity),
    };

    targetDay.items.push(newItem);

    return res.status(201).json({
      message: 'Menu item created successfully',
      item: newItem,
      day: targetDay,
    });
  } catch (error) {
    console.error('Create item error:', error);
    return res.status(500).json({ message: 'Failed to create menu item' });
  }
});

router.get('/admin/orders', (req, res) => {
  res.json(orders);
});

router.post('/admin/orders', (req, res) => {
  try {
    const { customerName, telegramId, items } = req.body || {};

    const safeItems = Array.isArray(items) ? items : [];

    const totalAmount = safeItems.reduce((sum, item) => {
      const price = Number(item?.menuItem?.price || item?.price || 0);
      const qty = Number(item?.quantity || 0);
      return sum + price * qty;
    }, 0);

    const newOrder = {
      id: getNextOrderId(),
      status: 'PENDING',
      totalAmount,
      createdAt: new Date().toISOString(),
      customerName: customerName || 'Demo Customer',
      telegramId: telegramId || '123456789',
      items: safeItems,
    };

    orders.unshift(newOrder);

    return res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
});

export default router;