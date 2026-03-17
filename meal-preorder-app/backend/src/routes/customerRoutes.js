import { Router } from 'express';
import { getMenuDays, getMenuItemsByDate } from '../controllers/menuController.js';
import { createOrder, getMyOrders } from '../controllers/orderController.js';
import { customerAuth } from '../middleware/customerAuth.js';

const router = Router();

router.get('/menu/days', getMenuDays);
router.get('/menu/items', getMenuItemsByDate);
router.post('/orders', customerAuth, createOrder);
router.get('/orders/me', customerAuth, getMyOrders);

export default router;
