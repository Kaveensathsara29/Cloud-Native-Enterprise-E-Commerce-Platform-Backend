import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { items, total, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'No order items specified' });
      return;
    }

    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000).toString();

    const order = new Order({
      orderId,
      user: req.user._id,
      items,
      total,
      shippingAddress,
      paymentMethod: paymentMethod || 'Credit Card',
      status: 'Processing'
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let order = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate('user', 'name email');
    }
    if (!order && id) {
      order = await Order.findOne({ orderId: id }).populate('user', 'name email');
    }

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid order status' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    let order = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order && id) {
      order = await Order.findOne({ orderId: id });
    }

    if (order) {
      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

