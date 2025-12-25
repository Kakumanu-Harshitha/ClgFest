const mongoose = require('mongoose');

const foodItemSchema = mongoose.Schema({
    stall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stall',
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
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isVeg: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
