import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Route imports
import authRoutes from './routes/auth.js';

// Load ENV
dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('NexCall Signaling Server is running...');
});

// Socket.io Real-Time Signaling logic
io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join room
    socket.on('join-room', ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`${username} joined room: ${roomId}`);
        socket.to(roomId).emit('user-joined', { socketId: socket.id, username });
    });

    // WebRTC Signaling Relay
    socket.on('webrtc-offer', ({ targetSocketId, sdp }) => {
        io.to(targetSocketId).emit('webrtc-offer', { senderSocketId: socket.id, sdp });
    });

    socket.on('webrtc-answer', ({ targetSocketId, sdp }) => {
        io.to(targetSocketId).emit('webrtc-answer', { senderSocketId: socket.id, sdp });
    });

    socket.on('webrtc-candidate', ({ targetSocketId, candidate }) => {
        io.to(targetSocketId).emit('webrtc-candidate', { senderSocketId: socket.id, candidate });
    });

    // Sync drawing state on Whiteboard
    socket.on('whiteboard-draw', ({ roomId, drawData }) => {
        socket.to(roomId).emit('whiteboard-draw', drawData);
    });

    socket.on('whiteboard-clear', ({ roomId }) => {
        socket.to(roomId).emit('whiteboard-clear');
    });

    // Chat Message
    socket.on('send-chat-msg', ({ roomId, senderName, text }) => {
        io.to(roomId).emit('chat-msg-received', { senderName, text, time: new Date().toLocaleTimeString() });
    });

    socket.on('disconnect', () => {
        console.log(`Socket Disconnected: ${socket.id}`);
        io.emit('user-left', { socketId: socket.id });
    });
});

// Port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`NexCall Server running on port ${PORT} with WebSockets enabled`);
});
