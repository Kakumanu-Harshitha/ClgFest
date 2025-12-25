const Stall = require('../models/Stall');
const FoodItem = require('../models/FoodItem');
const User = require('../models/User');

// @desc    Get all stalls
// @route   GET /api/stalls
// @access  Public
const getStalls = async (req, res) => {
    try {
        const stalls = await Stall.find({ isApproved: true, $or: [{ isOpen: true }, { name: "biryani" }] });
        res.json(stalls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get stall by ID
// @route   GET /api/stalls/:id
// @access  Public
const getStallById = async (req, res) => {
    try {
        const stall = await Stall.findById(req.params.id);
        if (stall && stall.isApproved && stall.isOpen) {
            const items = await FoodItem.find({ stall: stall._id });
            res.json({ ...stall._doc, items });
        } else {
            res.status(404).json({ message: 'Stall not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStallByIdOwner = async (req, res) => {
    try {
        const stall = await Stall.findById(req.params.id);
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this stall' });
        }
        const items = await FoodItem.find({ stall: stall._id });
        res.json({ ...stall._doc, items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Create a new stall
// @route   POST /api/stalls
// @access  Admin
const createStall = async (req, res) => {
    const { name, description, image, phone, ownerId } = req.body;

    try {
        const stall = new Stall({
            name,
            description,
            image,
            phone,
            owner: ownerId
        });

        const createdStall = await stall.save();
        
        // Update user to link stall
        await User.findByIdAndUpdate(ownerId, { stallId: createdStall._id });

        res.status(201).json(createdStall);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a food item
// @route   POST /api/stalls/:id/items
// @access  Stall Owner
const createFoodItem = async (req, res) => {
    const { name, description, price, image, category, isVeg } = req.body;
    const stallId = req.params.id;

    try {
        // Verify ownership
        const stall = await Stall.findById(stallId);
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        
        if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to add items to this stall' });
        }

        const foodItem = new FoodItem({
            stall: stallId,
            name,
            description,
            price,
            image,
            category,
            isVeg
        });

        const createdItem = await foodItem.save();
        res.status(201).json(createdItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a food item
// @route   PUT /api/stalls/items/:itemId
// @access  Stall Owner / Admin
const updateFoodItem = async (req, res) => {
    const { name, description, price, image, category, isVeg, isAvailable } = req.body;
    
    try {
        const item = await FoodItem.findById(req.params.itemId);

        if (item) {
            const stall = await Stall.findById(item.stall);
            
            if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to edit this item' });
            }

            item.name = name || item.name;
            item.description = description || item.description;
            item.price = price || item.price;
            item.image = image || item.image;
            item.category = category || item.category;
            item.isVeg = isVeg !== undefined ? isVeg : item.isVeg;
            item.isAvailable = isAvailable !== undefined ? isAvailable : item.isAvailable;

            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a food item
// @route   DELETE /api/stalls/items/:itemId
// @access  Stall Owner / Admin
const deleteFoodItem = async (req, res) => {
    try {
        const item = await FoodItem.findById(req.params.itemId);

        if (item) {
             const stall = await Stall.findById(item.stall);
            
            if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to delete this item' });
            }

            await item.deleteOne();
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllStallsAdmin = async (req, res) => {
    try {
        const stalls = await Stall.find({}).populate('owner', 'name email');
        res.json(stalls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const setApprovalStatus = async (req, res) => {
    try {
        const { isApproved } = req.body;
        const stall = await Stall.findById(req.params.id);
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        stall.isApproved = !!isApproved;
        const updated = await stall.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const setOpenStatus = async (req, res) => {
    try {
        const { isOpen } = req.body;
        const stall = await Stall.findById(req.params.id);
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to change open status' });
        }
        stall.isOpen = !!isOpen;
        const updated = await stall.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const setPreBookingStatus = async (req, res) => {
    try {
        const { preBookingEnabled } = req.body;
        const stall = await Stall.findById(req.params.id);
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to change pre-booking status' });
        }
        stall.preBookingEnabled = !!preBookingEnabled;
        const updated = await stall.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a stall's name
// @route   PUT /api/stalls/:id/name
// @access  Private (Stall Owner/Admin)
const updateStallName = async (req, res) => {
    try {
        const { name } = req.body;
        const stall = await Stall.findById(req.params.id);
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        if (req.user.role !== 'admin' && stall.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this stall' });
        }
        stall.name = name || stall.name;
        const updated = await stall.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyStall = async (req, res) => {
    try {
        const stall = await Stall.findOne({ owner: req.user._id });
        if (!stall) return res.status(404).json({ message: 'Stall not found' });
        const items = await FoodItem.find({ stall: stall._id });
        res.json({ ...stall._doc, items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStalls, getStallById, getStallByIdOwner, getMyStall, createStall, createFoodItem, updateFoodItem, deleteFoodItem, getAllStallsAdmin, setApprovalStatus, setOpenStatus, setPreBookingStatus, updateStallName };
