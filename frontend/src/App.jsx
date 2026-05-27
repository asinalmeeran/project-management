import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

import Login from './pages/Login';
import Task from './pages/Task';
import TaskDetail from './pages/TaskDetail';
import Team from './pages/Team';
import EventStatus from './pages/EventStatus';
import MyWorks from './pages/MyWorks';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import HRDashboard from './pages/HRDashboard';
import TLDashboard from './pages/TLDashboard';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem('user');
        try { return u ? JSON.parse(u) : null; } catch { return null; }
    });
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = (tok, usr) => {
        localStorage.setItem('token', tok);
        localStorage.setItem('user', JSON.stringify(usr));
        setToken(tok);
        setUser(usr);
        
        // Role-based initial redirect
        if (usr.role === 'HR') navigate('/hr-dashboard');
        else if (usr.role === 'TL') navigate('/tl-dashboard');
        else navigate('/my-works');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    if (!token) {
        return (
            <Routes>
                <Route path="*" element={<Login onLogin={handleLogin} />} />
            </Routes>
        );
    }

    const navItems = [
        { to: '/my-works', icon: '📊', label: 'My Works' },
        { to: '/tasks', icon: '📋', label: 'Tasks' },
        { to: '/team', icon: '👥', label: 'Team' },
        { to: '/status', icon: '📌', label: 'Status Board' },
        { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
        { to: '/profile', icon: '👤', label: 'Profile' },
    ];

    // Layout for HR Users
    if (user?.role === 'HR') {
        return (
            <div className="app-layout hr-portal">
                <aside className="sidebar hr-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-logo">🔒</div>
                        <h2>HR Portal</h2>
                    </div>
                    <nav className="sidebar-nav">
                        <Link to="/hr-dashboard" className={`nav-item ${location.pathname === '/hr-dashboard' ? 'active' : ''}`}>
                            <span className="nav-icon">🏢</span>
                            <span className="nav-label">HR Dashboard</span>
                        </Link>
                    </nav>
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-avatar" style={{background: 'var(--gold)'}}>HR</div>
                            <span className="user-name">{user.username}</span>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
                    </div>
                </aside>
                <main className="main-content">
                    <Routes>
                        <Route path="/hr-dashboard" element={<HRDashboard />} />
                        <Route path="*" element={<Navigate to="/hr-dashboard" />} />
                    </Routes>
                </main>
            </div>
        );
    }

    // Layout for TL Users
    if (user?.role === 'TL') {
        return (
            <div className="app-layout">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-logo">🚀</div>
                        <h2>ProManage (TL)</h2>
                    </div>
                    <nav className="sidebar-nav">
                        <Link to="/tl-dashboard" className={`nav-item ${location.pathname === '/tl-dashboard' ? 'active' : ''}`}>
                            <span className="nav-icon">🛡️</span>
                            <span className="nav-label">Squad Dashboard</span>
                        </Link>
                        <Link to="/tasks" className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}>
                            <span className="nav-icon">📋</span>
                            <span className="nav-label">All Tasks</span>
                        </Link>
                        <Link to="/status" className={`nav-item ${location.pathname === '/status' ? 'active' : ''}`}>
                            <span className="nav-icon">📌</span>
                            <span className="nav-label">Status Board</span>
                        </Link>
                        <Link to="/leaderboard" className={`nav-item ${location.pathname === '/leaderboard' ? 'active' : ''}`}>
                            <span className="nav-icon">🏆</span>
                            <span className="nav-label">Leaderboard</span>
                        </Link>
                    </nav>
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-avatar" style={{background: 'var(--accent)'}}>TL</div>
                            <span className="user-name">{user.username}</span>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
                    </div>
                </aside>
                <main className="main-content">
                    <Routes>
                        <Route path="/tl-dashboard" element={<TLDashboard user={user} />} />
                        <Route path="/tasks" element={<Task />} />
                        <Route path="/tasks/:id" element={<TaskDetail />} />
                        <Route path="/status" element={<EventStatus />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="*" element={<Navigate to="/tl-dashboard" />} />
                    </Routes>
                </main>
            </div>
        );
    }

    // Layout for Employees
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">🚀</div>
                    <h2>ProManage</h2>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
                        <span className="user-name">{user?.username || 'User'}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
                </div>
            </aside>

            <main className="main-content">
                <Routes>
                    <Route path="/my-works" element={<MyWorks user={user} />} />
                    <Route path="/tasks" element={<Task />} />
                    <Route path="/tasks/:id" element={<TaskDetail />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/status" element={<EventStatus />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/profile" element={<Profile user={user} />} />
                    <Route path="*" element={<Navigate to="/my-works" />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
