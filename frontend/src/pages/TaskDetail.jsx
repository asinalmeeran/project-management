import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

function TaskDetail() {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            const res = await axios.get(`/api/tasks/${id}`);
            setTask(res.data);
        } catch (err) {
            console.error('Error fetching task details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            await axios.put(`/api/status/${id}`, { status: newStatus });
            fetchTask();
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading">Loading task details...</div>;
    if (!task) return <div className="empty-state">Task not found.</div>;

    return (
        <div className="page-container">
            <Link to="/tasks" className="back-link">← Back to Tasks</Link>

            <div className="detail-card">
                <div className="detail-header">
                    <div>
                        <span className="task-project">{task.project}</span>
                        <h1>{task.title}</h1>
                    </div>
                    <div className="status-grid" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className={`status-badge status-${task.status}`}>{task.status}</span>
                        <select 
                            className="view-btn" 
                            style={{ margin: 0, padding: '4px 8px' }}
                            value={task.status} 
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            disabled={updating}
                        >
                            <option value="todo">To Do</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="due">Overdue</option>
                        </select>
                    </div>
                </div>

                <p className="detail-desc">{task.description}</p>

                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Deadline</span>
                        <strong>{new Date(task.deadline).toLocaleString()}</strong>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Estimated Time</span>
                        <strong>{task.estimatedTime} Hours</strong>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Priority</span>
                        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Assigned To</span>
                        <strong>{task.assignedTo?.name || task.assignedTo?.username || 'Unassigned'}</strong>
                    </div>
                </div>

                <div className="detail-qualities">
                    <h3>Required Qualities</h3>
                    <div className="quality-tags large">
                        {task.requiredQualities?.map(q => (
                            <span key={q} className="quality-tag">{q}</span>
                        ))}
                    </div>
                </div>

                <div className="detail-timeline">
                    <h3>Work Timeline</h3>
                    <div className="timeline-list">
                        {task.timeline && task.timeline.length > 0 ? (
                            task.timeline.map((event, idx) => (
                                <div key={idx} className="timeline-event">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <span className="timeline-action">{event.action}</span>
                                        <span className="timeline-time">{new Date(event.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="kanban-empty">No activity recorded yet for this task.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TaskDetail;
