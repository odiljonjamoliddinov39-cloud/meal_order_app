import { Router } from 'express';
import requireTelegramAuth from '../middleware/requireTelegramAuth.js';
import {
  getMenuDays,
  getMenuItemsByDate,
  createOrder,
  getMyOrders,
} from '../controllers/customerController.js';

const router = Router();

router.get('/menu/days', requireTelegramAuth, getMenuDays);
router.get('/menu/items', requireTelegramAuth, getMenuItemsByDate);
router.post('/orders', requireTelegramAuth, createOrder);
router.get('/orders/me', requireTelegramAuth, getMyOrders);

export default router;