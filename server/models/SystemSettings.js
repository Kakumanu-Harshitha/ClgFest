const mongoose = require('mongoose');

const systemSettingsSchema = mongoose.Schema({
    upiId: { type: String, required: true },
    upiQrImage: { type: String, default: '' },
    luckyDrawEnabled: { type: Boolean, default: false },
    luckyDrawStall: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', default: null },
    luckyDrawThreshold: { type: Number, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
