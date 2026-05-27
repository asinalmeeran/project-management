import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Task() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', project: 'General',
        deadline: '', estimatedTime: '', requiredQualities: ''
    });
    const [prediction, setPrediction] = useState(null);
    const [predicting, setPredicting] = useState(false);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get('/api/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── AI Voice Feature ───────────────────────────────────────────
    const startVoiceAssistant = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech Recognition is not supported in this browser. Please use Chrome/Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; 
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsVoiceRecording(true);
            setVoiceFeedback('Listening... Speak now.');
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            setVoiceFeedback(`Processing: "${transcript}"`);
            
            try {
                const res = await axios.post('/api/voice-task/parse', { 
                    text: transcript,
                    userId: JSON.parse(localStorage.getItem('user'))?.id
                });
                
                alert(`🚀 AI: ${res.data.message}\nTask: ${res.data.task.title}`);
                fetchTasks();
            } catch (err) {
                alert(`AI Error: ${err.response?.data?.message || 'Failed to understand voice.'}`);
            }
        };

        recognition.onerror = (event) => {
            setVoiceFeedback('Voice error: ' + event.error);
            setIsVoiceRecording(false);
        };

        recognition.onend = () => {
            setIsVoiceRecording(false);
            setTimeout(() => setVoiceFeedback(''), 3000);
        };

        recognition.start();
    };

    const handlePredict = async () => {
        if (!formData.deadline) return alert('Please set a deadline first');
        setPredicting(true);
        try {
            const res = await axios.post('/api/tasks/predict', {
                deadline: formData.deadline,
                requiredQualities: formData.requiredQualities.split(',').map(s => s.trim()).filter(s => s)
            });
            setPrediction(res.data);
        } catch (err) {
            console.error('Prediction error:', err);
        } finally {
            setPredicting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                requiredQualities: formData.requiredQualities.split(',').map(s => s.trim()).filter(s => s),
                estimatedTime: Number(formData.estimatedTime)
            };
            await axios.post('/api/tasks', payload);
            setShowModal(false);
            setFormData({ title: '', description: '', project: 'General', deadline: '', estimatedTime: '', requiredQualities: '' });
            setPrediction(null);
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '10px' }}>
                <div>
                    <h1>Project Tasks</h1>
                    <p className="page-subtitle">Manage and track progress across all team projects.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Task
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {voiceFeedback && <span style={{ fontSize: '11px', color: 'var(--accent)', fontStyle: 'italic' }}>{voiceFeedback}</span>}
                        <button 
                            className={`mic-btn ${isVoiceRecording ? 'recording' : ''}`} 
                            onClick={startVoiceAssistant}
                            title="Speech-to-Task (English/Tamil)"
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                border: isVoiceRecording ? '2px solid var(--red)' : '1px solid var(--border)',
                                background: isVoiceRecording ? 'rgba(239,68,68,0.1)' : 'var(--bg-glass)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', cursor: 'pointer', transition: 'all 0.3s'
                            }}
                        >
                            {isVoiceRecording ? '🔴' : '🎤'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="tasks-grid">
                {tasks.map(task => (
                    <div key={task._id} className="task-card">
                        <div className="task-card-header">
                            <Link to={`/tasks/${task._id}`} className="task-title-link">
                                <h3>{task.title}</h3>
                            </Link>
                            <span className={`status-badge status-${task.status}`}>{task.status}</span>
                        </div>
                        <span className="task-project">{task.project}</span>
                        <p className="task-desc">{task.description?.substring(0, 80)}...</p>
                        
                        <div className="task-meta">
                            <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>
                            <span>⏱️ {task.estimatedTime}h</span>
                            <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                        </div>

                        {task.assignedTo && (
                            <div className="team-stats" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>
                                👤 {task.assignedTo.name || task.assignedTo.username}
                            </div>
                        )}

                        <div className="quality-tags">
                            {task.requiredQualities?.map(q => (
                                <span key={q} className="quality-tag">{q}</span>
                            ))}
                        </div>

                        <div className="task-actions" style={{ marginTop: '16px' }}>
                            <Link to={`/tasks/${task._id}`} className="view-btn">View Details</Link>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Create New Task</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Est. Time (h)</label>
                                    <input type="number" value={formData.estimatedTime} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Required Qualities (comma separated)</label>
                                <input type="text" placeholder="e.g. React, Backend, Testing" value={formData.requiredQualities} onChange={e => setFormData({...formData, requiredQualities: e.target.value})} />
                            </div>

                            <div className="ai-solution-section" style={{ padding: '16px', marginTop: '12px', borderStyle: 'dashed' }}>
                                <h2>🤖 AI Smart Assistant</h2>
                                <p className="ai-subtitle">Predict priority and best team member assignment.</p>
                                <button type="button" className="predict-btn" onClick={handlePredict} disabled={predicting}>
                                    {predicting ? 'Analyzing...' : 'Auto-Predict Best Match'}
                                </button>

                                {prediction && (
                                    <div className="prediction-result" style={{ background: 'rgba(99,102,241,0.05)', padding: '12px', borderRadius: '8px' }}>
                                        <p><strong>Predicted Priority:</strong> {prediction.predictedPriority}</p>
                                        {prediction.predictedMember ? (
                                            <p><strong>Suggested Member:</strong> {prediction.predictedMember.member.username} ({prediction.predictedMember.totalScore}% match)</p>
                                        ) : (
                                            <p>No suitable member found for these qualities.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="submit-btn" style={{ marginTop: '16px' }}>Create Task</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Task;
