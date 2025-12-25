const express = require('express');
const router = express.Router();
const { createOffer, getOffers, deleteOffer } = require('../controllers/offerController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getOffers);
router.post('/', protect, createOffer);
router.delete('/:id', protect, deleteOffer);

module.exports = router;
