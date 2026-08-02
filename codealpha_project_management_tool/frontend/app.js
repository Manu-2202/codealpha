// App State & API Configuration
let backendChoice = localStorage.getItem('nexflow_backend_choice') || 'express';
let API_URL = backendChoice === 'django' ? 'http://localhost:8002/api' : 'http://localhost:5002/api';

let boards = [];
let tasks = [];
let activeBoardId = null;
let currentUser = JSON.parse(localStorage.getItem('nexflow_user')) || null;

// DOM Elements
const boardSelect = document.getElementById('board-select');
const newBoardBtn = document.getElementById('new-board-btn');
const newBoardModal = document.getElementById('board-modal');
const boardForm = document.getElementById('board-form');

const newTaskBtn = document.getElementById('new-task-btn');
const newTaskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

const detailsModal = document.getElementById('details-modal');
const detailsBody = document.getElementById('details-body');

const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const userGreeting = document.getElementById('user-greeting');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const backendSelect = document.getElementById('backend-api-select');

// Columns Containers
const containers = {
    'To Do': document.getElementById('container-todo'),
    'In Progress': document.getElementById('container-progress'),
    'Review': document.getElementById('container-review'),
    'Done': document.getElementById('container-done')
};

const badges = {
    'To Do': document.getElementById('badge-todo'),
    'In Progress': document.getElementById('badge-progress'),
    'Review': document.getElementById('badge-review'),
    'Done': document.getElementById('badge-done')
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    backendSelect.value = backendChoice;
    checkUserSession();
    if (currentUser) {
        fetchBoards();
    } else {
        renderMockOfflineView();
    }
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Backend Select
    backendSelect.addEventListener('change', (e) => {
        localStorage.setItem('nexflow_backend_choice', e.target.value);
        window.location.reload();
    });

    // Board Switch
    boardSelect.addEventListener('change', (e) => {
        activeBoardId = e.target.value;
        fetchTasks();
    });

    // Modals Open
    newBoardBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("Please log in first!");
            authModal.classList.add('open');
            return;
        }
        newBoardModal.classList.add('open');
    });

    newTaskBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("Please log in first!");
            authModal.classList.add('open');
            return;
        }
        if (!activeBoardId) {
            alert("Please create or select a board first!");
            return;
        }
        newTaskModal.classList.add('open');
    });

    // Modals Close Event
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('open');
        });
    });

    // Auth Button
    authBtn.addEventListener('click', () => {
        if (currentUser) {
            currentUser = null;
            localStorage.removeItem('nexflow_user');
            localStorage.removeItem('nexflow_token');
            checkUserSession();
            alert("Logged out successfully.");
            window.location.reload();
        } else {
            authModal.classList.add('open');
        }
    });

    // Auth Tabs Toggle
    tabLogin.addEventListener('click', () => toggleAuthTabs('login'));
    tabRegister.addEventListener('click', () => toggleAuthTabs('register'));

    // Form Submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    boardForm.addEventListener('submit', handleCreateBoard);
    taskForm.addEventListener('submit', handleCreateTask);

    // Setup Drag & Drop Event Listeners on Column Containers
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.getAttribute('data-status');
            
            if (taskId && newStatus) {
                await updateTaskStatus(taskId, newStatus);
            }
        });
    });
}

// Check User Session
function checkUserSession() {
    currentUser = JSON.parse(localStorage.getItem('nexflow_user'));
    if (currentUser) {
        userGreeting.innerText = `Hi, ${currentUser.username}`;
        authBtn.querySelector('span').innerText = 'Logout';
    } else {
        userGreeting.innerText = '';
        authBtn.querySelector('span').innerText = 'Login';
    }
}

// Toggle Auth Tabs
function toggleAuthTabs(tab) {
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Fetch Boards
async function fetchBoards() {
    const token = localStorage.getItem('nexflow_token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/projects/boards`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch boards");
        boards = await res.json();
        
        if (boards.length > 0) {
            boardSelect.innerHTML = boards.map(b => `<option value="${b.id || b._id}">${b.title}</option>`).join('');
            activeBoardId = boards[0].id || boards[0]._id;
            fetchTasks();
        } else {
            boardSelect.innerHTML = `<option value="" disabled selected>No boards. Create one!</option>`;
        }
    } catch (err) {
        console.error(err);
        renderMockOfflineView();
    }
}

// Fetch Tasks
async function fetchTasks() {
    if (!activeBoardId) return;
    const token = localStorage.getItem('nexflow_token');
    
    try {
        const res = await fetch(`${API_URL}/projects/boards/${activeBoardId}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch tasks");
        tasks = await res.json();
        renderKanban();
    } catch (err) {
        console.error(err);
    }
}

// Render Kanban columns
function renderKanban() {
    // Reset columns
    Object.keys(containers).forEach(status => {
        containers[status].innerHTML = '';
        badges[status].innerText = '0';
    });

    const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Done': 0 };

    tasks.forEach(task => {
        const status = task.status;
        if (containers[status]) {
            statusCounts[status]++;
            const taskId = task.id || task._id;
            const priorityClass = `priority-badge priority-${task.priority.toLowerCase()}`;
            
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.setAttribute('data-id', taskId);
            
            // Drag and drop events
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', taskId);
                card.style.opacity = '0.5';
            });
            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });

            card.innerHTML = `
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="${priorityClass}" style="font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:10px; color:white; background:${getPriorityColor(task.priority)};">${task.priority}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);"><i class="fa-regular fa-calendar"></i> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <h4 style="font-weight:600; margin-bottom:0.4rem; cursor:pointer;" onclick="openTaskDetails(${taskId})">${task.title}</h4>
                <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:0.8rem;">${task.description || 'No description provided.'}</p>
                <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:0.6rem;">
                    <span style="font-size:0.78rem; color:var(--text-muted);"><i class="fa-regular fa-comment"></i> ${task.comments ? task.comments.length : 0}</span>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span style="font-size:0.8rem; font-weight:500;">${task.assignee}</span>
                    </div>
                </div>
            `;
            containers[status].appendChild(card);
        }
    });

    // Update badges
    Object.keys(statusCounts).forEach(status => {
        badges[status].innerText = statusCounts[status];
    });
}

function getPriorityColor(p) {
    if (p === 'High') return '#f87171';
    if (p === 'Medium') return '#fb923c';
    return '#94a3b8';
}

// Drag Update Task Status API Call
async function updateTaskStatus(taskId, newStatus) {
    const token = localStorage.getItem('nexflow_token');
    try {
        const res = await fetch(`${API_URL}/projects/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error("Failed to update status");
        
        // Update local tasks
        const updatedTask = await res.json();
        tasks = tasks.map(t => (t.id || t._id) == taskId ? updatedTask : t);
        renderKanban();
    } catch (err) {
        alert("Error updating task status: " + err.message);
    }
}

// Open Task Details Modal
async function openTaskDetails(taskId) {
    const task = tasks.find(t => (t.id || t._id) == taskId);
    if (!task) return;

    renderTaskDetailsHTML(task);
    detailsModal.classList.add('open');
}

function renderTaskDetailsHTML(task) {
    const taskId = task.id || task._id;
    const commentsListHTML = task.comments && task.comments.length > 0 ? task.comments.map(c => `
        <div style="display:flex; gap:10px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:8px;">
            <div style="width:30px; height:30px; border-radius:50%; background:${c.avatarColor || '#6366f1'}; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.8rem; color:white;">
                ${c.username.charAt(0).toUpperCase()}
            </div>
            <div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <span style="font-weight:600; font-size:0.85rem;">${c.username}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}</span>
                </div>
                <p style="font-size:0.85rem; margin-top:2px; color:var(--text-main);">${c.text}</p>
            </div>
        </div>
    `).join('') : '<p class="no-comments" style="color:var(--text-muted); font-size:0.85rem;">No comments yet.</p>';

    detailsBody.innerHTML = `
        <span class="priority-badge" style="background:${getPriorityColor(task.priority)}; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:700; display:inline-block; margin-bottom:0.8rem;">${task.priority} Priority</span>
        <h2 style="font-weight:700; margin-bottom:1rem; line-height:1.2;">${task.title}</h2>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px; border:1px solid var(--border-color);">
            <div>
                <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:0.2rem;">Assignee</span>
                <strong style="font-size:0.95rem;">${task.assignee}</strong>
            </div>
            <div>
                <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:0.2rem;">Due Date</span>
                <strong style="font-size:0.95rem;"><i class="fa-regular fa-calendar"></i> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}</strong>
            </div>
        </div>

        <div style="margin-bottom:1.5rem;">
            <h4 style="font-weight:600; margin-bottom:0.4rem; font-size:0.95rem; color:var(--text-muted);">Description</h4>
            <p style="font-size:0.95rem; line-height:1.5; color:var(--text-main);">${task.description || 'No description provided.'}</p>
        </div>

        <!-- Comments -->
        <div style="border-top:1px solid var(--border-color); padding-top:1.5rem;">
            <h4 style="font-weight:600; margin-bottom:1rem; font-size:1rem;"><i class="fa-regular fa-comments"></i> Discussion</h4>
            <div id="modal-comments-list" style="max-height:200px; overflow-y:auto; margin-bottom:1rem; padding-right:5px;">
                ${commentsListHTML}
            </div>
            
            <div style="display:flex; gap:10px;">
                <input type="text" id="modal-comment-input" placeholder="Type a message..." style="flex:1; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); padding:8px 12px; border-radius:20px; color:white; outline:none; font-size:0.85rem;">
                <button class="btn btn-primary btn-small" onclick="submitTaskComment(${taskId})" style="border-radius:20px; padding:0 15px;">Send</button>
            </div>
        </div>
    `;
}

// Submit Comment
async function submitTaskComment(taskId) {
    const input = document.getElementById('modal-comment-input');
    const text = input.value.trim();
    if (!text) return;

    const token = localStorage.getItem('nexflow_token');
    try {
        const res = await fetch(`${API_URL}/projects/tasks/${taskId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });
        const comments = await res.json();
        if (!res.ok) throw new Error(comments.message || "Failed to submit comment");

        // Update local tasks state
        tasks = tasks.map(t => {
            if ((t.id || t._id) == taskId) {
                t.comments = comments;
            }
            return t;
        });

        // Re-render comments list in modal
        renderTaskDetailsHTML(tasks.find(t => (t.id || t._id) == taskId));
        renderKanban(); // Re-render card badges
    } catch (err) {
        alert(err.message);
    }
}

// Handle Create Board
async function handleCreateBoard(e) {
    e.preventDefault();
    const title = document.getElementById('board-title-input').value;
    const description = document.getElementById('board-desc-input').value;

    const token = localStorage.getItem('nexflow_token');
    try {
        const res = await fetch(`${API_URL}/projects/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create board");

        newBoardModal.classList.remove('open');
        boardForm.reset();
        alert("Project board created successfully!");
        fetchBoards();
    } catch (err) {
        alert(err.message);
    }
}

// Handle Create Task Card
async function handleCreateTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value;
    const description = document.getElementById('task-desc-input').value;
    const priority = document.getElementById('task-priority-input').value;
    const assignee = document.getElementById('task-assignee-input').value;
    const dueDate = document.getElementById('task-date-input').value;

    const token = localStorage.getItem('nexflow_token');
    try {
        const res = await fetch(`${API_URL}/projects/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                boardId: activeBoardId,
                title,
                description,
                priority,
                assignee,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create task card");

        newTaskModal.classList.remove('open');
        taskForm.reset();
        fetchTasks();
    } catch (err) {
        alert(err.message);
    }
}

// Auth Login
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
        localStorage.setItem('nexflow_user', JSON.stringify(currentUser));
        localStorage.setItem('nexflow_token', data.token);

        checkUserSession();
        authModal.classList.remove('open');
        loginForm.reset();
        alert(`Logged in. Welcome back, ${currentUser.username}!`);
        fetchBoards();
    } catch (err) {
        alert("Login failed: " + err.message);
    }
}

// Auth Register
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
        localStorage.setItem('nexflow_user', JSON.stringify(currentUser));
        localStorage.setItem('nexflow_token', data.token);

        checkUserSession();
        authModal.classList.remove('open');
        registerForm.reset();
        alert(`Account created successfully. Welcome, ${currentUser.username}!`);
        fetchBoards();
    } catch (err) {
        alert("Registration failed: " + err.message);
    }
}

// Render Offline/Unauthenticated fallbacks
function renderMockOfflineView() {
    boardSelect.innerHTML = `<option value="">Sign in to load project boards</option>`;
    Object.keys(containers).forEach(status => {
        containers[status].innerHTML = `
            <div style="text-align:center; padding: 2rem 0; color:var(--text-muted); font-size:0.8rem;">
                <i class="fa-solid fa-lock" style="font-size:1.2rem; margin-bottom:0.5rem; display:block;"></i>
                Login to load task cards
            </div>
        `;
    });
}
