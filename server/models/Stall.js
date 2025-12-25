const mongoose = require('mongoose');

const stallSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    location: {
        type: String,
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    preBookingEnabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Stall = mongoose.model('Stall', stallSchema);

module.exports = Stall;
