const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1
            }
        }
    ],
    totalPrice: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

//Export the model
module.exports = mongoose.model('Cart', cartSchema);