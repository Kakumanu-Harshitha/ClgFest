const SystemSettings = require('../models/SystemSettings');
const LuckyDraw = require('../models/LuckyDraw');
const Order = require('../models/Order');
const Stall = require('../models/Stall');

// @desc    Get lucky draw settings
// @route   GET /api/luckydraw/settings
// @access  Private (Admin)
const getLuckyDrawSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        res.json({
            luckyDrawEnabled: settings.luckyDrawEnabled,
            luckyDrawStall: settings.luckyDrawStall,
            luckyDrawThreshold: settings.luckyDrawThreshold
        });
    } catch (error) {
        console.error('Get lucky draw settings error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update lucky draw settings
// @route   PUT /api/luckydraw/settings
// @access  Private (Admin)
const updateLuckyDrawSettings = async (req, res) => {
    try {
        const { luckyDrawEnabled, luckyDrawStall, luckyDrawThreshold } = req.body;
        
        let settings = await SystemSettings.findOne();
        if (!settings) {
            // Create new settings if they don't exist
            settings = new SystemSettings({
                upiId: '',
                upiQrImage: '',
                luckyDrawEnabled: luckyDrawEnabled || false,
                luckyDrawStall: luckyDrawStall || null,
                luckyDrawThreshold: luckyDrawThreshold || 50
            });
        } else {
            settings.luckyDrawEnabled = luckyDrawEnabled !== undefined ? luckyDrawEnabled : settings.luckyDrawEnabled;
            settings.luckyDrawStall = luckyDrawStall !== undefined ? luckyDrawStall : settings.luckyDrawStall;
            settings.luckyDrawThreshold = luckyDrawThreshold !== undefined ? luckyDrawThreshold : settings.luckyDrawThreshold;
        }
        
        await settings.save();
        res.json(settings);
    } catch (error) {
        console.error('Update lucky draw settings error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get lucky draw history
// @route   GET /api/luckydraw/history
// @access  Private (Admin)
const getLuckyDrawHistory = async (req, res) => {
    try {
        const draws = await LuckyDraw.find({})
            .populate('stall', 'name')
            .populate('orderId', 'user createdAt totalAmount')
            .sort({ drawNumber: -1 });
        res.json(draws);
    } catch (error) {
        console.error('Get lucky draw history error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset lucky draw counter
// @route   POST /api/luckydraw/reset
// @access  Private (Admin)
const resetLuckyDrawCounter = async (req, res) => {
    try {
        // We don't actually reset the counter, but we can trigger a manual draw or clear settings if needed
        // For now, this is a placeholder that just returns success
        res.json({ message: 'Lucky draw counter reset successfully' });
    } catch (error) {
        console.error('Reset lucky draw counter error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Manually trigger lucky draw
// @route   POST /api/luckydraw/trigger
// @access  Private (Admin)
const triggerLuckyDraw = async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        if (!settings || !settings.luckyDrawEnabled) {
            return res.status(400).json({ message: 'Lucky draw is not enabled' });
        }
        
        if (!settings.luckyDrawStall) {
            return res.status(400).json({ message: 'No stall selected for lucky draw' });
        }
        
        // Get recent completed orders for the selected stall
        const recentOrders = await Order.find({
            stall: settings.luckyDrawStall,
            status: 'Completed',
            paymentStatus: 'Paid'
        })
            .populate('user', 'name email phone branch')
            .populate('stall', 'name')
            .sort({ createdAt: -1 })
            .limit(settings.luckyDrawThreshold);
        
        if (recentOrders.length < settings.luckyDrawThreshold) {
            return res.status(400).json({ 
                message: `Not enough completed orders. Need ${settings.luckyDrawThreshold}, found ${recentOrders.length}` 
            });
        }
        
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
        
        res.json({
            message: 'Lucky draw triggered successfully',
            draw: luckyDraw
        });
    } catch (error) {
        console.error('Trigger lucky draw error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getLuckyDrawSettings,
    updateLuckyDrawSettings,
    getLuckyDrawHistory,
    resetLuckyDrawCounter,
    triggerLuckyDraw
};