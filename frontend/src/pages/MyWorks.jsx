import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function MyWorks({ user }) {
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, notifRes] = await Promise.all([
                    axios.get('/api/tasks'),
                    axios.get('/api/status/notifications')
                ]);
                setTasks(tasksRes.data);
                setNotifications(notifRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const myTasks = tasks.filter(t => t.assignedTo?.email === user?.email);
    const completedCount = myTasks.filter(t => t.status === 'completed').length;
    const ongoingCount = myTasks.filter(t => t.status === 'ongoing').length;
    const todoCount = myTasks.filter(t => t.status === 'todo').length;
    const overdueCount = myTasks.filter(t => t.status === 'due').length;

    const progressPercent = myTasks.length > 0
        ? Math.round((completedCount / myTasks.length) * 100)
        : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Welcome, {user?.username}!</h1>
                    <p className="page-subtitle">Here's what's happening with your projects today.</p>
                </div>
            </div>

            <div className="summary-grid">
                <div className="summary-card total">
                    <span className="summary-icon">📊</span>
                    <div className="summary-info">
                        <span className="summary-number">{myTasks.length}</span>
                        <span className="summary-label">Total Assigned</span>
                    </div>
                </div>
                <div className="summary-card completed">
                    <span className="summary-icon">✅</span>
                    <div className="summary-info">
                        <span className="summary-number">{completedCount}</span>
                        <span className="summary-label">Completed</span>
                    </div>
                </div>
                <div className="summary-card in-progress">
                    <span className="summary-icon">⏳</span>
                    <div className="summary-info">
                        <span className="summary-number">{ongoingCount}</span>
                        <span className="summary-label">In Progress</span>
                    </div>
                </div>
                <div className="summary-card overdue">
                    <span className="summary-icon">🚨</span>
                    <div className="summary-info">
                        <span className="summary-number">{overdueCount}</span>
                        <span className="summary-label">Overdue</span>
                    </div>
                </div>
            </div>

            <div className="progress-section">
                <div className="progress-header">
                    <h2>Completion Progress</h2>
                    <span className="progress-percent">{progressPercent}%</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}>
                        {progressPercent > 5 && <span className="progress-bar-text">{progressPercent}%</span>}
                    </div>
                </div>
            </div>

            {notifications.length > 0 && (
                <div className="notifications-section">
                    <h2>🔔 Urgent Notifications</h2>
                    <div className="notification-list">
                        {notifications.map(notif => (
                            <div key={notif._id} className="notification-item">
                                <span className="notif-icon">⚠️</span>
                                <div className="notif-content">
                                    <strong>{notif.title}</strong> is approaching deadline!
                                    <span className="notif-time">Due: {new Date(notif.deadline).toLocaleString()}</span>
                                </div>
                                <Link to={`/tasks/${notif._id}`} className="notif-action">View Details</Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="task-table-section">
                <h2>Your Recent Tasks</h2>
                <div className="table-wrapper">
                    <table className="task-table">
                        <thead>
                            <tr>
                                <th>Task Name</th>
                                <th>Project</th>
                                <th>Deadline</th>
                                <th>Status</th>
                                <th>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-table">No tasks assigned to you yet.</td>
                                </tr>
                            ) : (
                                myTasks.slice(0, 5).map(task => (
                                    <tr key={task._id}>
                                        <td>
                                            <Link to={`/tasks/${task._id}`} className="task-name-link">
                                                {task.title}
                                            </Link>
                                        </td>
                                        <td>{task.project}</td>
                                        <td>{new Date(task.deadline).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge status-${task.status}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`priority-badge priority-${task.priority}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default MyWorks;
