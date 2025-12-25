const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
    getOrderById
} = require('../controllers/orderController');

router.route('/')
    .post(protect, createOrder);

router.route('/myorders')
    .get(protect, getMyOrders);

router.route('/tokens/my')
    .get(protect, getMyTokens);

router.route('/admin/all')
    .get(protect, admin, getAllOrders);

router.route('/admin/analytics')
    .get(protect, admin, getAdminAnalytics);

router.route('/admin/luckydraw')
    .get(protect, admin, getLuckyDrawParticipants);

router.route('/tokens/admin')
    .get(protect, admin, getAdminTokens);

router.route('/stall/:stallId')
    .get(protect, getStallOrders);

router.route('/tokens/stall/:stallId')
    .get(protect, getStallTokens);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/status')
    .put(protect, updateOrderStatus);

module.exports = router;
