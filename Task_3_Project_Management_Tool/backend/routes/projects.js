import express from 'express';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Auto seed function
const seedDefaultProject = async (user) => {
    // Create a default board
    const board = await Board.create({
        title: "Development Board",
        description: "Core sprint tracking for NexFlow release.",
        user: user._id
    });

    const defaultTasks = [
        {
            board: board._id,
            title: "Design glassmorphic dark UI mockup",
            description: "Design high-fidelity dashboard layouts with vibrant glows and blur backdrops.",
            status: "Done",
            priority: "High",
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            assignee: user.username,
            comments: [
                { username: "System Manager", avatarColor: "#6366f1", text: "Approved by client." }
            ]
        },
        {
            board: board._id,
            title: "Setup Node.js Express server routes",
            description: "Setup JWT middleware and database connections to MongoDB.",
            status: "In Progress",
            priority: "Medium",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            assignee: user.username,
            comments: []
        },
        {
            board: board._id,
            title: "Implement WebRTC media channels",
            description: "Integrate peer-to-peer signaling sockets for real-time screenshare and streaming.",
            status: "To Do",
            priority: "High",
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            assignee: "Unassigned",
            comments: []
        }
    ];

    await Task.insertMany(defaultTasks);
    console.log("Seeded default boards and tasks.");
};

// @desc    Get all boards
// @route   GET /api/projects/boards
// @access  Private
router.get('/boards', protect, async (req, res) => {
    try {
        let boards = await Board.find({ user: req.user._id });

        if (boards.length === 0) {
            // Seed a board for the user
            await seedDefaultProject(req.user);
            boards = await Board.find({ user: req.user._id });
        }

        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a board
// @route   POST /api/projects/boards
// @access  Private
router.post('/boards', protect, async (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const board = new Board({
            title,
            description,
            user: req.user._id
        });

        const createdBoard = await board.save();
        res.status(201).json(createdBoard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all tasks for a specific board
// @route   GET /api/projects/boards/:boardId/tasks
// @access  Private
router.get('/boards/:boardId/tasks', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ board: req.params.boardId });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new task card
// @route   POST /api/projects/tasks
// @access  Private
router.post('/tasks', protect, async (req, res) => {
    const { boardId, title, description, priority, dueDate, assignee } = req.body;

    if (!boardId || !title) {
        return res.status(400).json({ message: 'Board ID and Title are required' });
    }

    try {
        const task = new Task({
            board: boardId,
            title,
            description,
            priority,
            dueDate,
            assignee
        });

        const createdTask = await task.save();
        res.status(201).json(createdTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update task (status or content)
// @route   PUT /api/projects/tasks/:id
// @access  Private
router.put('/tasks/:id', protect, async (req, res) => {
    const { title, description, status, priority, dueDate, assignee } = req.body;

    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task card not found' });
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (assignee !== undefined) task.assignee = assignee;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add comment to task card
// @route   POST /api/projects/tasks/:id/comment
// @access  Private
router.post('/tasks/:id/comment', protect, async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task card not found' });
        }

        const newComment = {
            username: req.user.username,
            avatarColor: req.user.avatarColor,
            text
        };

        task.comments.push(newComment);
        await task.save();

        res.status(201).json(task.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
