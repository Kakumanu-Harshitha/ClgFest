const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, requestOTP, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/request-otp', requestOTP);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);

module.exports = router;
