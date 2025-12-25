const Feedback = require('../models/Feedback');
const Order = require('../models/Order');

const createFeedback = async (req, res) => {
    const { orderId, rating, comment } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Ensure user owns the order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to rate this order' });
        }

        // Only allow feedback after delivery/completion
        const delivered = order.tokenStatus === 'DELIVERED' || order.status === 'Completed';
        if (!delivered) {
            return res.status(400).json({ message: 'Feedback allowed only after delivery' });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ order: orderId });
        if (existingFeedback) {
            return res.status(400).json({ message: 'Feedback already submitted for this order' });
        }

        const feedback = await Feedback.create({
            user: req.user._id,
            order: orderId,
            stall: order.stall,
            rating,
            comment
        });

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFeedbackForStall = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ stall: req.params.stallId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const respondToFeedback = async (req, res) => {
    const { response } = req.body;
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        // Verify stall owner ownership or Admin
        if (req.user.role !== 'admin') {
            if (!req.user.stallId || req.user.stallId.toString() !== feedback.stall.toString()) {
                return res.status(403).json({ message: 'Not authorized to respond to this feedback' });
            }
        }

        feedback.response = response;
        await feedback.save();

        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({})
            .populate('user', 'name')
            .populate('stall', 'name')
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFeedbackForOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const feedback = await Feedback.findOne({ order: req.params.orderId })
            .populate('stall', 'name')
            .populate('user', 'name');
        res.json(feedback || null);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createFeedback, getFeedbackForStall, respondToFeedback, getAllFeedback, getFeedbackForOrder };
