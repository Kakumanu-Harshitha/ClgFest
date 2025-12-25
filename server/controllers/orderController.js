const Order = require('../models/Order');
const Stall = require('../models/Stall');
const FoodItem = require('../models/FoodItem');
const Offer = require('../models/Offer');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer)
const createOrder = async (req, res) => {
    try {
        const { stallId, items, paymentMethod, orderType, transactionId, pickupTime, couponCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // Verify stall exists
        const stall = await Stall.findById(stallId);
        if (!stall) {
            return res.status(404).json({ message: 'Stall not found' });
        }
        if (!stall.isApproved) {
            return res.status(400).json({ message: 'Stall is not approved' });
        }
        if (!stall.isOpen) {
            return res.status(400).json({ message: 'Stall is currently closed' });
        }
        if (orderType === 'Pre-booking' && !stall.preBookingEnabled) {
            return res.status(400).json({ message: 'Pre-booking is not enabled for this stall' });
        }

        if (paymentMethod === 'UPI' && !transactionId) {
            return res.status(400).json({ message: 'Transaction ID required for UPI payment' });
        }

        let totalAmount = 0;
        const orderItems = [];

        // Validate items and calculate total
        for (const item of items) {
            const foodItem = await FoodItem.findById(item.foodItem);
            if (!foodItem) {
                return res.status(404).json({ message: `Food item not found: ${item.foodItem}` });
            }
            
            // Check availability
            if (!foodItem.isAvailable) {
                return res.status(400).json({ message: `${foodItem.name} is currently unavailable` });
            }

            const itemTotal = foodItem.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                foodItem: foodItem._id,
                name: foodItem.name,
                quantity: item.quantity,
                price: foodItem.price
            });
        }

        let discountAmount = 0;
        if (couponCode && typeof couponCode === 'string') {
            const currentDate = new Date();
            const code = couponCode.trim().toUpperCase();
            const offer = await Offer.findOne({
                couponCode: code,
                isActive: true,
                $or: [
                    { validUntil: { $gte: currentDate } },
                    { validUntil: { $exists: false } },
                    { validUntil: null }
                ]
            });
            if (offer && (!offer.stall || offer.stall.toString() === stallId.toString())) {
                const pct = Number(offer.discountPercentage) || 0;
                discountAmount = Math.round((totalAmount * pct) / 100);
                if (discountAmount > totalAmount) discountAmount = totalAmount;
            }
        }

        const order = new Order({
            user: req.user._id,
            stall: stallId,
            items: orderItems,
            totalAmount: Math.max(0, totalAmount - discountAmount),
            discountAmount,
            couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
            paymentMethod,
            orderType,
            transactionId,
            pickupTime
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('stall', 'name image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get orders for a stall
// @route   GET /api/orders/stall/:stallId
// @access  Private (Stall Owner/Admin)
const getStallOrders = async (req, res) => {
    try {
        const stall = await Stall.findById(req.params.stallId);
        
        if (!stall) {
            return res.status(404).json({ message: 'Stall not found' });
        }

        // Check ownership
        if (stall.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view these orders' });
        }

        const orders = await Order.find({ stall: req.params.stallId })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
            
        res.json(orders);
    } catch (error) {
        console.error('Get stall orders error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get ACTIVE tokens for a stall
// @route   GET /api/tokens/stall/:stallId
// @access  Private (Stall Owner/Admin)
const getStallTokens = async (req, res) => {
    try {
        const stall = await Stall.findById(req.params.stallId);
        if (!stall) {
            return res.json([]);
        }
        if (stall.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view these tokens' });
        }
        const tokens = await Order.find({ stall: req.params.stallId, tokenStatus: 'ACTIVE' })
            .populate('user', 'name email phone')
            .sort({ tokenNumber: 1, createdAt: 1 });
        res.json(tokens);
    } catch (error) {
        console.error('Get stall tokens error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get ALL tokens (Admin) with filters
// @route   GET /api/tokens/admin
// @access  Private (Admin)
const getAdminTokens = async (req, res) => {
    try {
        const { stallId, status, from, to, orderType, paymentMethod } = req.query;
        const query = { tokenNumber: { $ne: null } };
        if (stallId) query.stall = stallId;
        if (status) query.tokenStatus = status;
        if (orderType) query.orderType = orderType;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }
        const tokens = await Order.find(query)
            .populate('user', 'name email phone')
            .populate('stall', 'name')
            .sort({ createdAt: -1 });
        res.json(tokens);
    } catch (error) {
        console.error('Get admin tokens error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get logged-in user's tokens
// @route   GET /api/tokens/my
// @access  Private
const getMyTokens = async (req, res) => {
    try {
        const tokens = await Order.find({ user: req.user._id, tokenNumber: { $ne: null } })
            .populate('stall', 'name')
            .sort({ createdAt: -1 });
        res.json(tokens);
    } catch (error) {
        console.error('Get my tokens error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('stall', 'name');

        if (order) {
            // Ensure only the owner or admin can view the order
            if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && order.stall.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this order' });
            }
            // Add stallName to the order object for easier client-side access
            if (order.stall && order.stall.name) {
                order._doc.stallName = order.stall.name;
            }
            console.log('Order sent to client:', order);
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to generate and assign a unique token number
const generateAndAssignToken = async (order, stall) => {
    console.log('Order before token generation:', order);
    let uniqueTokenNumber = null;
    let isUnique = false;
    while (!isUnique) {
        const min = 100000; // Smallest 6-digit number
        const max = 999999; // Largest 6-digit number
        const randomToken = Math.floor(Math.random() * (max - min + 1)) + min;
        const existingOrder = await Order.findOne({ tokenNumber: randomToken });
        if (!existingOrder) {
            uniqueTokenNumber = randomToken;
            isUnique = true;
        }
    }
    order.tokenNumber = uniqueTokenNumber;
    order.tokenStatus = 'ACTIVE';
    order.stallName = stall.name;
    order.eventName = 'Colorido 2K25';
    if (order.status === 'Pending') order.status = 'Confirmed';
    console.log('Order after token generation:', order);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Stall Owner/Admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status, paymentStatus, tokenStatus } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const stall = await Stall.findById(order.stall);

        // Check ownership
        if (stall.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        if (status) order.status = status;
        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
            const canActivate =
                paymentStatus === 'Paid' &&
                !order.tokenNumber &&
                (
                    order.orderType === 'Live' ||
                    (order.orderType === 'Pre-booking' && order.pickupTime && new Date() >= new Date(order.pickupTime))
                );
            console.log('canActivate:', canActivate);
            if (canActivate) {
                await generateAndAssignToken(order, stall);
            }
        }
        if (tokenStatus) {
            order.tokenStatus = tokenStatus;
            if (tokenStatus === 'DELIVERED') order.status = 'Completed';
            if (tokenStatus === 'CANCELLED') order.status = 'Cancelled';
        }

        const updatedOrder = await order.save();
        
        // Check if order status changed to 'Completed' to trigger lucky draw
        if (order.status === 'Completed') {
            await checkAndTriggerLuckyDraw(order);
        }
        
        res.json(updatedOrder);

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to check and trigger lucky draw
const checkAndTriggerLuckyDraw = async (order) => {
    try {
        const SystemSettings = require('../models/SystemSettings');
        const LuckyDraw = require('../models/LuckyDraw');
        
        // Get system settings
        let settings = await SystemSettings.findOne();
        if (!settings || !settings.luckyDrawEnabled) {
            return; // Lucky draw is not enabled
        }
        
        // Check if this order's stall matches the lucky draw stall
        if (settings.luckyDrawStall && settings.luckyDrawStall.toString() !== order.stall.toString()) {
            return; // This order is not for the lucky draw stall
        }
        
        // Count completed orders for this stall since the last lucky draw
        const lastLuckyDraw = await LuckyDraw.findOne().sort({ drawNumber: -1 });
        const lastDrawTimestamp = lastLuckyDraw ? lastLuckyDraw.timestamp : null;
        
        let query = {
            stall: order.stall,
            status: 'Completed',
            paymentStatus: 'Paid'
        };
        
        if (lastDrawTimestamp) {
            query.createdAt = { $gt: lastDrawTimestamp };
        }
        
        const completedOrdersCount = await Order.countDocuments(query);
        
        // Check if we've reached the threshold
        if (completedOrdersCount >= settings.luckyDrawThreshold) {
            // Get all completed orders for this stall since last draw
            let ordersQuery = {
                stall: order.stall,
                status: 'Completed',
                paymentStatus: 'Paid'
            };
            
            if (lastDrawTimestamp) {
                ordersQuery.createdAt = { $gt: lastDrawTimestamp };
            }
            
            const recentOrders = await Order.find(ordersQuery)
                .populate('user', 'name email phone branch')
                .populate('stall', 'name')
                .limit(settings.luckyDrawThreshold);
            
            if (recentOrders.length >= settings.luckyDrawThreshold) {
                // Randomly select a winner from the recent orders
                const randomIndex = Math.floor(Math.random() * recentOrders.length);
                const winningOrder = recentOrders[randomIndex];
                
                // Get the next draw number
                const lastDraw = await LuckyDraw.findOne().sort({ drawNumber: -1 });
                const nextDrawNumber = lastDraw ? lastDraw.drawNumber + 1 : 1;
                
                // Create lucky draw record
                const luckyDraw = new LuckyDraw({
                    drawNumber: nextDrawNumber,
                    winner: {
                        name: winningOrder.user.name,
                        phone: winningOrder.user.phone,
                        email: winningOrder.user.email,
                        branch: winningOrder.user.branch
                    },
                    orderId: winningOrder._id,
                    stall: winningOrder.stall._id,
                    stallName: winningOrder.stall.name,
                    timestamp: new Date()
                });
                
                await luckyDraw.save();
                
                console.log(`Lucky draw #${nextDrawNumber} triggered! Winner: ${winningOrder.user.name}`);
            }
        }
    } catch (error) {
        console.error('Error in checkAndTriggerLuckyDraw:', error);
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
    try {
        const { customerName, tokenId } = req.query;
        const query = {};

        if (customerName) {
            const users = await require('../models/User').find({ name: { $regex: customerName, $options: 'i' } }).select('_id');
            const userIds = users.map(user => user._id);
            query.user = { $in: userIds };
        }

        if (tokenId) {
            const parsedTokenId = parseInt(tokenId.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedTokenId)) {
                query.tokenNumber = parsedTokenId;
            }
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('stall', 'name')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get admin analytics
// @route   GET /api/orders/admin/analytics
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const ordersByStatus = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const revenueByStall = await Order.aggregate([
            { $group: { _id: "$stall", total: { $sum: "$totalAmount" } } },
            { $lookup: { from: "stalls", localField: "_id", foreignField: "_id", as: "stallDetails" } },
            { $unwind: "$stallDetails" },
            { $project: { stallName: "$stallDetails.name", total: 1 } }
        ]);

        res.json({
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            ordersByStatus,
            revenueByStall
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get lucky draw participants
// @route   GET /api/orders/admin/luckydraw
// @access  Private (Admin)
const getLuckyDrawParticipants = async (req, res) => {
    try {
        const { stallId, foodItemId } = req.query;

        let query = {};
        
        if (stallId) {
            query.stall = stallId;
        }

        if (foodItemId) {
            query['items.foodItem'] = foodItemId;
        }

        // Find unique users from matching orders
        const orders = await Order.find(query).distinct('user');
        
        // Fetch user details
        const users = await require('../models/User').find({
            _id: { $in: orders }
        }).select('name email phone branch');

        res.json(users);
    } catch (error) {
        console.error('Lucky draw error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getStallOrders,
    updateOrderStatus,
    getAllOrders,
    getAdminAnalytics,
    getLuckyDrawParticipants,
    getStallTokens,
    getAdminTokens,
    getMyTokens,
    getOrderById,
    generateAndAssignToken
};
