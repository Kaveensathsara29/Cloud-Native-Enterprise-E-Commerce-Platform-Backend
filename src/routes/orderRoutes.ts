import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, adminProtect, getAllOrders);

router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, adminProtect, updateOrderStatus);

export default router;
