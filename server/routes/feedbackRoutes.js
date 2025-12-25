const express = require('express');
const router = express.Router();
const { createFeedback, getFeedbackForStall, respondToFeedback, getAllFeedback, getFeedbackForOrder } = require('../controllers/feedbackController');
const { protect, stallOwner, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createFeedback);
router.get('/stall/:stallId', getFeedbackForStall);
router.put('/:id/respond', protect, stallOwner, respondToFeedback);
router.get('/', protect, admin, getAllFeedback);
router.get('/order/:orderId', protect, getFeedbackForOrder);

module.exports = router;
