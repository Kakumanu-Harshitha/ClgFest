const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getLuckyDrawSettings,
    updateLuckyDrawSettings,
    getLuckyDrawHistory,
    resetLuckyDrawCounter,
    triggerLuckyDraw
} = require('../controllers/luckyDrawController');

router.route('/settings')
    .get(protect, admin, getLuckyDrawSettings)
    .put(protect, admin, updateLuckyDrawSettings);

router.route('/history')
    .get(protect, admin, getLuckyDrawHistory);

router.route('/reset')
    .post(protect, admin, resetLuckyDrawCounter);

router.route('/trigger')
    .post(protect, admin, triggerLuckyDraw);

module.exports = router;