import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Seed data
const mockProducts = [
    {
        name: "AeroPro Wireless Headphones",
        description: "Experience premium active noise cancelling sound with lightweight ergonomic ear cushions and up to 40 hours of battery life.",
        price: 19999.00,
        category: "electronics",
        rating: 4.8,
        reviewsCount: 124,
        stock: 15,
        color: "#a855f7",
        imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        discount: 10
    },
    {
        name: "Quantum Smart Watch",
        description: "Track your health metrics, sync workouts, and receive real-time notifications on a bright crystal clear OLED display.",
        price: 15999.00,
        category: "wearables",
        rating: 4.6,
        reviewsCount: 89,
        stock: 8,
        color: "#ec4899",
        imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80",
        discount: 15
    },
    {
        name: "Ergonomic Mechanical Keyboard",
        description: "Hot-swappable switches, dynamic RGB backlighting, and a premium aluminum top frame for maximum typing efficiency and speed.",
        price: 9999.00,
        category: "accessories",
        rating: 4.7,
        reviewsCount: 210,
        stock: 22,
        color: "#3b82f6",
        imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?w=600&auto=format&fit=crop&q=80",
        discount: 0
    },
    {
        name: "Ultra-Wide Curve Monitor 34\"",
        description: "Immersive 1500R curvature, 144Hz refresh rate, and 3440 x 1440 resolution for a cinema-grade gaming and productivity setup.",
        price: 49999.00,
        category: "electronics",
        rating: 4.9,
        reviewsCount: 65,
        stock: 5,
        color: "#10b981",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
        discount: 20
    },
    {
        name: "FitTrack Smart Scale",
        description: "Syncs weight, body fat %, muscle mass, and water content to your smartphone app automatically via Bluetooth.",
        price: 3999.00,
        category: "wearables",
        rating: 4.2,
        reviewsCount: 312,
        stock: 40,
        color: "#f59e0b",
        imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80",
        discount: 5
    },
    {
        name: "USB-C Multi-Port Hub",
        description: "8-in-1 expansion dock featuring HDMI 4K, SD card slots, USB 3.0 ports, and 100W Power Delivery pass-through.",
        price: 4999.00,
        category: "accessories",
        rating: 4.5,
        reviewsCount: 178,
        stock: 18,
        color: "#ef4444",
        imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&auto=format&fit=crop&q=80",
        discount: 0
    }
];

// @desc    Get all products (with category filter and seeding)
// @route   GET /api/products
router.get('/', async (req, res) => {
    try {
        let count = await Product.countDocuments();
        if (count === 0) {
            // Seed the DB
            await Product.insertMany(mockProducts);
            console.log("Seeded mock products into MongoDB.");
        }

        const { category, search } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a product
// @route   POST /api/products
router.post('/', async (req, res) => {
    const { name, description, price, category, rating, reviewsCount, stock, color, imageUrl, discount } = req.body;

    try {
        const product = new Product({
            name,
            description,
            price: Number(price),
            category,
            rating: Number(rating) || 0,
            reviewsCount: Number(reviewsCount) || 0,
            stock: Number(stock) || 0,
            color: color || "#6366f1",
            imageUrl,
            discount: Number(discount) || 0
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
router.put('/:id', async (req, res) => {
    const { name, description, price, category, rating, reviewsCount, stock, color, imageUrl, discount } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            if (name !== undefined) product.name = name;
            if (description !== undefined) product.description = description;
            if (price !== undefined) product.price = Number(price);
            if (category !== undefined) product.category = category;
            if (rating !== undefined) product.rating = Number(rating);
            if (reviewsCount !== undefined) product.reviewsCount = Number(reviewsCount);
            if (stock !== undefined) product.stock = Number(stock);
            if (color !== undefined) product.color = color;
            if (imageUrl !== undefined) product.imageUrl = imageUrl;
            if (discount !== undefined) product.discount = Number(discount);

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
