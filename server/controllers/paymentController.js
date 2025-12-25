const Order = require('../models/Order');
const Stall = require('../models/Stall');
const { generateAndAssignToken } = require('./orderController');

// Dynamically require stripe to handle cases where it's not installed
let stripe;
try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (error) {
    console.warn('Stripe module not found. Payment features will be disabled:', error.message);
    stripe = null;
}

const createPaymentIntent = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: 'Payment gateway not configured' });
        }
        
        const { amount, currency = 'inr', description } = req.body;

        // Convert amount to smallest currency unit (paise for INR)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency,
            description: description || 'Festival Stall Payment',
            metadata: {
                userId: req.user ? req.user._id : 'guest',
                orderId: req.body.orderId || 'unknown'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({ message: 'Payment setup failed', error: error.message });
    }
};

const handlePaymentSuccess = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: 'Payment gateway not configured' });
        }
        
        const { paymentIntentId, orderId } = req.body;

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update order status to paid in the database
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentStatus = 'Paid';
                const stall = await Stall.findById(order.stall);
                const canActivate =
                    order.paymentStatus === 'Paid' &&
                    !order.tokenNumber &&
                    (
                        order.orderType === 'Live' ||
                        (order.orderType === 'Pre-booking' && order.pickupTime && new Date() >= new Date(order.pickupTime))
                    );
                if (canActivate) {
                    await generateAndAssignToken(order, stall);
                }
                await order.save();
            }
            
            res.json({
                success: true,
                message: 'Payment successful',
                paymentIntent: paymentIntent,
                orderId: orderId
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed',
                status: paymentIntent.status
            });
        }
    } catch (error) {
        console.error('Payment success verification error:', error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

const handlePaymentFailure = async (req, res) => {
    try {
        // Note: This function doesn't require Stripe directly, so no check needed
        const { paymentIntentId, reason } = req.body;

        // Log failed payment attempt
        console.log(`Payment failed for ${paymentIntentId}: ${reason}`);

        res.json({
            success: false,
            message: 'Payment failed',
            reason
        });
    } catch (error) {
        console.error('Payment failure handling error:', error);
        res.status(500).json({ message: 'Payment failure handling failed', error: error.message });
    }
};

module.exports = {
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentFailure
};