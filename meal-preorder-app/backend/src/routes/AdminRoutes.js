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

// ===== MENU DAYS =====

router.get('/admin/menu/days', (req, res) => {
  res.json(menuDays);
});

router.post('/admin/menu/days', (req, res) => {
  try {
    const { date } = req.body || {};

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const exists = menuDays.find((d) => d.date === date);
    if (exists) {
      return res.status(400).json({ message: 'Already exists' });
    }

    const newDay = {
      id: getNextDayId(),
      date,
      items: [],
    };

    menuDays.push(newDay);

    res.status(201).json(newDay);
  } catch {
    res.status(500).json({ message: 'Failed to create day' });
  }
});

router.delete('/admin/menu/days/:id', (req, res) => {
  const id = Number(req.params.id);

  const index = menuDays.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });

  menuDays.splice(index, 1);

  res.json({ message: 'Deleted' });
});

// ===== MENU ITEMS =====

router.post('/admin/menu/items', (req, res) => {
  try {
    const { dayId, name, price, quantity, type } = req.body || {};

    if (!dayId || !name) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const day = menuDays.find((d) => Number(d.id) === Number(dayId));
    if (!day) return res.status(404).json({ message: 'Day not found' });

    const item = {
      id: getNextItemId(),
      name,
      price: Number(price),
      quantity: Number(quantity),
      type: type || 'meal',
    };

    day.items.push(item);

    res.status(201).json(item);
  } catch {
    res.status(500).json({ message: 'Failed to create item' });
  }
});

// ===== ORDERS =====

router.get('/admin/orders', (req, res) => {
  const { date, customer } = req.query;

  let result = [...orders];

  if (date) {
    result = result.filter((o) => o.createdAt?.startsWith(date));
  }

  if (customer) {
    const q = customer.toLowerCase();
    result = result.filter(
      (o) =>
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.telegramId || '').toLowerCase().includes(q)
    );
  }

  res.json(result);
});

router.post('/admin/orders', (req, res) => {
  const { customerName, telegramId, items } = req.body || {};

  const total = (items || []).reduce(
    (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
    0
  );

  const order = {
    id: getNextOrderId(),
    createdAt: new Date().toISOString(),
    customerName: customerName || '',
    telegramId: telegramId || '',
    items: items || [],
    totalAmount: total,
  };

  orders.unshift(order);

  res.status(201).json(order);
});

router.delete('/admin/orders/:id', (req, res) => {
  const id = Number(req.params.id);

  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });

  orders.splice(index, 1);

  res.json({ message: 'Deleted' });
});

export default router;
