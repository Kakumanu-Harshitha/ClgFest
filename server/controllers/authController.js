const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const { sendOTP, smsConfigured } = require('../utils/sms');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const requestOTP = async (req, res) => {
    try {
        // OTP functionality has been removed
        res.status(400).json({ message: 'OTP verification has been disabled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const registerUser = async (req, res) => {
    const { name, email, phone, password, role, branch, college, stallId, otp } = req.body;

    // Basic validation based on role
    if (role === 'admin' || role === 'stall_owner') {
        if (!email) return res.status(400).json({ message: 'Email is required for this role' });
    }
    if (role === 'stall_owner') {
        if (!phone) return res.status(400).json({ message: 'Phone is required for this role' });
    }
    if (role === 'customer') {
        // Removed branch and college requirement for simpler registration
        // if (!branch) return res.status(400).json({ message: 'Branch is required for customer' });
        // if (!college) return res.status(400).json({ message: 'College is required for customer' });
    }

    try {
        // Removed OTP verification requirement
        // Verify OTP if role is customer - REMOVED
        // if (role === 'customer') {
        //     if (!otp) return res.status(400).json({ message: 'OTP is required' });
        //     const record = await OTP.findOne({ phone });
        //     if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
        //     const ok = await bcrypt.compare(otp, record.otpHash);
        //     if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });
        //     await OTP.deleteOne({ _id: record._id });
        // }

        // Check if user exists
        let userExists;
        if (email) {
            userExists = await User.findOne({ email });
            if (userExists) return res.status(400).json({ message: 'User with this email already exists' });
        }
        if (phone) {
            userExists = await User.findOne({ phone });
            if (userExists) return res.status(400).json({ message: 'User with this phone already exists' });
        }

        // Prepare user data, only include email if it's provided
        const userData = {
            name,
            phone,
            password,
            role,
            branch,
            college,
            stallId
        };
        
        // Only add email to userData if it's provided (non-empty)
        if (email) {
            userData.email = email;
        }
        
        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // Handle duplicate key errors (email or phone already exists)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            return res.status(400).json({ 
                message: `${field} '${value}' already exists` 
            });
        }
        res.status(500).json({ message: error.message });
    }
};

const authUser = async (req, res) => {
    const { email, phone, password, otp } = req.body;

    try {
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (phone) {
            user = await User.findOne({ phone });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Login with Password
        if (password) {
            if (!(await user.matchPassword(password))) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        } else {
             return res.status(400).json({ message: 'Password required' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id),
            stallId: user.stallId
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { phone, newPassword } = req.body; // Removed OTP requirement

    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Removed OTP verification for password reset
        user.password = newPassword; // Will be hashed by pre-save hook
        await user.save();
        
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            branch: user.branch,
            college: user.college
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { registerUser, authUser, getUserProfile, requestOTP, resetPassword };
