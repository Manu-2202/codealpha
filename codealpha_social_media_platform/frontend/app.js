// App State & API Configuration
let backendChoice = localStorage.getItem('nexsocial_backend_choice') || 'express';
let API_URL = backendChoice === 'django' ? 'http://localhost:8001/api' : 'http://localhost:5001/api';

let postsData = [];
let currentUser = JSON.parse(localStorage.getItem('nexsocial_user')) || null;
let currentView = 'feed'; // 'feed' or 'profile'
let profileUserId = null; // ID of profile being viewed

// DOM Elements
const feedTabBtn = document.getElementById('feed-tab-btn');
const profileTabBtn = document.getElementById('profile-tab-btn');
const feedView = document.getElementById('feed-view');
const profileView = document.getElementById('profile-view');
const logoBtn = document.getElementById('logo-btn');

const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const postInput = document.getElementById('post-input');
const submitPostBtn = document.getElementById('submit-post-btn');
const postsList = document.getElementById('posts-list');
const createPostAvatar = document.getElementById('create-post-avatar');

const userBriefWidget = document.getElementById('user-brief-widget');
const whoToFollowList = document.getElementById('who-to-follow-list');

// Profile Page Elements
const profilePageAvatar = document.getElementById('profile-page-avatar');
const profilePageName = document.getElementById('profile-page-name');
const profilePageHandle = document.getElementById('profile-page-handle');
const profilePageBio = document.getElementById('profile-page-bio');
const statPosts = document.getElementById('stat-posts');
const statFollowers = document.getElementById('stat-followers');
const statFollowing = document.getElementById('stat-following');
const followToggleBtn = document.getElementById('follow-toggle-btn');
const profilePostsList = document.getElementById('profile-posts-list');

const backendSelect = document.getElementById('backend-api-select');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    backendSelect.value = backendChoice;
    checkUserSession();
    fetchPosts();
    loadWhoToFollow();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Backend Select
    backendSelect.addEventListener('change', (e) => {
        localStorage.setItem('nexsocial_backend_choice', e.target.value);
        window.location.reload();
    });

    // View Navigation
    feedTabBtn.addEventListener('click', () => switchView('feed'));
    logoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('feed');
    });
    profileTabBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("Please log in to view your profile!");
            authModal.classList.add('open');
            return;
        }
        switchView('profile', currentUser.id || currentUser._id);
    });

    // Auth Modal Toggle
    authBtn.addEventListener('click', () => {
        if (currentUser) {
            // Logout
            currentUser = null;
            localStorage.removeItem('nexsocial_user');
            localStorage.removeItem('nexsocial_token');
            checkUserSession();
            alert("Logged out successfully.");
            switchView('feed');
        } else {
            authModal.classList.add('open');
        }
    });

    // Auth Tabs Toggle
    tabLogin.addEventListener('click', () => toggleAuthTabs('login'));
    tabRegister.addEventListener('click', () => toggleAuthTabs('register'));

    // Auth Forms Submission
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Modals Close Event
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('open');
        });
    });

    // Create Post
    submitPostBtn.addEventListener('click', handleCreatePost);
}

// Switch view between Feed and Profile
function switchView(viewName, userId = null) {
    currentView = viewName;
    if (viewName === 'feed') {
        feedView.classList.add('active');
        profileView.classList.remove('active');
        feedTabBtn.classList.add('active');
        profileTabBtn.classList.remove('active');
        fetchPosts();
    } else if (viewName === 'profile') {
        feedView.classList.remove('active');
        profileView.classList.add('active');
        feedTabBtn.classList.remove('active');
        profileTabBtn.classList.add('active');
        profileUserId = userId;
        fetchUserProfile(userId);
    }
}

// Auth Toggle Tabs
function toggleAuthTabs(tab) {
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.add('active');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// User Session Check
function checkUserSession() {
    currentUser = JSON.parse(localStorage.getItem('nexsocial_user'));
    if (currentUser) {
        authBtn.querySelector('span').innerText = 'Logout';
        
        // Update user avatar in post box
        const avatarSeed = currentUser.username;
        createPostAvatar.innerHTML = `<img src="https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}" alt="Avatar">`;
        
        // Render brief user card in left sidebar
        renderUserBriefWidget();
    } else {
        authBtn.querySelector('span').innerText = 'Login';
        createPostAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
        userBriefWidget.innerHTML = `
            <div class="widget-placeholder" style="text-align: center; padding: 2rem 1rem;">
                <div class="avatar-placeholder" style="width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.05); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: rgba(255,255,255,0.2);">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h4 style="margin-bottom: 0.5rem; font-weight: 600;">Sign in to view metrics</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">See your followers, followings, and posts stats.</p>
                <button class="btn btn-primary btn-block btn-small" onclick="document.getElementById('auth-modal').classList.add('open')">Login Now</button>
            </div>
        `;
    }
}

// Render User Brief Widget in Left Sidebar
function renderUserBriefWidget() {
    if (!currentUser) return;
    const avatarUrl = currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`;
    
    // We will fetch profile metrics for current user
    const id = currentUser.id || currentUser._id;
    fetch(`${API_URL}/users/${id}/profile`)
        .then(res => res.json())
        .then(data => {
            const prof = data.profile;
            userBriefWidget.innerHTML = `
                <div style="text-align: center; padding: 1.5rem 1rem;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; overflow: hidden; margin: 0 auto 1rem; border: 2px solid var(--primary-color);">
                        <img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.2rem;">${prof.username}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">@${prof.username}</p>
                    <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 1.5rem; line-height: 1.4; padding: 0 0.5rem;">${prof.bio || "No bio yet."}</p>
                    
                    <div style="display: flex; justify-content: space-around; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                        <div>
                            <div style="font-weight: 700; font-size: 1.1rem;">${data.posts.length}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Posts</div>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 1.1rem;">${prof.followersCount}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Followers</div>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 1.1rem;">${prof.followingCount}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Following</div>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(err => console.error(err));
}

// Fetch Posts for Feed
async function fetchPosts() {
    try {
        const res = await fetch(`${API_URL}/posts`);
        if (!res.ok) throw new Error("Failed to fetch posts");
        postsData = await res.json();
        renderPosts();
    } catch (err) {
        console.error(err);
        postsList.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 3rem 1rem;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">Server Connection Offline</h3>
                <p style="color: var(--text-muted);">Could not load the feed. Make sure the backend server (${backendChoice.toUpperCase()} on Port ${backendChoice === 'django' ? '8000' : '5000'}) is running!</p>
            </div>
        `;
    }
}

// Render Feed Posts
function renderPosts() {
    if (postsData.length === 0) {
        postsList.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <i class="fa-regular fa-comments" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No posts yet. Be the first to share something!</p>
            </div>
        `;
        return;
    }

    postsList.innerHTML = postsData.map(post => renderSinglePostHTML(post)).join('');
}

// Render Single Post HTML
function renderSinglePostHTML(post) {
    const postId = post.id || post._id;
    const author = post.user;
    const authorId = author.id || author._id;
    const avatarUrl = author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${author.username}`;
    
    // Check if current user liked this post
    const isLiked = currentUser && post.likes && post.likes.map(id => id.toString()).includes((currentUser.id || currentUser._id).toString());
    const likeIconClass = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const likeBtnClass = isLiked ? 'btn-icon like-btn active' : 'btn-icon like-btn';
    const likesCount = post.likes ? post.likes.length : 0;
    
    // Render comments list
    const commentsListHTML = post.comments && post.comments.length > 0 ? post.comments.map(c => `
        <div class="comment-item" style="display:flex; gap:10px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:8px;">
            <div style="width:30px; height:30px; border-radius:50%; overflow:hidden;">
                <img src="${c.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user.username}`}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span style="font-weight:600; font-size:0.85rem;">${c.user.username}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">@${c.user.username}</span>
                </div>
                <p style="font-size:0.85rem; margin-top:2px; color:var(--text-main);">${c.content}</p>
            </div>
        </div>
    `).join('') : `<p class="no-comments-msg" style="font-size:0.85rem; color:var(--text-muted); padding: 5px 0;">No comments yet. Write one below!</p>`;

    const postImageHTML = post.imageUrl ? `
        <div class="post-image" style="margin-top: 1rem; border-radius: 12px; overflow: hidden; max-height: 350px;">
            <img src="${post.imageUrl}" alt="Post Media" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
    ` : '';

    return `
        <div class="glass-card post-card" id="post-${postId}" style="margin-bottom:1.5rem; padding:1.5rem;">
            <div class="post-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <div style="display:flex; gap:12px; align-items:center;">
                    <div style="width:45px; height:45px; border-radius:50%; overflow:hidden; border:1px solid rgba(255,255,255,0.1); cursor:pointer;" onclick="switchView('profile', ${authorId})">
                        <img src="${avatarUrl}" alt="${author.username}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div>
                        <h4 style="font-weight:700; cursor:pointer;" onclick="switchView('profile', ${authorId})">${author.username}</h4>
                        <p style="font-size:0.8rem; color:var(--text-muted);">@${author.username} • ${new Date(post.createdAt || post.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            
            <div class="post-body">
                <p style="font-size:1rem; line-height:1.5; white-space:pre-wrap;">${post.content}</p>
                ${postImageHTML}
            </div>
            
            <div class="post-actions" style="display:flex; gap:20px; margin-top:1.2rem; border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color); padding:0.6rem 0;">
                <button class="${likeBtnClass}" onclick="toggleLike(${postId})">
                    <i class="${likeIconClass}" style="color: ${isLiked ? '#ef4444' : ''};"></i> <span class="like-count" style="font-size:0.9rem; margin-left:4px; font-weight:500;">${likesCount}</span>
                </button>
                <button class="btn-icon comment-trigger-btn" onclick="toggleCommentsSection(${postId})">
                    <i class="fa-regular fa-comment"></i> <span style="font-size:0.9rem; margin-left:4px; font-weight:500;">${post.comments ? post.comments.length : 0}</span>
                </button>
            </div>

            <!-- Comments Section -->
            <div class="comments-section" id="comments-${postId}" style="display:none; margin-top:1rem; background:rgba(255,255,255,0.01); padding:1rem; border-radius:10px; border:1px solid rgba(255,255,255,0.02);">
                <div class="comments-list" style="max-height: 250px; overflow-y: auto; margin-bottom: 1rem;">
                    ${commentsListHTML}
                </div>
                <div style="display:flex; gap:10px;">
                    <input type="text" placeholder="Write a comment..." class="comment-input" id="comment-input-${postId}" style="flex:1; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); padding:8px 12px; border-radius:20px; color:white; outline:none; font-size:0.85rem;">
                    <button class="btn btn-primary btn-small" style="border-radius:20px; padding:0 15px;" onclick="submitComment(${postId})">Post</button>
                </div>
            </div>
        </div>
    `;
}

// Toggle comments visibility
function toggleCommentsSection(postId) {
    const commentsSec = document.getElementById(`comments-${postId}`);
    if (commentsSec.style.display === 'none') {
        commentsSec.style.display = 'block';
    } else {
        commentsSec.style.display = 'none';
    }
}

// Toggle Like API Call
async function toggleLike(postId) {
    if (!currentUser) {
        alert("Please log in to like posts!");
        authModal.classList.add('open');
        return;
    }
    const token = localStorage.getItem('nexsocial_token');
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to toggle like");

        // Reload feed or update local DOM counter
        const postCard = document.getElementById(`post-${postId}`);
        const likeCountSpan = postCard.querySelector('.like-count');
        const likeIcon = postCard.querySelector('.like-btn i');
        const likeBtn = postCard.querySelector('.like-btn');
        
        likeCountSpan.innerText = data.likes.length;
        if (data.action === 'liked') {
            likeIcon.className = 'fa-solid fa-heart';
            likeIcon.style.color = '#ef4444';
            likeBtn.classList.add('active');
        } else {
            likeIcon.className = 'fa-regular fa-heart';
            likeIcon.style.color = '';
            likeBtn.classList.remove('active');
        }
    } catch (err) {
        alert(err.message);
    }
}

// Submit Comment API Call
async function submitComment(postId) {
    if (!currentUser) {
        alert("Please log in to comment!");
        authModal.classList.add('open');
        return;
    }
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    const token = localStorage.getItem('nexsocial_token');
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        const newComment = await res.json();
        if (!res.ok) throw new Error(newComment.message || "Failed to submit comment");

        // Append to DOM comments list
        const commentsSec = document.getElementById(`comments-${postId}`);
        const list = commentsSec.querySelector('.comments-list');
        const emptyMsg = list.querySelector('.no-comments-msg');
        if (emptyMsg) emptyMsg.remove();

        const commentHTML = `
            <div class="comment-item" style="display:flex; gap:10px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:8px;">
                <div style="width:30px; height:30px; border-radius:50%; overflow:hidden;">
                    <img src="${newComment.user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${newComment.user.username}`}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span style="font-weight:600; font-size:0.85rem;">${newComment.user.username}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">@${newComment.user.username}</span>
                    </div>
                    <p style="font-size:0.85rem; margin-top:2px; color:var(--text-main);">${newComment.content}</p>
                </div>
            </div>
        `;
        list.innerHTML += commentHTML;
        input.value = '';
        
        // Update comments trigger badge
        const triggerBadge = document.getElementById(`post-${postId}`).querySelector('.comment-trigger-btn span');
        triggerBadge.innerText = parseInt(triggerBadge.innerText) + 1;
    } catch (err) {
        alert(err.message);
    }
}

// Create new timeline post
async function handleCreatePost() {
    if (!currentUser) {
        alert("Please log in to share posts!");
        authModal.classList.add('open');
        return;
    }

    const content = postInput.value.trim();
    if (!content) return;

    const token = localStorage.getItem('nexsocial_token');
    try {
        submitPostBtn.disabled = true;
        submitPostBtn.innerText = 'Posting...';

        // Optional logic for random premium image backgrounds
        let imageUrl = "";
        if (content.toLowerCase().includes('design') || content.toLowerCase().includes('ui') || content.toLowerCase().includes('aesthetics')) {
            imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
        } else if (content.toLowerCase().includes('code') || content.toLowerCase().includes('react') || content.toLowerCase().includes('bug') || content.toLowerCase().includes('dev')) {
            imageUrl = "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=80";
        }

        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, imageUrl })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create post");

        postInput.value = '';
        fetchPosts(); // Refresh timeline
        renderUserBriefWidget(); // Refresh posts count in left widget
    } catch (err) {
        alert(err.message);
    } finally {
        submitPostBtn.disabled = false;
        submitPostBtn.innerText = 'Post';
    }
}

// Fetch who to follow mock list of suggestions
function loadWhoToFollow() {
    // Generate some recommended developers to follow
    const devs = ['alex_cyber', 'lisa_tech', 'marcus_dev', 'sarah_ai'];
    whoToFollowList.innerHTML = devs.map(username => `
        <div class="follow-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:8px;">
            <div style="display:flex; gap:10px; align-items:center;">
                <div style="width:35px; height:35px; border-radius:50%; overflow:hidden;">
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${username}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div>
                    <h5 style="font-weight:600; font-size:0.85rem;">${username}</h5>
                    <p style="font-size:0.75rem; color:var(--text-muted);">@${username}</p>
                </div>
            </div>
            <button class="btn btn-outline btn-small" style="font-size:0.75rem; padding: 4px 10px; border-radius:15px;" onclick="alert('Try logging in and switching backends to start following real database relationships!')">Follow</button>
        </div>
    `).join('');
}

// Fetch Profile and Profile Posts
async function fetchUserProfile(userId) {
    try {
        const res = await fetch(`${API_URL}/users/${userId}/profile`);
        if (!res.ok) throw new Error("Failed to load user profile");
        const data = await res.json();

        const prof = data.profile;
        profilePageName.innerText = prof.username;
        profilePageHandle.innerText = `@${prof.username}`;
        profilePageBio.innerText = prof.bio || "No biography provided yet.";
        profilePageAvatar.innerHTML = `<img src="${prof.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${prof.username}`}" style="width:100%; height:100%; object-fit:cover;">`;
        
        statPosts.innerText = data.posts.length;
        statFollowers.innerText = prof.followersCount;
        statFollowing.innerText = prof.followingCount;

        // Render edit profile or follow toggle
        if (currentUser && (currentUser.id || currentUser._id) == userId) {
            followToggleBtn.innerText = "Edit Profile";
            followToggleBtn.className = "btn btn-outline";
            followToggleBtn.onclick = () => handleEditBioPrompt();
        } else {
            const isFollowing = currentUser && prof.following && prof.following.map(id => id.toString()).includes((currentUser.id || currentUser._id).toString());
            followToggleBtn.innerText = isFollowing ? "Unfollow" : "Follow";
            followToggleBtn.className = isFollowing ? "btn btn-outline" : "btn btn-primary";
            followToggleBtn.onclick = () => handleFollowToggle(userId);
        }

        // Render profile posts
        if (data.posts.length === 0) {
            profilePostsList.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-muted);">No posts from this user yet.</p>`;
        } else {
            profilePostsList.innerHTML = data.posts.map(post => renderSinglePostHTML(post)).join('');
        }

    } catch (err) {
        alert(err.message);
        switchView('feed');
    }
}

// Prompt for editing biography
async function handleEditBioPrompt() {
    const currentBio = profilePageBio.innerText;
    const newBio = prompt("Update your biography:", currentBio);
    if (newBio === null) return;

    const token = localStorage.getItem('nexsocial_token');
    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bio: newBio })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update profile");

        profilePageBio.innerText = data.bio;
        renderUserBriefWidget(); // Refresh widget sidebar
    } catch (err) {
        alert(err.message);
    }
}

// Follow toggle API
async function handleFollowToggle(userId) {
    if (!currentUser) {
        alert("Please log in to follow users!");
        authModal.classList.add('open');
        return;
    }

    const token = localStorage.getItem('nexsocial_token');
    try {
        const res = await fetch(`${API_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update follow relationship");

        // Refresh profile page metrics
        fetchUserProfile(userId);
        renderUserBriefWidget();
    } catch (err) {
        alert(err.message);
    }
}

// Handle User Authentication Form Actions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        currentUser = data.user;
        localStorage.setItem('nexsocial_user', JSON.stringify(currentUser));
        localStorage.setItem('nexsocial_token', data.token);
        
        checkUserSession();
        authModal.classList.remove('open');
        loginForm.reset();
        alert(`Welcome back, ${currentUser.username}!`);
        switchView('feed');
    } catch (err) {
        alert("Login failed: " + err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        currentUser = data.user;
        localStorage.setItem('nexsocial_user', JSON.stringify(currentUser));
        localStorage.setItem('nexsocial_token', data.token);

        checkUserSession();
        authModal.classList.remove('open');
        registerForm.reset();
        alert(`Account successfully created. Welcome, ${currentUser.username}!`);
        switchView('feed');
    } catch (err) {
        alert("Registration failed: " + err.message);
    }
}
