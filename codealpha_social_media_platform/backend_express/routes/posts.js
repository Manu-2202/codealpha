import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Mock seed helpers
const seedMockData = async () => {
    // Create 3 mock users
    const dummyPass = '$2a$10$D2B9N8W7J3O4H2O6P2E8Le.1h/kX24jC2Y7.W7G9D8X5J2D3Z2P3q'; // hashed 'password'
    
    const users = [
        { username: "alice_cyber", email: "alice@gmail.com", password: dummyPass, avatarColor: "#a855f7", bio: "Exploring the decentralised web." },
        { username: "tech_titan", email: "titan@gmail.com", password: dummyPass, avatarColor: "#3b82f6", bio: "Next-gen tech builder and hardware geek." },
        { username: "aurora_dreamer", email: "aurora@gmail.com", password: dummyPass, avatarColor: "#10b981", bio: "Designing immersive VR spaces." }
    ];

    const createdUsers = await User.insertMany(users);
    
    // Create mock posts
    const posts = [
        {
            user: createdUsers[0]._id,
            content: "Just deployed my first WebRTC video stream server! The latency is under 50ms. The future of decentralized communication is looking bright! 🚀📺",
            likes: [createdUsers[1]._id],
            comments: [
                { user: createdUsers[1]._id, username: createdUsers[1].username, avatarColor: createdUsers[1].avatarColor, text: "Awesome! Are you using Socket.io for the signaling?" }
            ]
        },
        {
            user: createdUsers[1]._id,
            content: "Looking for recommendations: Which database performs better for highly connected graph relations? Neo4j, MongoDB, or PostgreSQL?",
            likes: [],
            comments: []
        },
        {
            user: createdUsers[2]._id,
            content: "Just finished building a glassmorphic dashboard design in React. It's amazing how simple CSS back-drop filters can completely premium-ize a dashboard interface! ✨🎨",
            likes: [createdUsers[0]._id, createdUsers[1]._id],
            comments: [
                { user: createdUsers[0]._id, username: createdUsers[0].username, avatarColor: createdUsers[0].avatarColor, text: "Totally agree, glassmorphic UI looks very premium." }
            ]
        }
    ];

    await Post.insertMany(posts);
    console.log("Seeded mock social users and posts into MongoDB.");
};

// @desc    Get feed posts
// @route   GET /api/posts
router.get('/', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            await seedMockData();
        }

        const posts = await Post.find()
            .populate('user', 'username avatarColor bio')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Post content is required' });
    }

    try {
        const post = new Post({
            user: req.user._id,
            content
        });

        const createdPost = await post.save();
        const populatedPost = await Post.findById(createdPost._id).populate('user', 'username avatarColor bio');
        
        res.status(201).json(populatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Like / unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const alreadyLiked = post.likes.includes(req.user._id);

        if (alreadyLiked) {
            // Unlike
            post.likes = post.likes.filter(uid => uid.toString() !== req.user._id.toString());
        } else {
            // Like
            post.likes.push(req.user._id);
        }

        await post.save();
        res.json(post.likes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add comment
// @route   POST /api/posts/:id/comment
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: req.user._id,
            username: req.user.username,
            avatarColor: req.user.avatarColor,
            text
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(post.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get follow suggestions
// @route   GET /api/posts/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
    try {
        // Exclude current user and already followed users
        const suggestions = await User.find({
            _id: { $ne: req.user._id, $nin: req.user.following }
        }).select('username avatarColor bio').limit(5);

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Follow / Unfollow user
// @route   PUT /api/posts/follow/:id
// @access  Private
router.put('/follow/:id', protect, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        const alreadyFollowing = currentUser.following.includes(userToFollow._id);

        if (alreadyFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(uid => uid.toString() !== userToFollow._id.toString());
            userToFollow.followers = userToFollow.followers.filter(uid => uid.toString() !== currentUser._id.toString());
        } else {
            // Follow
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);
        }

        await currentUser.save();
        await userToFollow.save();

        res.json({ following: currentUser.following });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
