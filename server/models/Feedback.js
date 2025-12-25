const mongoose = require('mongoose');

const feedbackSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    stall: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    response: { type: String } // Stall owner response
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
