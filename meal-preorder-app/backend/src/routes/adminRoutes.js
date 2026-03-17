import { Router } from 'express';
import { loginAdmin } from '../controllers/adminAuthController.js';
import { createMenuDay, createMenuItem, getMenuDays, updateMenuItem } from '../controllers/menuController.js';
import { getAdminOrders } from '../controllers/orderController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

router.post('/auth/login', loginAdmin);
router.get('/menu/days', adminAuth, getMenuDays);
router.post('/menu/days', adminAuth, createMenuDay);
router.post('/menu/items', adminAuth, createMenuItem);
router.patch('/menu/items/:id', adminAuth, updateMenuItem);
router.get('/orders', adminAuth, getAdminOrders);

export default router;
