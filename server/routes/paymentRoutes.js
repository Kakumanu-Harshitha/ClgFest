const express = require('express');
const router = express.Router();
const { createPaymentIntent, handlePaymentSuccess, handlePaymentFailure } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/payment-success', protect, handlePaymentSuccess);
router.post('/payment-failure', protect, handlePaymentFailure);

module.exports = router;