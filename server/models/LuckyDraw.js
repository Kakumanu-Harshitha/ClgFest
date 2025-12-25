const mongoose = require('mongoose');

// Lucky Draw Schema for storing lucky draw history

const luckyDrawSchema = mongoose.Schema({
    drawNumber: {
        type: Number,
        required: true,
        unique: true
    },
    winner: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        branch: {
            type: String
        }
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    stall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stall',
        required: true
    },
    stallName: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LuckyDraw', luckyDrawSchema);