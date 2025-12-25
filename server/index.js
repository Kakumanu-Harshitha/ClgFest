const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stalls', require('./routes/stallRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/settings', require('./routes/systemSettingsRoutes'));
app.use('/api/luckydraw', require('./routes/luckyDrawRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
// Conditionally load payment routes to handle cases where dependencies aren't installed
try {
    app.use('/api/payments', require('./routes/paymentRoutes'));
} catch (error) {
    console.warn('Payment routes not loaded:', error.message);
    // Still provide a payment endpoint that returns an error
    app.use('/api/payments', (req, res) => {
        res.status(500).json({ message: 'Payment service not configured' });
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
