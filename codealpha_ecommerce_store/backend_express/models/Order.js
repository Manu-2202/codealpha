import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
            color: { type: String, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        type: String,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: true // Mock payment completion
    },
    status: {
        type: String,
        required: true,
        default: 'Processing'
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
