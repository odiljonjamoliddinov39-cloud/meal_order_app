import express from 'express';

import {
  getAdminMenuDays,
  createAdminMenuDay,
  createAdminMenuItem,
  updateAdminMenuItem,
  deleteAdminMenuItem,
  getAdminOrders,
  getAdminSummary,
  deleteAdminMenuDay,
  updateAdminOrder,
  deleteAdminOrder,
  getAdminDiagnostics,
  clearAdminDiagnostics,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/admin/menu/days', getAdminMenuDays);
router.post('/admin/menu/days', createAdminMenuDay);
router.delete('/admin/menu/days/:id', deleteAdminMenuDay);

router.post('/admin/menu/items', createAdminMenuItem);
router.patch('/admin/menu/items/:id', updateAdminMenuItem);
router.delete('/admin/menu/items/:id', deleteAdminMenuItem);

router.get('/admin/orders', getAdminOrders);
router.put('/admin/orders/:id', updateAdminOrder);
router.delete('/admin/orders/:id', deleteAdminOrder);
router.get('/admin/summary', getAdminSummary);
router.get('/admin/diagnostics', getAdminDiagnostics);
router.delete('/admin/diagnostics', clearAdminDiagnostics);

export default router;
