import express from 'express';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    const { orderItems, shippingAddress, totalPrice } = req.body;

    try {
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            totalPrice
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
