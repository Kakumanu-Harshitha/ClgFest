const express = require('express');
const router = express.Router();
const { 
    getStalls, 
    getStallById, 
    getStallByIdOwner, 
    getMyStall,
    createStall, 
    createFoodItem, 
    updateFoodItem, 
    deleteFoodItem,
    getAllStallsAdmin,
    setApprovalStatus,
    setOpenStatus,
    setPreBookingStatus,
    updateStallName
} = require('../controllers/stallController');
const { protect, admin, stallOwner } = require('../middleware/authMiddleware');

router.route('/').get(getStalls).post(protect, admin, createStall);
router.route('/admin').get(protect, admin, getAllStallsAdmin);
router.route('/:id').get(getStallById);
router.route('/:id/owner').get(protect, stallOwner, getStallByIdOwner);
router.route('/owner/me').get(protect, stallOwner, getMyStall);
router.route('/:id/items').post(protect, stallOwner, createFoodItem);
router.route('/items/:itemId')
    .put(protect, stallOwner, updateFoodItem)
    .delete(protect, stallOwner, deleteFoodItem);
router.route('/:id/approve').put(protect, admin, setApprovalStatus);
router.route('/:id/open').put(protect, stallOwner, setOpenStatus);
router.route('/:id/prebooking').put(protect, stallOwner, setPreBookingStatus);
router.route('/:id/name').put(protect, stallOwner, updateStallName);

module.exports = router;
