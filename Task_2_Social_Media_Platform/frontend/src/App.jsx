import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

const mockSuggestions = [
    { _id: "s1", username: "alice_cyber", avatarColor: "#a855f7", bio: "Exploring the decentralised web." },
    { _id: "s2", username: "tech_titan", avatarColor: "#3b82f6", bio: "Next-gen tech builder and hardware geek." },
    { _id: "s3", username: "aurora_dreamer", avatarColor: "#10b981", bio: "Designing immersive VR spaces." }
];

const mockPosts = [
    {
        _id: "p1",
        user: { _id: "s1", username: "alice_cyber", avatarColor: "#a855f7" },
        content: "Just deployed my first WebRTC video stream server! The latency is under 50ms. The future of decentralized communication is looking bright! 🚀📺",
        likes: ["guest_uid"],
        comments: [
            { _id: "c1", user: { username: "tech_titan", avatarColor: "#3b82f6" }, text: "That is insane! What signaling protocols are you using?" }
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        _id: "p2",
        user: { _id: "s2", username: "tech_titan", avatarColor: "#3b82f6" },
        content: "Building a mechanical keyboard with custom RGB layout and hot-swappable tactile switches today. Time to do some soldering! ⌨️🔩",
        likes: [],
        comments: [],
        createdAt: new Date(Date.now() - 7200000).toISOString()
    }
];

const mockChatMessages = {
    s1: [
        { sender: 'them', text: 'Hey there! Did you check out the WebRTC whiteboard canvas I built?', time: '10:00 AM' }
    ],
    s2: [
        { sender: 'them', text: 'Sup! Are you going to join the scrum board review meeting later?', time: '11:30 AM' }
    ],
    s3: [
        { sender: 'them', text: 'Hey, I just updated the design specs on the dashboard.', time: '12:05 PM' }
    ]
};

export default function App() {
    // Navigation View State
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'explore' | 'messenger' | 'profile'

    // App State
    const [posts, setPosts] = useState(mockPosts);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('nexsocial_user')) || null);
    const [isOffline, setIsOffline] = useState(false);
    
    // UI Form State
    const [postText, setPostText] = useState('');
    const [commentTexts, setCommentTexts] = useState({});
    
    // Auth Modal State
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authTab, setAuthTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Explore / Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('');

    // Messenger State
    const [activeChatUser, setActiveChatUser] = useState(mockSuggestions[0]);
    const [chatHistory, setChatHistory] = useState(() => {
        return JSON.parse(localStorage.getItem('nexsocial_chats')) || mockChatMessages;
    });
    const [chatInput, setChatInput] = useState('');

    // Profile State
    const [userBio, setUserBio] = useState(() => {
        return localStorage.getItem('nexsocial_bio') || "Passionate tech enthusiast and MERN Stack builder.";
    });
    const [isEditingBio, setIsEditingBio] = useState(false);

    // Fetch Posts on Init
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch(`${API_URL}/posts`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setPosts(data);
                setIsOffline(false);
            } catch (err) {
                setIsOffline(true);
                // offline mock fallback
            }
        };
        fetchPosts();
    }, [activeTab]);

    // Cache Messenger state
    useEffect(() => {
        localStorage.setItem('nexsocial_chats', JSON.stringify(chatHistory));
    }, [chatHistory]);

    // Create Post
    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postText.trim()) return;

        const activeUser = user || { _id: 'guest_uid', username: 'Guest User', avatarColor: '#10b981' };
        const newPostPayload = { content: postText };

        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(newPostPayload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPosts([data, ...posts]);
            setPostText('');
        } catch (err) {
            const dummyPost = {
                _id: 'local_' + Date.now(),
                user: { _id: activeUser._id, username: activeUser.username, avatarColor: activeUser.avatarColor },
                content: postText,
                likes: [],
                comments: [],
                createdAt: new Date().toISOString()
            };
            setPosts([dummyPost, ...posts]);
            setPostText('');
            if (!isOffline) setIsOffline(true);
        }
    };

    // Toggle Like
    const handleLike = async (postId) => {
        const activeUser = user || { _id: 'guest_uid', username: 'Guest User', avatarColor: '#10b981' };
        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setPosts(posts.map(p => p._id === postId ? { ...p, likes: data } : p));
        } catch (err) {
            setPosts(posts.map(p => {
                if (p._id === postId) {
                    const userId = activeUser._id;
                    const alreadyLiked = p.likes.includes(userId);
                    const newLikes = alreadyLiked 
                        ? p.likes.filter(id => id !== userId) 
                        : [...p.likes, userId];
                    return { ...p, likes: newLikes };
                }
                return p;
            }));
            if (!isOffline) setIsOffline(true);
        }
    };

    // Add Comment
    const handleAddComment = async (postId) => {
        const text = commentTexts[postId] || '';
        if (!text.trim()) return;

        const activeUser = user || { _id: 'guest_uid', username: 'Guest User', avatarColor: '#10b981' };
        const payload = { text };

        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setPosts(posts.map(p => p._id === postId ? { ...p, comments: data } : p));
            setCommentTexts({ ...commentTexts, [postId]: '' });
        } catch (err) {
            setPosts(posts.map(p => {
                if (p._id === postId) {
                    const newComment = {
                        _id: 'c_' + Date.now(),
                        text,
                        user: { _id: activeUser._id, username: activeUser.username, avatarColor: activeUser.avatarColor },
                        createdAt: new Date().toISOString()
                    };
                    return { ...p, comments: [...p.comments, newComment] };
                }
                return p;
            }));
            setCommentTexts({ ...commentTexts, [postId]: '' });
            if (!isOffline) setIsOffline(true);
        }
    };

    // Follow Suggestion Toggle
    const handleFollow = async (suggestedId) => {
        const activeUser = user || { _id: 'guest_uid', username: 'Guest User', following: [] };
        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/posts/follow/${suggestedId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setUser({ ...user, following: data.following });
            localStorage.setItem('nexsocial_user', JSON.stringify({ ...user, following: data.following }));
        } catch (err) {
            const updatedFollowing = activeUser.following.includes(suggestedId)
                ? activeUser.following.filter(id => id !== suggestedId)
                : [...activeUser.following, suggestedId];
            
            if (user) {
                const updatedUser = { ...user, following: updatedFollowing };
                setUser(updatedUser);
                localStorage.setItem('nexsocial_user', JSON.stringify(updatedUser));
            } else {
                alert(`Simulated following user successfully!`);
            }
            if (!isOffline) setIsOffline(true);
        }
    };

    // Send Message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const activeId = activeChatUser._id;
        const newUserMsg = { sender: 'me', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        
        const updatedConversation = [...(chatHistory[activeId] || []), newUserMsg];
        setChatHistory({
            ...chatHistory,
            [activeId]: updatedConversation
        });
        setChatInput('');

        // Simulate chatbot response after 1.2 seconds
        setTimeout(() => {
            const botReplies = [
                "That sounds super interesting! I'm currently hacking away at a React prototype.",
                "Haha nice! Let's schedule a Zoom call to discuss this WebRTC canvas design later.",
                "Awesome! Did you push that code to the repository? Let's check it out.",
                "Oh, definitely! We should sync up our Kanban tasks on the project board.",
                "Wow, fantastic. The MERN stack is extremely fast for real-time widgets!"
            ];
            const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
            const botMsg = { sender: 'them', text: randomReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            
            setChatHistory(prevHistory => ({
                ...prevHistory,
                [activeId]: [...(prevHistory[activeId] || []), botMsg]
            }));
        }, 1200);
    };

    // Save bio locally
    const handleSaveBio = () => {
        localStorage.setItem('nexsocial_bio', userBio);
        setIsEditingBio(false);
    };

    // Auth Submission
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUser(data);
            localStorage.setItem('nexsocial_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setEmail('');
            setPassword('');
        } catch (err) {
            const name = email.split('@')[0];
            const dummyUser = { _id: 'u_' + Date.now(), username: name, email, avatarColor: '#6366f1', following: [], token: 'offline-token' };
            setUser(dummyUser);
            localStorage.setItem('nexsocial_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setEmail('');
            setPassword('');
            alert('Offline Mode: Simulated logging in as ' + name);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUser(data);
            localStorage.setItem('nexsocial_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
        } catch (err) {
            const dummyUser = { _id: 'u_' + Date.now(), username: regUsername, email: regEmail, avatarColor: '#a855f7', following: [], token: 'offline-token' };
            setUser(dummyUser);
            localStorage.setItem('nexsocial_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            alert('Offline Mode: Simulated registration completion.');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('nexsocial_user');
        setActiveTab('feed');
        alert('Logged out.');
    };

    // Filter explore posts
    const exploreFilteredPosts = posts.filter(p => {
        const matchesQuery = p.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.user.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag ? p.content.toLowerCase().includes(selectedTag.toLowerCase()) : true;
        return matchesQuery && matchesTag;
    });

    const activeUser = user || { _id: 'guest_uid', username: 'Guest User', avatarColor: '#10b981' };

    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="header-container">
                    <a href="#" className="logo" onClick={() => setActiveTab('feed')}>
                        <span className="gradient-text">Nex</span>Social
                    </a>
                    
                    <nav className="nav-links">
                        <button className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
                            <i className="fa-solid fa-house"></i> Home
                        </button>
                        <button className={`nav-link ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}>
                            <i className="fa-solid fa-compass"></i> Explore
                        </button>
                        <button className={`nav-link ${activeTab === 'messenger' ? 'active' : ''}`} onClick={() => setActiveTab('messenger')}>
                            <i className="fa-solid fa-paper-plane"></i> Messages
                        </button>
                        <button className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                            <i className="fa-solid fa-user"></i> Profile
                        </button>

                        {user ? (
                            <>
                                <span className="user-greeting">Hi, {user.username}</span>
                                <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <button className="btn btn-primary" onClick={() => { setAuthTab('login'); setIsAuthOpen(true); }}>
                                Login
                            </button>
                        )}
                    </nav>
                </div>
            </header>

            {/* Offline Notification */}
            {isOffline && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    padding: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginTop: '65px',
                    textAlign: 'center'
                }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> Offline fallback activated. Posting and commenting running in simulated local memory.
                </div>
            )}

            {/* Main Application Switch */}
            <main className="main-container" style={{ marginTop: isOffline ? '20px' : '85px', maxWidth: activeTab === 'messenger' ? '1100px' : '960px' }}>
                
                {/* 1. TIMELINE FEED VIEW */}
                {activeTab === 'feed' && (
                    <div className="feed-layout">
                        {/* Feed Column */}
                        <div className="feed-column">
                            {/* Create Post Card */}
                            <div className="glass-card create-post-card">
                                <div className="avatar" style={{ background: activeUser.avatarColor }}>
                                    {activeUser.username.substring(0, 2).toUpperCase()}
                                </div>
                                <form onSubmit={handleCreatePost} className="post-form">
                                    <textarea 
                                        placeholder={`What is on your mind, ${activeUser.username}? Share tech stories...`}
                                        value={postText}
                                        onChange={(e) => setPostText(e.target.value)}
                                        rows="3"
                                        required
                                    />
                                    <div className="form-actions">
                                        <span className="char-count" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {postText.length} chars
                                        </span>
                                        <button type="submit" className="btn btn-primary">
                                            Publish <i className="fa-solid fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Feed Timeline */}
                            <div className="posts-container">
                                {posts.map(post => {
                                    const hasLiked = post.likes.includes(activeUser._id);
                                    return (
                                        <div className="glass-card post-card" key={post._id}>
                                            <div className="post-header">
                                                <div className="avatar" style={{ background: post.user.avatarColor }}>
                                                    {post.user.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="post-user-info">
                                                    <h4>{post.user.username}</h4>
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="post-content">{post.content}</p>
                                            
                                            <div className="post-actions">
                                                <button className={`action-btn ${hasLiked ? 'liked' : ''}`} onClick={() => handleLike(post._id)}>
                                                    <i className="fa-solid fa-heart"></i>
                                                    <span>{post.likes.length} Likes</span>
                                                </button>
                                                <button className="action-btn">
                                                    <i className="fa-solid fa-comment"></i>
                                                    <span>{post.comments.length} Comments</span>
                                                </button>
                                            </div>

                                            {/* Comments log */}
                                            <div className="comments-section">
                                                {post.comments.map((comment, index) => (
                                                    <div className="comment-item" key={comment._id || index}>
                                                        <div className="avatar avatar-sm" style={{ background: comment.user?.avatarColor || '#a855f7' }}>
                                                            {(comment.user?.username || 'G').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="comment-content">
                                                            <h5>{comment.user?.username || 'Guest'}</h5>
                                                            <p>{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))}

                                                <form onSubmit={(e) => { e.preventDefault(); handleAddComment(post._id); }} className="comment-form">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Write a comment..." 
                                                        value={commentTexts[post._id] || ''}
                                                        onChange={(e) => setCommentTexts({ ...commentTexts, [post._id]: e.target.value })}
                                                        required
                                                    />
                                                    <button type="submit">Post</button>
                                                </form>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar Suggestions */}
                        <div className="sidebar-column">
                            <div className="glass-card suggestions-card">
                                <h3>Who to Follow</h3>
                                <div className="suggestions-list">
                                    {mockSuggestions.map(suggest => {
                                        const isFollowing = user && user.following && user.following.includes(suggest._id);
                                        return (
                                            <div className="suggestion-item" key={suggest._id}>
                                                <div className="avatar" style={{ background: suggest.avatarColor }}>
                                                    {suggest.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="suggestion-info">
                                                    <h4>{suggest.username}</h4>
                                                    <p>{suggest.bio}</p>
                                                </div>
                                                <button className={`btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}`} onClick={() => handleFollow(suggest._id)}>
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. EXPLORE VIEW */}
                {activeTab === 'explore' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Discover Tech Space</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Explore trending topics, tools, and find new developer insights.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                            <div>
                                <div className="glass-card" style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                    <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)' }}></i>
                                    <input 
                                        type="text" 
                                        placeholder="Search by keywords, code tags, or username..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'white', fontSize: '1rem' }}
                                    />
                                </div>

                                {exploreFilteredPosts.length === 0 ? (
                                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <i className="fa-solid fa-compass" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                                        <p>No matching explore posts found. Try selecting another hashtag!</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {exploreFilteredPosts.map(p => (
                                            <div className="glass-card post-card" key={p._id} style={{ margin: 0 }}>
                                                <div className="post-header">
                                                    <div className="avatar" style={{ background: p.user.avatarColor }}>
                                                        {p.user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="post-user-info">
                                                        <h4>{p.user.username}</h4>
                                                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <p className="post-content">{p.content}</p>
                                                <div className="post-actions">
                                                    <button className="action-btn" onClick={() => handleLike(p._id)}>
                                                        <i className="fa-solid fa-heart"></i>
                                                        <span>{p.likes.length} Likes</span>
                                                    </button>
                                                    <button className="action-btn">
                                                        <i className="fa-solid fa-comment"></i>
                                                        <span>{p.comments.length} Comments</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Hashtags column */}
                            <div className="glass-card" style={{ height: 'fit-content' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>Trending Channels</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { tag: '#webrtc', label: 'WebRTC Conferencing', count: 12 },
                                        { tag: '#react', label: 'React Frameworks', count: 48 },
                                        { tag: '#mern', label: 'Full Stack MERN', count: 35 },
                                        { tag: '#keyboard', label: 'Mechanical Keys', count: 8 },
                                        { tag: '#agile', label: 'Agile Kanban Boards', count: 15 }
                                    ].map(item => (
                                        <button 
                                            key={item.tag} 
                                            onClick={() => setSelectedTag(selectedTag === item.tag ? '' : item.tag)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                background: selectedTag === item.tag ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                                                border: selectedTag === item.tag ? '1px solid var(--primary-color)' : '1px solid transparent',
                                                color: selectedTag === item.tag ? 'var(--primary-color)' : 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.88rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                transition: 'var(--transition)'
                                            }}
                                        >
                                            <span><strong>{item.tag}</strong> <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.label}</span></span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.count} posts</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. MESSENGER / CHAT VIEW */}
                {activeTab === 'messenger' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Developer Messages</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Direct messaging portal with team members and network devs.</p>
                        
                        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '560px', padding: 0, overflow: 'hidden' }}>
                            {/* User sidebar */}
                            <div style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 700 }}>
                                    Active Chats
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {mockSuggestions.map(ch => (
                                        <div 
                                            key={ch._id}
                                            onClick={() => setActiveChatUser(ch)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '15px',
                                                cursor: 'pointer',
                                                background: activeChatUser._id === ch._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                borderLeft: activeChatUser._id === ch._id ? '3px solid var(--primary-color)' : '3px solid transparent',
                                                transition: 'var(--transition)'
                                            }}
                                        >
                                            <div className="avatar" style={{ background: ch.avatarColor, width: '40px', height: '40px', fontSize: '1rem', minWidth: '40px' }}>
                                                {ch.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '2px' }}>{ch.username}</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {chatHistory[ch._id]?.slice(-1)[0]?.text || "No messages yet."}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chat history */}
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.01)' }}>
                                {/* Chat active header */}
                                <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="avatar" style={{ background: activeChatUser.avatarColor, width: '38px', height: '38px', fontSize: '0.9rem' }}>
                                        {activeChatUser.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{activeChatUser.username}</h4>
                                        <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> Online
                                        </span>
                                    </div>
                                </div>

                                {/* Messages scrolling window */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {(chatHistory[activeChatUser._id] || []).length === 0 ? (
                                        <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Start conversation with {activeChatUser.username}!
                                        </div>
                                    ) : (
                                        (chatHistory[activeChatUser._id] || []).map((msg, index) => {
                                            const isMe = msg.sender === 'me';
                                            return (
                                                <div 
                                                    key={index} 
                                                    style={{
                                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                        maxWidth: '70%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: isMe ? 'flex-end' : 'flex-start'
                                                    }}
                                                >
                                                    <div 
                                                        style={{
                                                            padding: '10px 15px',
                                                            borderRadius: '16px',
                                                            borderBottomRightRadius: isMe ? '2px' : '16px',
                                                            borderBottomLeftRadius: isMe ? '16px' : '2px',
                                                            background: isMe ? 'var(--primary-grad)' : 'rgba(255,255,255,0.06)',
                                                            color: 'white',
                                                            fontSize: '0.9rem',
                                                            lineHeight: '1.4'
                                                        }}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{msg.time}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Chat input box */}
                                <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        placeholder={`Message ${activeChatUser.username}...`}
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        style={{ flex: 1, padding: '12px 15px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'white', outline: 'none' }}
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px', borderRadius: '12px' }}>
                                        Send <i className="fa-solid fa-paper-plane" style={{ marginLeft: '4px' }}></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. PROFILE VIEW */}
                {activeTab === 'profile' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Personal Profile</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                            {/* Profile details card */}
                            <div className="glass-card" style={{ height: 'fit-content', textAlign: 'center' }}>
                                <div className="avatar" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', fontSize: '2.5rem', background: activeUser.avatarColor }}>
                                    {activeUser.username.substring(0, 2).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{activeUser.username}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>{user ? user.email : 'guest@example.com'}</p>
                                
                                <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', margin: '1rem 0', display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem' }}>
                                    <div>
                                        <strong>{posts.filter(p => p.user.username === activeUser.username).length}</strong>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Posts</div>
                                    </div>
                                    <div>
                                        <strong>{user && user.following ? user.following.length : 0}</strong>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Following</div>
                                    </div>
                                    <div>
                                        <strong>128</strong>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Followers</div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Bio</h4>
                                    {isEditingBio ? (
                                        <div>
                                            <textarea 
                                                value={userBio} 
                                                onChange={(e) => setUserBio(e.target.value)}
                                                rows="3" 
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', padding: '5px', fontSize: '0.85rem', outline: 'none' }}
                                            />
                                            <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: '5px' }} onClick={handleSaveBio}>Save</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>{userBio}</p>
                                            <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: '8px' }} onClick={() => setIsEditingBio(true)}>Edit Bio</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filtered user posts grid */}
                            <div className="posts-container">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>My Published Posts</h3>
                                {posts.filter(p => p.user.username === activeUser.username).length === 0 ? (
                                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                        <i className="fa-solid fa-box-open" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}></i>
                                        <p>You haven't posted anything yet. Go to Home Feed to write your first story!</p>
                                    </div>
                                ) : (
                                    posts.filter(p => p.user.username === activeUser.username).map(post => (
                                        <div className="glass-card post-card" key={post._id} style={{ margin: 0, marginBottom: '1.5rem' }}>
                                            <div className="post-header">
                                                <div className="avatar" style={{ background: post.user.avatarColor }}>
                                                    {post.user.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="post-user-info">
                                                    <h4>{post.user.username}</h4>
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <p className="post-content">{post.content}</p>
                                            <div className="post-actions">
                                                <button className="action-btn">
                                                    <i className="fa-solid fa-heart"></i>
                                                    <span>{post.likes.length} Likes</span>
                                                </button>
                                                <button className="action-btn">
                                                    <i className="fa-solid fa-comment"></i>
                                                    <span>{post.comments.length} Comments</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>&copy; 2026 NexSocial. All rights reserved. Designed for CodeAlpha MERN Internship.</p>
            </footer>

            {/* Auth Modal */}
            <div className={`modal ${isAuthOpen ? 'open' : ''}`}>
                <div className="modal-overlay" onClick={() => setIsAuthOpen(false)}></div>
                <div className="modal-content auth-box">
                    <button className="close-btn" onClick={() => setIsAuthOpen(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    
                    <div className="auth-tabs">
                        <button className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>Login</button>
                        <button className={`auth-tab ${authTab === 'register' ? 'active' : ''}`} onClick={() => setAuthTab('register')}>Register</button>
                    </div>

                    {authTab === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="auth-form active">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Log In</button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="auth-form active">
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" required placeholder="johndoe" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required placeholder="name@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" required placeholder="Create password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Create Account</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
