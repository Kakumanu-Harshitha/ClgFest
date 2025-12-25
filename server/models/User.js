const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Allow null/unique if using phone only
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'stall_owner', 'admin'],
        default: 'customer'
    },
    branch: {
        type: String
    },
    college: {
        type: String
    },
    stallId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stall'
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    }
}, {
    timestamps: true
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
