import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:5003/api';
const SOCKET_URL = 'http://localhost:5003';

const mockMeetings = [
    { _id: "m1", room: "lobby-sprint", duration: "45 mins", date: "Today, 10:30 AM", users: ["Guest", "Alice (Lead)", "Bob (UI)"] },
    { _id: "m2", room: "webrtc-test", duration: "18 mins", date: "Yesterday, 4:15 PM", users: ["Guest", "Carol (DevOps)"] }
];

export default function App() {
    // Session state
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('nexcall_user')) || null);
    const [roomId, setRoomId] = useState('lobby-sprint');
    const [username, setUsername] = useState(user ? user.username : 'Guest User');
    const [inRoom, setInRoom] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    // Call controls
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [localStream, setLocalStream] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState([
        { id: "alice", name: "Alice (Lead Developer)", isVideoOn: true, avatarColor: "#6366f1" },
        { id: "bob", name: "Bob (UI Designer)", isVideoOn: false, avatarColor: "#a855f7" }
    ]);

    // Canvas whiteboard state
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#6366f1');
    const [brushWidth, setBrushWidth] = useState(5);
    const [drawingTool, setDrawingTool] = useState('brush'); // 'brush' | 'eraser'

    // Chat Box state
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState('');

    // Lobby sub-tabs
    const [activeLobbyTab, setActiveLobbyTab] = useState('join'); // 'join' | 'settings' | 'history' | 'help'
    const [previewStream, setPreviewStream] = useState(null);
    const [micVolume, setMicVolume] = useState(0);
    const [meetingsLog, setMeetingsLog] = useState(mockMeetings);

    // Refs
    const localVideoRef = useRef(null);
    const previewVideoRef = useRef(null);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const localStreamRef = useRef(null);

    // Auth modal state
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authTab, setAuthTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Auto Login Guest to keep database online
    useEffect(() => {
        const autoLoginGuest = async () => {
            if (user) return;
            try {
                let res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'guest_user@gmail.com', password: 'guest123' })
                });
                let data = await res.json();
                if (res.ok) {
                    setUser(data);
                    localStorage.setItem('nexcall_user', JSON.stringify(data));
                    setUsername(data.username);
                    return;
                }

                res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'Guest Streamer', email: 'guest_user@gmail.com', password: 'guest123' })
                });
                data = await res.json();
                if (res.ok) {
                    setUser(data);
                    localStorage.setItem('nexcall_user', JSON.stringify(data));
                    setUsername(data.username);
                }
            } catch (err) {
                console.error("Auto login failed", err);
            }
        };
        autoLoginGuest();
    }, [user]);

    // Check backend connection
    useEffect(() => {
        const pingBackend = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/ping`);
                if (!res.ok) throw new Error();
                setIsOffline(false);
            } catch (err) {
                setIsOffline(true);
            }
        };
        pingBackend();
    }, []);

    // Setup Local Camera stream when in call
    useEffect(() => {
        if (inRoom && isVideoOn) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioOn })
                .then(stream => {
                    localStreamRef.current = stream;
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Camera access blocked: ", err);
                });
        } else {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        }
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [inRoom, isVideoOn]);

    // Live preview camera stream in Lobby settings tab
    useEffect(() => {
        let intervalId;
        if (!inRoom && activeLobbyTab === 'settings') {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    setPreviewStream(stream);
                    if (previewVideoRef.current) {
                        previewVideoRef.current.srcObject = stream;
                    }
                    // Simulate mic level meter fluctuation
                    intervalId = setInterval(() => {
                        setMicVolume(Math.floor(Math.random() * 80) + 10);
                    }, 200);
                })
                .catch(err => console.error("Preview blocked:", err));
        } else {
            if (previewStream) {
                previewStream.getTracks().forEach(t => t.stop());
                setPreviewStream(null);
            }
            clearInterval(intervalId);
            setMicVolume(0);
        }
        return () => {
            if (previewStream) previewStream.getTracks().forEach(t => t.stop());
            clearInterval(intervalId);
        };
    }, [activeLobbyTab, inRoom]);

    // Setup Canvas on room join
    useEffect(() => {
        if (inRoom && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.parentElement.offsetWidth * 2;
            canvas.height = canvas.parentElement.offsetHeight * 2;
            canvas.style.width = `${canvas.parentElement.offsetWidth}px`;
            canvas.style.height = `${canvas.parentElement.offsetHeight}px`;

            const context = canvas.getContext("2d");
            context.scale(2, 2);
            context.lineCap = "round";
            contextRef.current = context;

            context.fillStyle = "#12121a";
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [inRoom]);

    // Drawing Canvas Listeners
    const startDrawing = ({ nativeEvent }) => {
        if (!contextRef.current) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !contextRef.current) return;
        const { offsetX, offsetY } = nativeEvent;
        
        contextRef.current.strokeStyle = drawingTool === 'eraser' ? '#12121a' : brushColor;
        contextRef.current.lineWidth = drawingTool === 'eraser' ? 24 : brushWidth;
        
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        if (!contextRef.current) return;
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        if (!contextRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        contextRef.current.fillStyle = "#12121a";
        contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Chat Message Add
    const handleSendMsg = (e) => {
        e.preventDefault();
        if (!msgInput.trim()) return;

        const newMsg = {
            senderName: username || 'Guest User',
            text: msgInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMsg]);
        setMsgInput('');

        // Simulate remote replies in call chat after 1.5 seconds
        setTimeout(() => {
            const replies = [
                "I see your drawing on the whiteboard! Looks great.",
                "Let's move this scrum task forward today.",
                "Can you check if my mic audio is clear?",
                "Yes, let's proceed with this workflow."
            ];
            const botMsg = {
                senderName: "Alice (Lead)",
                text: replies[Math.floor(Math.random() * replies.length)],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMsg]);
        }, 1500);
    };

    // Join Room
    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!username.trim() || !roomId.trim()) return;
        setInRoom(true);
        setMessages([
            { senderName: 'System Bot', text: `Welcome to room "${roomId}"! Invite others using this Room ID.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);

        // Add to meetings list
        const newMeetingLog = {
            _id: 'm_' + Date.now(),
            room: roomId,
            duration: "In Progress",
            date: new Date().toLocaleString(),
            users: [username, "Alice (Lead)", "Bob (UI)"]
        };
        setMeetingsLog([newMeetingLog, ...meetingsLog]);
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
            localStorage.setItem('nexcall_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setUsername(data.username);
            setEmail('');
            setPassword('');
        } catch (err) {
            const name = email.split('@')[0];
            const dummyUser = { username: name, email, token: 'offline-token' };
            setUser(dummyUser);
            localStorage.setItem('nexcall_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setUsername(name);
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
            localStorage.setItem('nexcall_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setUsername(regUsername);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
        } catch (err) {
            const dummyUser = { username: regUsername, email: regEmail, token: 'offline-token' };
            setUser(dummyUser);
            localStorage.setItem('nexcall_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setUsername(regUsername);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            alert('Offline Mode: Registered successfully.');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('nexcall_user');
        setUsername('Guest User');
        alert('Logged out.');
    };

    // If active conference call is ongoing
    if (inRoom) {
        return (
            <div>
                {/* Header in Call */}
                <header className="header" style={{ position: 'relative', marginTop: 0 }}>
                    <div className="header-container">
                        <span className="logo"><span className="gradient-text">Nex</span>Call Room: {roomId}</span>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Joined as: <strong>{username}</strong></span>
                            <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => setInRoom(false)}>
                                Leave Call <i className="fa-solid fa-phone-slash"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="main-container" style={{ maxWidth: '1200px', marginTop: '20px', display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem' }}>
                    
                    {/* Left stream & canvas panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Video grids */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {/* Local Video Card */}
                            <div className="glass-card" style={{ padding: '8px', position: 'relative', background: '#0a0a0f', height: '180px' }}>
                                {isVideoOn ? (
                                    <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}></video>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="avatar" style={{ background: '#10b981', width: '50px', height: '50px' }}>G</div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Camera Muted</span>
                                    </div>
                                )}
                                <span style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                    {username} (You)
                                </span>
                            </div>

                            {/* Remote User Cards */}
                            {remoteUsers.map(u => (
                                <div className="glass-card" style={{ padding: '8px', position: 'relative', background: '#0a0a0f', height: '180px' }} key={u.id}>
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="avatar" style={{ background: u.avatarColor, width: '50px', height: '50px' }}>
                                            {u.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Streaming Active</span>
                                    </div>
                                    <span style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                        {u.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Whiteboard module */}
                        <div className="glass-card" style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}><i className="fa-solid fa-pen-ruler"></i> Shared Collaboration Whiteboard</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        className={`btn btn-sm ${drawingTool === 'brush' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setDrawingTool('brush')}
                                    >
                                        Brush
                                    </button>
                                    <button 
                                        className={`btn btn-sm ${drawingTool === 'eraser' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setDrawingTool('eraser')}
                                    >
                                        Eraser
                                    </button>
                                    <input 
                                        type="color" 
                                        value={brushColor} 
                                        onChange={(e) => setBrushColor(e.target.value)}
                                        disabled={drawingTool === 'eraser'}
                                        style={{ width: '30px', height: '30px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                    />
                                    <button className="btn btn-sm btn-outline" onClick={clearCanvas}>Clear</button>
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '320px', cursor: 'crosshair', background: '#12121a' }}>
                                <canvas 
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    style={{ display: 'block', width: '100%', height: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Call controls bottom toolbar */}
                        <div className="glass-card" style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <button className={`btn ${isVideoOn ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIsVideoOn(!isVideoOn)}>
                                <i className={`fa-solid ${isVideoOn ? 'fa-video' : 'fa-video-slash'}`}></i> {isVideoOn ? 'Mute Camera' : 'Start Camera'}
                            </button>
                            <button className={`btn ${isAudioOn ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIsAudioOn(!isAudioOn)}>
                                <i className={`fa-solid ${isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'}`}></i> {isAudioOn ? 'Mute Mic' : 'Start Mic'}
                            </button>
                        </div>
                    </div>

                    {/* Right Call chat box */}
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '580px', padding: 0 }}>
                        <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 700, textAlign: 'left' }}>
                            Meeting Chat Log
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                            {messages.map((msg, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                        <strong>{msg.senderName}</strong>
                                        <span>{msg.time}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.4' }}>{msg.text}</p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMsg} style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px' }}>
                            <input 
                                type="text" 
                                placeholder="Write message..." 
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.88rem', outline: 'none' }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Send</button>
                        </form>
                    </div>
                </main>
            </div>
        );
    }

    // LOBBY PANEL VIEW (If not in call)
    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="header-container">
                    <a href="#" className="logo" onClick={() => setActiveLobbyTab('join')}>
                        <span className="gradient-text">Nex</span>Call
                    </a>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {user ? (
                            <>
                                <span className="user-greeting">Hi, {user.username}</span>
                                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.85rem' }} onClick={() => { setAuthTab('login'); setIsAuthOpen(true); }}>
                                Account Login
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="main-container" style={{ marginTop: '85px', maxWidth: '960px' }}>
                <div className="lobby-overlay" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(18, 18, 26, 0.55)', border: '1px solid var(--border-color)', minHeight: '480px' }}>
                    
                    {/* Lobby Sidebar menu */}
                    <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.2rem', color: 'var(--text-muted)' }}>Conference Room</h3>
                        
                        <button 
                            className={`nav-link ${activeLobbyTab === 'join' ? 'active' : ''}`}
                            onClick={() => setActiveLobbyTab('join')}
                            style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', background: activeLobbyTab === 'join' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: activeLobbyTab === 'join' ? 'var(--primary-color)' : 'white', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className="fa-solid fa-video" style={{ marginRight: '8px' }}></i> Join Meeting
                        </button>

                        <button 
                            className={`nav-link ${activeLobbyTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveLobbyTab('settings')}
                            style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', background: activeLobbyTab === 'settings' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: activeLobbyTab === 'settings' ? 'var(--primary-color)' : 'white', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className="fa-solid fa-sliders" style={{ marginRight: '8px' }}></i> Setup & Devices
                        </button>

                        <button 
                            className={`nav-link ${activeLobbyTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveLobbyTab('history')}
                            style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', background: activeLobbyTab === 'history' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: activeLobbyTab === 'history' ? 'var(--primary-color)' : 'white', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px' }}></i> Call Logs History
                        </button>

                        <button 
                            className={`nav-link ${activeLobbyTab === 'help' ? 'active' : ''}`}
                            onClick={() => setActiveLobbyTab('help')}
                            style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', background: activeLobbyTab === 'help' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: activeLobbyTab === 'help' ? 'var(--primary-color)' : 'white', cursor: 'pointer', fontWeight: 600 }}
                        >
                            <i className="fa-solid fa-circle-question" style={{ marginRight: '8px' }}></i> Help & WebRTC Guide
                        </button>
                    </div>

                    {/* Lobby Tab Content */}
                    <div style={{ textAlign: 'left' }}>
                        {/* Tab 1: JOIN FORM */}
                        {activeLobbyTab === 'join' && (
                            <div style={{ maxWidth: '420px', margin: '0 auto', padding: '1.5rem 0' }}>
                                <span className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 800, display: 'block', marginBottom: '0.8rem', textAlign: 'center' }}>NexCall</span>
                                <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '1.8rem' }}>MERN Conferencing Workspace</h2>
                                
                                <form onSubmit={handleJoinRoom}>
                                    <div className="form-group">
                                        <label>Display Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Display name in call..." 
                                            value={username} 
                                            onChange={(e) => setUsername(e.target.value)} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Room Identifier ID</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="e.g. lobby-sprint" 
                                            value={roomId} 
                                            onChange={(e) => setRoomId(e.target.value)} 
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.8rem' }}>
                                        Join Meeting Room <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px' }}></i>
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Tab 2: SETUP & DEVICES */}
                        {activeLobbyTab === 'settings' && (
                            <div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Audio & Video Configuration</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem', fontSize: '0.9rem' }}>Preview your local webcam and mic levels before joining the meeting room.</p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                                    {/* Video Preview */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>Webcam Stream Test</h4>
                                        <div style={{ height: '220px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: '#0a0a0f' }}>
                                            <video ref={previewVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                                        </div>
                                    </div>

                                    {/* Audio Settings */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Microphone Activity</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <i className="fa-solid fa-microphone" style={{ color: 'var(--primary-color)' }}></i>
                                                <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${micVolume}%`, height: '100%', background: 'var(--primary-grad)', transition: 'width 0.1s ease' }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Whiteboard Preferences</h4>
                                            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Default Brush Shade</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {['#6366f1', '#a855f7', '#10b981', '#3b82f6', '#f59e0b'].map(c => (
                                                    <button 
                                                        key={c}
                                                        onClick={() => setBrushColor(c)}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            background: c,
                                                            border: brushColor === c ? '2px solid white' : 'none',
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: CALL HISTORY LOGS */}
                        {activeLobbyTab === 'history' && (
                            <div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Call History Log</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem', fontSize: '0.9rem' }}>Recent collaborative whiteboarding calls conducted on the server.</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {meetingsLog.map(m => (
                                        <div 
                                            key={m._id}
                                            style={{
                                                padding: '15px',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '4px' }}>Room: {m.room}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Teammates: {m.users.join(', ')}</span>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600 }}>{m.duration}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{m.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tab 4: HELP GUIDE */}
                        {activeLobbyTab === 'help' && (
                            <div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>WebRTC & Server Guide</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem', fontSize: '0.9rem' }}>Technical references on WebRTC peer connection pipelines and signaling servers.</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {[
                                        { q: "How does the canvas whiteboard stream sync?", a: "The canvas relays coordinates via Socket.io to the backend signaling server on port 5003, which broadcasts the path draw events to all other connected room sockets in real-time." },
                                        { q: "Why is my camera/mic not loading?", a: "Make sure you allow camera and microphone access prompts inside your web browser. If another application (like Zoom or Teams) is using your webcam, close it first." },
                                        { q: "Is WebRTC peer-to-peer or server-based?", a: "It utilizes P2P channels for direct video streaming. Socket.io on port 5003 is only utilized initially as a signaling server to negotiate network paths and SDP keys." }
                                    ].map((item, i) => (
                                        <div key={i} style={{ padding: '12px 15px', background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--primary-color)', borderRadius: '4px' }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>{item.q}</h4>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="footer" style={{ marginTop: '3rem' }}>
                <p>&copy; 2026 NexCall Conference Services. Powered by WebRTC & WebSockets.</p>
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
                                <label>Email</label>
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
                            <button type="submit" className="btn btn-primary btn-block">Register</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
