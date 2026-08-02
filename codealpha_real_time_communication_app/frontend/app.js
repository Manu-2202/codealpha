// App State & API Configuration
let backendChoice = localStorage.getItem('nexcall_backend_choice') || 'express';
let API_URL = backendChoice === 'django' ? 'http://localhost:8003/api' : 'http://localhost:5003/api';
let SOCKET_URL = backendChoice === 'django' ? 'http://localhost:8003' : 'http://localhost:5003';

let socket = null;
let localStream = null;
let currentUser = JSON.parse(localStorage.getItem('nexcall_user')) || null;
let currentRoomId = null;

// Lobby Elements
const lobbyView = document.getElementById('lobby-view');
const joinRoomForm = document.getElementById('join-room-form');
const roomIdInput = document.getElementById('room-id-input');
const usernameInput = document.getElementById('username-input');
const lobbyPreviewVideo = document.getElementById('lobby-preview-video');
const videoPlaceholder = document.getElementById('video-placeholder');
const lobbyToggleVideo = document.getElementById('lobby-toggle-video');
const lobbyToggleAudio = document.getElementById('lobby-toggle-audio');

// Room Elements
const roomView = document.getElementById('room-view');
const roomIdBadge = document.getElementById('room-id-badge');
const localVideo = document.getElementById('local-video');
const chatMessages = document.getElementById('chat-messages');
const chatMsgInput = document.getElementById('chat-msg-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const roomToggleAudio = document.getElementById('room-toggle-audio');
const roomToggleVideo = document.getElementById('room-toggle-video');
const leaveRoomBtn = document.getElementById('leave-room');

// Whiteboard Elements
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const brushColorInput = document.getElementById('brush-color');
const brushSizeSelect = document.getElementById('brush-size');
const toolBrushBtn = document.getElementById('tool-brush');
const toolEraserBtn = document.getElementById('tool-eraser');
const clearBoardBtn = document.getElementById('clear-board');

// Header Elements
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const userGreeting = document.getElementById('user-greeting');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const backendSelect = document.getElementById('backend-api-select');

// Local media flags
let isVideoOn = false;
let isAudioOn = false;
let isDrawing = false;
let currentTool = 'brush'; // 'brush' | 'eraser'
let lastX = 0;
let lastY = 0;

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    backendSelect.value = backendChoice;
    checkUserSession();
    setupEventListeners();
    setupCanvas();
});

function setupEventListeners() {
    // Backend Select
    backendSelect.addEventListener('change', (e) => {
        localStorage.setItem('nexcall_backend_choice', e.target.value);
        window.location.reload();
    });

    // Auth Button Action
    authBtn.addEventListener('click', () => {
        if (currentUser) {
            currentUser = null;
            localStorage.removeItem('nexcall_user');
            localStorage.removeItem('nexcall_token');
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

    // Auth Forms Submission
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Modals Close Event
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('open');
        });
    });

    // Lobby Mute Toggles
    lobbyToggleVideo.addEventListener('click', toggleLobbyVideo);
    lobbyToggleAudio.addEventListener('click', toggleLobbyAudio);

    // Join Room
    joinRoomForm.addEventListener('submit', handleJoinRoom);

    // Room Call Controls
    roomToggleVideo.addEventListener('click', toggleRoomVideo);
    roomToggleAudio.addEventListener('click', toggleRoomAudio);
    leaveRoomBtn.addEventListener('click', handleLeaveRoom);

    // Send Chat
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatMsgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Whiteboard Toolbar Toggles
    toolBrushBtn.addEventListener('click', () => {
        currentTool = 'brush';
        toolBrushBtn.classList.add('active');
        toolEraserBtn.classList.remove('active');
    });

    toolEraserBtn.addEventListener('click', () => {
        currentTool = 'eraser';
        toolEraserBtn.classList.add('active');
        toolBrushBtn.classList.remove('active');
    });

    clearBoardBtn.addEventListener('click', () => {
        clearCanvas();
        if (socket && socket.connected) {
            socket.emit('whiteboard-clear', { roomId: currentRoomId });
        }
    });

    // Window Resize for Canvas
    window.addEventListener('resize', resizeCanvas);
}

function checkUserSession() {
    currentUser = JSON.parse(localStorage.getItem('nexcall_user'));
    if (currentUser) {
        userGreeting.innerText = `Hi, ${currentUser.username}`;
        authBtn.querySelector('span').innerText = 'Logout';
        usernameInput.value = currentUser.username;
    } else {
        userGreeting.innerText = '';
        authBtn.querySelector('span').innerText = 'Login';
        usernameInput.value = 'Guest User';
    }
}

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

// Camera Preview Toggle on Lobby
async function toggleLobbyVideo() {
    if (isVideoOn) {
        stopLobbyCamera();
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioOn });
            localStream = stream;
            lobbyPreviewVideo.srcObject = stream;
            lobbyPreviewVideo.style.display = 'block';
            videoPlaceholder.style.display = 'none';
            lobbyToggleVideo.innerHTML = '<i class="fa-solid fa-video"></i>';
            lobbyToggleVideo.classList.remove('btn-outline');
            lobbyToggleVideo.classList.add('btn-primary');
            isVideoOn = true;
        } catch (err) {
            alert("Could not access camera: " + err.message);
        }
    }
}

function stopLobbyCamera() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    lobbyPreviewVideo.srcObject = null;
    lobbyPreviewVideo.style.display = 'none';
    videoPlaceholder.style.display = 'flex';
    lobbyToggleVideo.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
    lobbyToggleVideo.classList.add('btn-outline');
    lobbyToggleVideo.classList.remove('btn-primary');
    isVideoOn = false;
}

function toggleLobbyAudio() {
    if (isAudioOn) {
        lobbyToggleAudio.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
        lobbyToggleAudio.classList.add('btn-outline');
        lobbyToggleAudio.classList.remove('btn-primary');
        isAudioOn = false;
    } else {
        lobbyToggleAudio.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        lobbyToggleAudio.classList.remove('btn-outline');
        lobbyToggleAudio.classList.add('btn-primary');
        isAudioOn = true;
    }
}

// Join Room Call Action
async function handleJoinRoom(e) {
    e.preventDefault();
    const roomId = roomIdInput.value.trim();
    const name = usernameInput.value.trim();

    if (!roomId || !name) return;

    currentRoomId = roomId;
    roomIdBadge.innerText = roomId;

    // Connect to camera/audio inside room
    try {
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({ video: isVideoOn, audio: isAudioOn });
        }
        localVideo.srcObject = localStream;
        
        // Setup room controls state matches
        updateRoomControlsUI();
    } catch (err) {
        console.warn("Media devices setup fallback: ", err);
    }

    // Switch Views
    lobbyView.style.display = 'none';
    roomView.style.display = 'grid';
    
    // Connect Socket.io signaling
    connectSignaling(roomId, name);
    
    // Resize whiteboard canvas
    setTimeout(resizeCanvas, 300);
}

function updateRoomControlsUI() {
    if (isVideoOn) {
        roomToggleVideo.innerHTML = '<i class="fa-solid fa-video"></i>';
        roomToggleVideo.className = "btn btn-outline";
    } else {
        roomToggleVideo.innerHTML = '<i class="fa-solid fa-video-slash" style="color: #ef4444;"></i>';
        roomToggleVideo.className = "btn btn-outline active";
    }

    if (isAudioOn) {
        roomToggleAudio.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        roomToggleAudio.className = "btn btn-outline";
    } else {
        roomToggleAudio.innerHTML = '<i class="fa-solid fa-microphone-slash" style="color: #ef4444;"></i>';
        roomToggleAudio.className = "btn btn-outline active";
    }
}

// Socket Connection Signaling
function connectSignaling(roomId, name) {
    if (backendChoice === 'django') {
        appendChatMessage("System", "Django API serving room session (Simulating signaling fallback).");
        return;
    }

    try {
        socket = io(SOCKET_URL);
        
        socket.on('connect', () => {
            appendChatMessage("System", `Connected to Express signaling server.`);
            socket.emit('join-room', { roomId, username: name });
        });

        socket.on('user-joined', ({ username }) => {
            appendChatMessage("System", `${username} joined the whiteboard collaboration room.`);
        });

        socket.on('chat-msg-received', ({ senderName, text, time }) => {
            appendChatMessage(senderName, text, time);
        });

        socket.on('whiteboard-draw', (drawData) => {
            drawFromSignal(drawData);
        });

        socket.on('whiteboard-clear', () => {
            clearCanvasLocal();
        });

        socket.on('user-left', ({ username }) => {
            appendChatMessage("System", `A participant has left the meeting room.`);
        });

        socket.on('connect_error', () => {
            appendChatMessage("System", "Could not connect to signaling socket. Running in offline canvas sandbox mode.");
        });

    } catch (err) {
        console.error(err);
        appendChatMessage("System", "Websocket signaling failed. Running locally.");
    }
}

// Room Controls: Video Toggle
function toggleRoomVideo() {
    if (localStream && localStream.getVideoTracks().length > 0) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        isVideoOn = videoTrack.enabled;
        updateRoomControlsUI();
    }
}

// Room Controls: Audio Toggle
function toggleRoomAudio() {
    if (localStream && localStream.getAudioTracks().length > 0) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        isAudioOn = audioTrack.enabled;
        updateRoomControlsUI();
    }
}

// Leave Room call view
function handleLeaveRoom() {
    stopLobbyCamera();
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    chatMessages.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 1rem 0;">No messages yet.</div>';
    clearCanvasLocal();

    roomView.style.display = 'none';
    lobbyView.style.display = 'grid';
    currentRoomId = null;
}

// Send chat message
function sendChatMessage() {
    const text = chatMsgInput.value.trim();
    if (!text) return;

    const senderName = currentUser ? currentUser.username : usernameInput.value;

    if (socket && socket.connected) {
        socket.emit('send-chat-msg', { roomId: currentRoomId, senderName, text });
    } else {
        // Fallback local echo
        appendChatMessage(senderName, text);
    }
    chatMsgInput.value = '';
}

// Append bubble to chat log container
function appendChatMessage(sender, text, time = null) {
    const msgTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const noMsg = chatMessages.querySelector('.no-messages');
    if (chatMessages.innerText.includes('No messages yet')) {
        chatMessages.innerHTML = '';
    }

    const bubble = document.createElement('div');
    bubble.style.padding = '8px 12px';
    bubble.style.borderRadius = '12px';
    bubble.style.background = sender === 'System' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)';
    bubble.style.borderLeft = sender === 'System' ? '2px solid #a855f7' : '2px solid #6366f1';
    
    bubble.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:0.8rem; color:white;">${sender}</strong>
            <span style="font-size:0.7rem; color:var(--text-muted);">${msgTime}</span>
        </div>
        <p style="font-size:0.82rem; color:var(--text-main); margin:0;">${text}</p>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Collaborative HTML5 Whiteboard Logic
function setupCanvas() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile/tablet screen drawing
    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
        const mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
    });
}

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // Set default drawing background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const brushColor = currentTool === 'eraser' ? '#ffffff' : brushColorInput.value;
    const brushWidth = brushSizeSelect.value;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Send drawing coordinates to signaling server
    if (socket && socket.connected) {
        socket.emit('whiteboard-draw', {
            roomId: currentRoomId,
            drawData: { lastX, lastY, x, y, brushColor, brushWidth }
        });
    }

    lastX = x;
    lastY = y;
}

function drawFromSignal(data) {
    ctx.beginPath();
    ctx.moveTo(data.lastX, data.lastY);
    ctx.lineTo(data.x, data.y);
    ctx.strokeStyle = data.brushColor;
    ctx.lineWidth = data.brushWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function clearCanvas() {
    clearCanvasLocal();
}

function clearCanvasLocal() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// User Authentications Login/Registration
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
        localStorage.setItem('nexcall_user', JSON.stringify(currentUser));
        localStorage.setItem('nexcall_token', data.token);

        checkUserSession();
        authModal.classList.remove('open');
        loginForm.reset();
        alert(`Welcome, ${currentUser.username}!`);
        window.location.reload();
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
        localStorage.setItem('nexcall_user', JSON.stringify(currentUser));
        localStorage.setItem('nexcall_token', data.token);

        checkUserSession();
        authModal.classList.remove('open');
        registerForm.reset();
        alert(`Account created successfully. Welcome, ${currentUser.username}!`);
        window.location.reload();
    } catch (err) {
        alert("Registration failed: " + err.message);
    }
}
