import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    avatarColor: {
        type: String,
        required: true,
        default: '#3b82f6'
    },
    text: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const taskSchema = new mongoose.Schema({
    board: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Board'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        required: true,
        enum: ['To Do', 'In Progress', 'Review', 'Done'],
        default: 'To Do'
    },
    priority: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    dueDate: {
        type: Date
    },
    assignee: {
        type: String,
        default: 'Unassigned'
    },
    comments: [commentSchema]
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
