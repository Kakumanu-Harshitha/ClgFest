const Offer = require('../models/Offer');

const createOffer = async (req, res) => {
    const { title, description, discountPercentage, couponCode, validUntil, stall } = req.body;

    // Stall ID is optional (if null, it's a global offer)
    // Only Admin can create global offers
    // Stall Owners can create offers for their stall

    try {
        if (!stall && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can create global offers' });
        }

        if (stall && req.user.role !== 'stall_owner' && req.user.role !== 'admin') {
             return res.status(403).json({ message: 'Not authorized to create stall offers' });
        }
        
        // If stall owner, ensure they own the stall
        if (req.user.role === 'stall_owner' && req.user.stallId.toString() !== stall) {
             return res.status(403).json({ message: 'Not authorized for this stall' });
        }

        // Normalize validUntil to end-of-day if provided
        let validDate = validUntil;
        if (validUntil) {
            const d = new Date(validUntil);
            if (!isNaN(d.getTime())) {
                d.setHours(23, 59, 59, 999);
                validDate = d;
            } else {
                validDate = undefined;
            }
        }

        const offer = await Offer.create({
            title,
            description,
            discountPercentage,
            couponCode,
            stall: stall || null,
            validUntil: validDate
        });

        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOffers = async (req, res) => {
    try {
        const currentDate = new Date();
        const offers = await Offer.find({
            isActive: true,
            $or: [
                { validUntil: { $gte: currentDate } },
                { validUntil: { $exists: false } },
                { validUntil: null }
            ]
        }).populate('stall', 'name');

        const globalOffers = offers.filter(offer => !offer.stall);
        const stallOffers = offers.filter(offer => offer.stall);

        res.json({ globalOffers, stallOffers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Authorization check
        if (req.user.role !== 'admin') {
            if (req.user.role !== 'stall_owner' || (offer.stall && offer.stall.toString() !== req.user.stallId.toString())) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        await Offer.deleteOne({ _id: req.params.id });
        res.json({ message: 'Offer removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createOffer, getOffers, deleteOffer };
