import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    username: {
        type: String,
        required: true
    },
    avatarColor: {
        type: String,
        required: true,
        default: '#6366f1'
    },
    text: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    content: {
        type: String,
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [commentSchema]
}, {
    timestamps: true
});

const Post = mongoose.model('Post', postSchema);
export default Post;
