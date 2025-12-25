const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/systemSettingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getSettings)
    .put(protect, admin, updateSettings);

module.exports = router;
