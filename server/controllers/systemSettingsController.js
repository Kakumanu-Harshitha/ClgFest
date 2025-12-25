const SystemSettings = require('../models/SystemSettings');

// @desc    Get system settings (QR code, etc.)
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        
        if (!settings) {
            // Create default settings if not exists
            settings = new SystemSettings({
                upiId: 'admin@upi', // Default or placeholder
                upiQrImage: '' 
            });
            await settings.save();
        }

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateSettings = async (req, res) => {
    try {
        const { upiId, upiQrImage } = req.body;
        
        let settings = await SystemSettings.findOne();

        if (!settings) {
            settings = new SystemSettings({
                upiId,
                upiQrImage
            });
        } else {
            settings.upiId = upiId || settings.upiId;
            settings.upiQrImage = upiQrImage || settings.upiQrImage;
        }

        const updatedSettings = await settings.save();
        res.json(updatedSettings);

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
