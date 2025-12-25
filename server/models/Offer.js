const mongoose = require('mongoose');

const offerSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountPercentage: { type: Number, default: 0 },
    couponCode: { type: String, uppercase: true },
    stall: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall' }, // If null, it's a global offer
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
