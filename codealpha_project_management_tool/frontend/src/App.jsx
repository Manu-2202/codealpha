import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5002/api';

const mockBoards = [
    { _id: "b1", title: "Sprint Development Board", description: "Core sprint tracking for NexFlow release." }
];

const mockTasks = [
    {
        _id: "t1",
        board: "b1",
        title: "Design glassmorphic UI layout",
        description: "Design high-fidelity dashboard layouts with vibrant glows and blur backdrops.",
        status: "Done",
        priority: "High",
        assignee: "Bob (UI Designer)",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        comments: [
            { _id: "c1", username: "Alice", avatarColor: "#6366f1", text: "Looks incredible. Let's start coding this!" }
        ]
    },
    {
        _id: "t2",
        board: "b1",
        title: "Connect WebRTC signaling sockets",
        description: "Integrate signaling routes on backend servers on port 5003 for live canvas whiteboard streams.",
        status: "In Progress",
        priority: "High",
        assignee: "Alice (Lead Developer)",
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        comments: []
    },
    {
        _id: "t3",
        board: "b1",
        title: "Implement Indian Rupee Seeding",
        description: "Convert all shop catalog prices from default dollars to Indian Rupees (₹).",
        status: "Done",
        priority: "Medium",
        assignee: "Carol (DevOps Engineer)",
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        comments: []
    }
];

const mockMembers = [
    { _id: "m1", name: "Alice", role: "Lead Developer", avatarColor: "#6366f1", tasksCount: 1 },
    { _id: "m2", name: "Bob", role: "UI Designer", avatarColor: "#a855f7", tasksCount: 1 },
    { _id: "m3", name: "Carol", role: "DevOps Engineer", avatarColor: "#10b981", tasksCount: 1 }
];

const mockActivities = [
    { _id: "a1", text: "Carol (DevOps Engineer) marked 'Implement Indian Rupee Seeding' as Done", time: "10 mins ago" },
    { _id: "a2", text: "Alice (Lead Developer) commented on 'Design glassmorphic UI layout'", time: "45 mins ago" },
    { _id: "a3", text: "Bob (UI Designer) created task 'Design glassmorphic UI layout'", time: "2 hours ago" }
];

export default function App() {
    // Navigation view
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'boards' | 'team' | 'activity'

    // App state
    const [boards, setBoards] = useState(mockBoards);
    const [tasks, setTasks] = useState(mockTasks);
    const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('nexflow_members')) || mockMembers);
    const [activities, setActivities] = useState(() => JSON.parse(localStorage.getItem('nexflow_activities')) || mockActivities);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('nexflow_user')) || null);
    const [isOffline, setIsOffline] = useState(false);

    // Form inputs
    const [activeBoardId, setActiveBoardId] = useState('b1');
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [boardTitle, setBoardTitle] = useState('');
    const [boardDesc, setBoardDesc] = useState('');

    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskPriority, setTaskPriority] = useState('Medium');
    const [taskAssignee, setTaskAssignee] = useState('Alice');
    const [taskDueDate, setTaskDueDate] = useState('');

    const [selectedTask, setSelectedTask] = useState(null);
    const [commentText, setCommentText] = useState('');

    // Team form state
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('Developer');

    // Auth modal
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
                    localStorage.setItem('nexflow_user', JSON.stringify(data));
                    return;
                }

                res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'Guest Manager', email: 'guest_user@gmail.com', password: 'guest123' })
                });
                data = await res.json();
                if (res.ok) {
                    setUser(data);
                    localStorage.setItem('nexflow_user', JSON.stringify(data));
                }
            } catch (err) {
                console.error("Auto login failed", err);
            }
        };
        autoLoginGuest();
    }, [user]);

    // Fetch boards & tasks
    useEffect(() => {
        const fetchWorkspace = async () => {
            if (!user) {
                setIsOffline(true);
                const cachedB = JSON.parse(localStorage.getItem('nexflow_boards')) || mockBoards;
                const cachedT = JSON.parse(localStorage.getItem('nexflow_tasks')) || mockTasks;
                setBoards(cachedB);
                if (cachedB.length > 0) {
                    const activeId = activeBoardId || cachedB[0]._id;
                    setActiveBoardId(activeId);
                    setTasks(cachedT.filter(t => t.board === activeId));
                }
                return;
            }
            try {
                const resB = await fetch(`${API_URL}/projects/boards`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!resB.ok) throw new Error();
                const dataB = await resB.json();
                setBoards(dataB);
                setIsOffline(false);

                if (dataB.length > 0) {
                    const activeId = activeBoardId || dataB[0]._id;
                    setActiveBoardId(activeId);
                    const resT = await fetch(`${API_URL}/projects/boards/${activeId}/tasks`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    });
                    const dataT = await resT.json();
                    setTasks(dataT);
                }
            } catch (err) {
                setIsOffline(true);
                const cachedB = JSON.parse(localStorage.getItem('nexflow_boards')) || mockBoards;
                const cachedT = JSON.parse(localStorage.getItem('nexflow_tasks')) || mockTasks;
                setBoards(cachedB);
                if (cachedB.length > 0) {
                    const activeId = activeBoardId || cachedB[0]._id;
                    setActiveBoardId(activeId);
                    setTasks(cachedT.filter(t => t.board === activeId));
                }
            }
        };
        fetchWorkspace();
    }, [user, activeBoardId, activeTab]);

    // Cache states
    useEffect(() => {
        if (isOffline) {
            localStorage.setItem('nexflow_boards', JSON.stringify(boards));
            localStorage.setItem('nexflow_tasks', JSON.stringify(tasks));
        }
    }, [boards, tasks, isOffline]);

    useEffect(() => {
        localStorage.setItem('nexflow_members', JSON.stringify(members));
    }, [members]);

    useEffect(() => {
        localStorage.setItem('nexflow_activities', JSON.stringify(activities));
    }, [activities]);

    const logActivity = (text) => {
        const newAct = {
            _id: 'act_' + Date.now(),
            text,
            time: 'Just now'
        };
        setActivities([newAct, ...activities]);
    };

    // Create Board
    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!boardTitle.trim()) return;

        const payload = { title: boardTitle, description: boardDesc };

        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/projects/boards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setBoards([...boards, data]);
            setActiveBoardId(data._id);
            setIsCreateBoardOpen(false);
            setBoardTitle('');
            setBoardDesc('');
            logActivity(`Created board '${boardTitle}'`);
        } catch (err) {
            const dummyBoard = {
                _id: 'b_' + Date.now(),
                title: boardTitle,
                description: boardDesc
            };
            setBoards([...boards, dummyBoard]);
            setActiveBoardId(dummyBoard._id);
            setIsCreateBoardOpen(false);
            setBoardTitle('');
            setBoardDesc('');
            setIsOffline(true);
            logActivity(`Created board '${boardTitle}' (Local)`);
        }
    };

    // Create Task
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!taskTitle.trim() || !activeBoardId) return;

        const payload = {
            boardId: activeBoardId,
            title: taskTitle,
            description: taskDesc,
            priority: taskPriority,
            dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
            assignee: taskAssignee
        };

        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/projects/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setTasks([...tasks, data]);
            setIsCreateTaskOpen(false);
            resetTaskForm();
            logActivity(`Created task '${taskTitle}' under Board`);
        } catch (err) {
            const dummyTask = {
                _id: 't_' + Date.now(),
                board: activeBoardId,
                title: taskTitle,
                description: taskDesc,
                status: 'To Do',
                priority: taskPriority,
                dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
                assignee: taskAssignee,
                comments: []
            };
            setTasks([...tasks, dummyTask]);
            setIsCreateTaskOpen(false);
            resetTaskForm();
            setIsOffline(true);
            logActivity(`Created task '${taskTitle}' (Local)`);
        }
    };

    const resetTaskForm = () => {
        setTaskTitle('');
        setTaskDesc('');
        setTaskPriority('Medium');
        setTaskAssignee('Alice');
        setTaskDueDate('');
    };

    // Update Task Status (Drag and Drop / category toggle)
    const updateTaskStatus = async (taskId, newStatus) => {
        const task = tasks.find(t => t._id === taskId);
        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/projects/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setTasks(tasks.map(t => t._id === taskId ? data : t));
            logActivity(`Moved '${task.title}' to status: ${newStatus}`);
        } catch (err) {
            setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
            setIsOffline(true);
            logActivity(`Moved '${task?.title || "Task"}' to status: ${newStatus} (Local)`);
        }
    };

    // Add Comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !selectedTask) return;

        try {
            if (!user) throw new Error('Offline Mode');
            const res = await fetch(`${API_URL}/projects/tasks/${selectedTask._id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ text: commentText })
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            
            const updatedTask = { ...selectedTask, comments: data };
            setTasks(tasks.map(t => t._id === selectedTask._id ? updatedTask : t));
            setSelectedTask(updatedTask);
            setCommentText('');
            logActivity(`Added comment on task '${selectedTask.title}'`);
        } catch (err) {
            const newComment = {
                _id: 'c_' + Date.now(),
                username: user ? user.username : 'Guest User',
                avatarColor: user ? (user.avatarColor || '#6366f1') : '#10b981',
                text: commentText
            };
            const updatedTask = { ...selectedTask, comments: [...selectedTask.comments, newComment] };
            setTasks(tasks.map(t => t._id === selectedTask._id ? updatedTask : t));
            setSelectedTask(updatedTask);
            setCommentText('');
            setIsOffline(true);
            logActivity(`Added comment on task '${selectedTask.title}' (Local)`);
        }
    };

    // Add team member locally
    const handleAddMember = (e) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        const newMem = {
            _id: 'mem_' + Date.now(),
            name: newMemberName,
            role: newMemberRole,
            avatarColor: ['#6366f1', '#a855f7', '#10b981', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 5)],
            tasksCount: 0
        };

        setMembers([...members, newMem]);
        setNewMemberName('');
        logActivity(`Added team member '${newMemberName}' as ${newMemberRole}`);
    };

    // Drag events
    const onDragStart = (e, id) => {
        e.dataTransfer.setData("text/plain", id);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e, status) => {
        const id = e.dataTransfer.getData("text/plain");
        updateTaskStatus(id, status);
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
            localStorage.setItem('nexflow_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setEmail('');
            setPassword('');
        } catch (err) {
            const name = email.split('@')[0];
            const dummyUser = { username: name, email, token: 'offline-token' };
            setUser(dummyUser);
            localStorage.setItem('nexflow_user', JSON.stringify(dummyUser));
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
            localStorage.setItem('nexflow_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
        } catch (err) {
            const dummyUser = { username: regUsername, email: regEmail, token: 'offline-token' };
            setUser(dummyUser);
            localStorage.setItem('nexflow_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            alert('Offline Mode: Simulated registration.');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('nexflow_user');
        alert('Logged out.');
    };

    // Calculate Analytics
    const completedTasksCount = tasks.filter(t => t.status === 'Done').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const reviewCount = tasks.filter(t => t.status === 'Review').length;
    const todoCount = tasks.filter(t => t.status === 'To Do').length;

    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="header-container">
                    <a href="#" className="logo" onClick={() => setActiveTab('dashboard')}>
                        <span className="gradient-text">Nex</span>Flow
                    </a>
                    
                    <nav className="nav-links">
                        <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <i className="fa-solid fa-chart-simple"></i> Dashboard
                        </button>
                        <button className={`nav-link ${activeTab === 'boards' ? 'active' : ''}`} onClick={() => setActiveTab('boards')}>
                            <i className="fa-solid fa-folder-open"></i> Kanban Board
                        </button>
                        <button className={`nav-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                            <i className="fa-solid fa-users"></i> Team Space
                        </button>
                        <button className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                            <i className="fa-solid fa-clock-rotate-left"></i> Sprint Audit
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

            {/* Main Application Container */}
            <main className="main-container" style={{ marginTop: '85px', maxWidth: '1080px' }}>

                {/* 1. DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.2rem' }}>Sprint Workspace Analytics</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Track task status distributions, team workloads, and pending milestones.</p>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Boards</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{boards.length}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Cards</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{tasks.length}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Completed Tasks</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{completedTasksCount}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>In Progress</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{inProgressCount}</div>
                            </div>
                        </div>

                        {/* Detail Layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
                            {/* Distribution */}
                            <div className="glass-card" style={{ padding: '1.8rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Workflow Categories</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {[
                                        { label: 'To Do', count: todoCount, color: 'var(--text-muted)' },
                                        { label: 'In Progress', count: inProgressCount, color: '#3b82f6' },
                                        { label: 'Review', count: reviewCount, color: '#f59e0b' },
                                        { label: 'Done', count: completedTasksCount, color: '#10b981' }
                                    ].map(stat => {
                                        const pct = tasks.length > 0 ? (stat.count / tasks.length) * 100 : 0;
                                        return (
                                            <div key={stat.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                                                    <span>{stat.label}</span>
                                                    <strong>{stat.count} ({Math.round(pct)}%)</strong>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: stat.color, borderRadius: '4px' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="glass-card" style={{ padding: '1.8rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>High Priority Milestones</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {tasks.filter(t => t.priority === 'High').length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No critical alerts active.</p>
                                    ) : (
                                        tasks.filter(t => t.priority === 'High').map(t => (
                                            <div 
                                                key={t._id} 
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderLeft: '3px solid #ef4444'
                                                }}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={t.status === 'Done'} 
                                                    onChange={() => updateTaskStatus(t._id, t.status === 'Done' ? 'To Do' : 'Done')}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <div style={{ overflow: 'hidden' }}>
                                                    <h5 style={{ fontSize: '0.88rem', margin: 0, textDecoration: t.status === 'Done' ? 'line-through' : 'none', color: t.status === 'Done' ? 'var(--text-muted)' : 'white' }}>{t.title}</h5>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned to: {t.assignee}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. BOARDS KANBAN VIEW */}
                {activeTab === 'boards' && (
                    <div>
                        {/* Board Controls */}
                        <div className="board-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Board Workspace:</label>
                                <select 
                                    value={activeBoardId} 
                                    onChange={(e) => setActiveBoardId(e.target.value)}
                                    style={{
                                        background: 'rgba(18, 18, 26, 0.95)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    {boards.map(b => (
                                        <option key={b._id} value={b._id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn btn-outline" onClick={() => setIsCreateBoardOpen(true)}>
                                    <i className="fa-solid fa-folder-plus"></i> New Board
                                </button>
                                <button className="btn btn-primary" onClick={() => setIsCreateTaskOpen(true)}>
                                    <i className="fa-solid fa-square-plus"></i> New Task Card
                                </button>
                            </div>
                        </div>

                        {/* Kanban Columns */}
                        <div className="kanban-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', minHeight: '520px', alignItems: 'start' }}>
                            {[
                                { status: 'To Do', label: 'To Do', color: '#858599' },
                                { status: 'In Progress', label: 'In Progress', color: '#3b82f6' },
                                { status: 'Review', label: 'Review Required', color: '#f59e0b' },
                                { status: 'Done', label: 'Completed', color: '#10b981' }
                            ].map(col => {
                                const colTasks = tasks.filter(t => t.status === col.status);
                                return (
                                    <div 
                                        className="kanban-column glass-card"
                                        key={col.status}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, col.status)}
                                        style={{ background: 'rgba(18, 18, 26, 0.45)', padding: '12px', minHeight: '480px', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: col.color }}>{col.label}</span>
                                            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '10px' }}>{colTasks.length}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                            {colTasks.map(t => (
                                                <div 
                                                    className="task-card glass-card"
                                                    key={t._id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, t._id)}
                                                    onClick={() => setSelectedTask(t)}
                                                    style={{
                                                        padding: '12px',
                                                        cursor: 'grab',
                                                        background: 'rgba(18, 18, 26, 0.85)',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <span 
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: t.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                            color: t.priority === 'High' ? '#ef4444' : '#f59e0b',
                                                            fontWeight: 600,
                                                            display: 'inline-block',
                                                            marginBottom: '8px'
                                                        }}
                                                    >
                                                        {t.priority}
                                                    </span>
                                                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>{t.title}</h4>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>
                                                        {t.description}
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <span>👤 {t.assignee.split(' ')[0]}</span>
                                                        {t.dueDate && <span>📅 {new Date(t.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. TEAM VIEW */}
                {activeTab === 'team' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.2rem' }}>Workspace Team Directory</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Add sprint teammates, assign project roles, and track active workloads.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                            {/* Member Grid list */}
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Active Members</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {members.map(m => (
                                        <div 
                                            key={m._id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="avatar" style={{ background: m.avatarColor, width: '38px', height: '38px', fontSize: '0.9rem' }}>
                                                    {m.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{m.name}</h4>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.role}</span>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <strong>{tasks.filter(t => t.assignee.includes(m.name)).length}</strong> active tasks
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add member form */}
                            <div className="glass-card" style={{ height: 'fit-content' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>Add Teammate</h3>
                                <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="form-group">
                                        <label>Teammate Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="e.g. Liam Smith" 
                                            value={newMemberName}
                                            onChange={(e) => setNewMemberName(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Sprint Role</label>
                                        <select 
                                            value={newMemberRole}
                                            onChange={(e) => setNewMemberRole(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: 'rgba(18, 18, 26, 0.95)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
                                        >
                                            <option value="Developer">Developer</option>
                                            <option value="UI Designer">UI Designer</option>
                                            <option value="DevOps Engineer">DevOps Engineer</option>
                                            <option value="Project Manager">Project Manager</option>
                                            <option value="QA Engineer">QA Tester</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block">Add Teammate</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. ACTIVITY LOG VIEW */}
                {activeTab === 'activity' && (
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Sprint Audit Feed</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Security and event logs tracking Board workflow operations.</p>
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={() => { setActivities([]); localStorage.setItem('nexflow_activities', '[]'); }}>
                                Clear Audit Logs
                            </button>
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            {activities.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No activity records found.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {activities.map(act => (
                                        <div 
                                            key={act._id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '12px 15px',
                                                background: 'rgba(255,255,255,0.01)',
                                                borderLeft: '3px solid var(--primary-color)',
                                                borderRadius: '4px',
                                                fontSize: '0.88rem'
                                            }}
                                        >
                                            <span>{act.text}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{act.time}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="footer" style={{ marginTop: '3rem' }}>
                <p>&copy; 2026 NexFlow. Designed for MERN Agile Sprint Management.</p>
            </footer>

            {/* Modals */}
            {/* Create Board Modal */}
            {isCreateBoardOpen && (
                <div className="modal open">
                    <div className="modal-overlay" onClick={() => setIsCreateBoardOpen(false)}></div>
                    <div className="modal-content auth-box">
                        <button className="close-btn" onClick={() => setIsCreateBoardOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.3rem' }}>Create Board Workspace</h3>
                        <form onSubmit={handleCreateBoard}>
                            <div className="form-group">
                                <label>Board Name</label>
                                <input type="text" required value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} placeholder="e.g. Phase 2 UI Sprint" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" value={boardDesc} onChange={(e) => setBoardDesc(e.target.value)} placeholder="e.g. Design assets & templates" />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Create Board</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isCreateTaskOpen && (
                <div className="modal open">
                    <div className="modal-overlay" onClick={() => setIsCreateTaskOpen(false)}></div>
                    <div className="modal-content auth-box">
                        <button className="close-btn" onClick={() => setIsCreateTaskOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.3rem' }}>Create Scrum Task Card</h3>
                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label>Task Title</label>
                                <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Setup SSL Certs" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Write checklist details..." rows="3" />
                            </div>
                            <div className="form-group">
                                <label>Priority Level</label>
                                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                                    <option value="High">🔴 High Priority</option>
                                    <option value="Medium">🟡 Medium Priority</option>
                                    <option value="Low">🟢 Low Priority</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Sprint Assignee</label>
                                <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                                    {members.map(m => (
                                        <option key={m._id} value={`${m.name} (${m.role})`}>{m.name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Create Task</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Details Modal (Comments & details viewer) */}
            {selectedTask && (
                <div className="modal open">
                    <div className="modal-overlay" onClick={() => setSelectedTask(null)}></div>
                    <div className="modal-content" style={{ width: '560px', padding: '25px', textAlign: 'left' }}>
                        <button className="close-btn" onClick={() => setSelectedTask(null)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '4px' }}>
                            ID: {selectedTask._id}
                        </span>
                        <h3 style={{ marginTop: '8px', fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>{selectedTask.title}</h3>
                        
                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                            <span>Priority: <strong style={{ color: selectedTask.priority === 'High' ? '#ef4444' : '#f59e0b' }}>{selectedTask.priority}</strong></span>
                            <span>Assignee: <strong>{selectedTask.assignee}</strong></span>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Task Description</h4>
                        <p style={{ fontSize: '0.88rem', lineHeight: '1.5', background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            {selectedTask.description || "No description provided."}
                        </p>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>Task Comments Logs</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                            {(selectedTask.comments || []).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No developer notes yet.</p>
                            ) : (
                                (selectedTask.comments || []).map((c, i) => (
                                    <div key={c._id || i} style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                        <div className="avatar avatar-sm" style={{ background: c.avatarColor || '#6366f1' }}>
                                            {c.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h5 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.username}</h5>
                                            <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>{c.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                placeholder="Add developer log comment..." 
                                value={commentText} 
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '0.88rem' }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 15px' }}>Post</button>
                        </form>
                    </div>
                </div>
            )}

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
                                <input type="text" required placeholder="alice_cyber" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
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
