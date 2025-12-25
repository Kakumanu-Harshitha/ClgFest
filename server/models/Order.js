const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stall',
        required: true
    },
    items: [
        {
            foodItem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FoodItem',
                required: true
            },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI'],
        default: 'Cash'
    },
    transactionId: { // User entered transaction ID for verification
        type: String
    },
    orderType: {
        type: String,
        enum: ['Live', 'Pre-booking'],
        default: 'Live'
    },
    pickupTime: { // For Pre-booking
        type: Date
    },
    tokenNumber: {
        type: Number
    },
    tokenStatus: {
        type: String,
        enum: ['ACTIVE', 'DELIVERED', 'CANCELLED', null],
        default: null
    },
    stallName: {
        type: String
    },
    eventName: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
