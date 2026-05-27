import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function EventStatus() {
    const [groupedTasks, setGroupedTasks] = useState({
        todo: [], ongoing: [], completed: [], due: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroupedTasks();
    }, []);

    const fetchGroupedTasks = async () => {
        try {
            const res = await axios.get('/api/status');
            setGroupedTasks(res.data);
        } catch (err) {
            console.error('Error fetching status board:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading Kanban board...</div>;

    const columns = [
        { id: 'todo', title: 'To Do', icon: '📝', color: '#94a3b8' },
        { id: 'ongoing', title: 'Ongoing', icon: '🚀', color: '#fbbf24' },
        { id: 'completed', title: 'Completed', icon: '✅', color: '#34d399' },
        { id: 'due', title: 'Overdue', icon: '🚨', color: '#f87171' }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Status Board</h1>
                    <p className="page-subtitle">Track project workflow across all active task statuses.</p>
                </div>
            </div>

            <div className="kanban-board">
                {columns.map(col => (
                    <div key={col.id} className="kanban-column">
                        <div className="kanban-header" style={{ borderTopColor: col.color }}>
                            <h3>{col.icon} {col.title}</h3>
                            <span className="kanban-count">{groupedTasks[col.id]?.length || 0}</span>
                        </div>
                        <div className="kanban-cards">
                            {groupedTasks[col.id]?.length === 0 ? (
                                <div className="kanban-empty">No tasks</div>
                            ) : (
                                groupedTasks[col.id].map(task => (
                                    <div key={task._id} className="kanban-card">
                                        <Link to={`/tasks/${task._id}`}>
                                            <h4>{task.title}</h4>
                                        </Link>
                                        <div className="kanban-project" style={{ fontSize: '11px', color: '#6366f1', marginBottom: '8px' }}>
                                            {task.project}
                                        </div>
                                        <div className="kanban-member">👤 {task.assignedTo?.name || 'Unassigned'}</div>
                                        <div className="kanban-deadline">📅 {new Date(task.deadline).toLocaleDateString()}</div>
                                        <div className={`priority-badge priority-${task.priority}`} 
                                            style={{ marginTop: '8px', fontSize: '9px', padding: '2px 6px' }}>
                                            {task.priority}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventStatus;
