const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    otpHash: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300
    }
});

module.exports = mongoose.model('OTP', otpSchema);
