const express = require('express');
const router = express.Router();
const { getUsers, createUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

module.exports = router;
