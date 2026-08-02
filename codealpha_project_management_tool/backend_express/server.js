import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';

// Load ENV
dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('TaskFlow API is running...');
});

// Port
const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
});
