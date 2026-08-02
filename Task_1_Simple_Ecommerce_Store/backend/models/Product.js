import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0.0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        default: 0.0
    },
    reviewsCount: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    color: {
        type: String,
        required: true,
        default: "#6366f1"
    },
    imageUrl: {
        type: String
    },
    discount: {
        type: Number,
        required: true,
        default: 0
    }


}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
