import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TLDashboard({ user }) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState('');
    
    // Member Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'Developer', status: 'Active' });

    // Task Assignment Modal
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', estimatedTime: 8, priority: 'medium' });

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await axios.get('/api/team');
            // Ensure TL only sees their specific team if they have one assigned, otherwise let them see all
            const filteredTeam = user.team && user.team.trim() !== '' 
                ? res.data.filter(m => m.team === user.team) 
                : res.data;
            setTeamMembers(filteredTeam);
        } catch (err) {
            console.error('Error fetching team:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...memberForm, team: user.team || 'General' };
            await axios.post('/api/team', payload);
            setIsAddModalOpen(false);
            setMemberForm({ name: '', email: '', role: 'Developer', status: 'Active' });
            setShowSuccess('Member added successfully!');
            setTimeout(() => setShowSuccess(''), 3000);
            fetchTeam();
        } catch (err) {
            alert('Failed to add member');
        }
    };

    const handleDeleteMember = async (id) => {
        if (!window.confirm("Are you sure you want to remove this team member? Tasks assigned to them will be impacted.")) return;
        try {
            await axios.delete(`/api/team/${id}`);
            setShowSuccess('Member removed successfully!');
            setTimeout(() => setShowSuccess(''), 3000);
            fetchTeam();
        } catch (err) {
            alert('Failed to delete member');
        }
    };

    const openTaskModal = (member) => {
        setSelectedMember(member);
        setIsTaskModalOpen(true);
        // Default deadline 2 days from now
        const d = new Date();
        d.setDate(d.getDate() + 2);
        setTaskForm({ ...taskForm, deadline: d.toISOString().slice(0, 16) });
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/tasks', {
                ...taskForm,
                assignedTo: selectedMember._id
            });
            setIsTaskModalOpen(false);
            setTaskForm({ title: '', description: '', deadline: '', estimatedTime: 8, priority: 'medium' });
            setShowSuccess(`Task assigned to ${selectedMember.name}!`);
            setTimeout(() => setShowSuccess(''), 3000);
            fetchTeam(); // Refresh counts
        } catch (err) {
            alert('Failed to assign task');
        }
    };

    if (loading) return <div className="loading">Loading TL Dashboard...</div>;

    return (
        <div className="page-container" style={{maxWidth: '1200px', margin: '0 auto'}}>
            <div className="page-header">
                <div>
                    <h1>Team Leader Dashboard</h1>
                    <p className="page-subtitle">Manage the <strong>{user.team || 'General'}</strong> Squad.</p>
                </div>
                <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>+ Add Member</button>
            </div>

            {showSuccess && (
                <div className="success-toast" style={{
                    position: 'fixed', top: '20px', right: '20px', background: 'var(--green)', color: '#fff', 
                    padding: '12px 24px', borderRadius: 'var(--radius-sm)', zIndex: 1000, animation: 'fadeIn 0.3s ease'
                }}>✅ {showSuccess}</div>
            )}

            <div className="team-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {teamMembers.length === 0 ? (
                    <div className="empty-state" style={{gridColumn: '1 / -1'}}>No team members assigned to this squad yet.</div>
                ) : (
                    teamMembers.map(member => (
                        <div key={member._id} className="team-card hr-card" style={{position: 'relative'}}>
                            <div className="card-status-badge" style={{
                                position: 'absolute', top: '15px', right: '15px',
                                fontSize: '10px', color: member.status === 'Active' ? 'var(--green)' : 'var(--text-muted)', fontWeight: 700
                            }}>● {member.status}</div>
                            
                            <div className="team-avatar" style={{width: '50px', height: '50px', fontSize: '20px'}}>
                                {member.name?.[0]?.toUpperCase()}
                            </div>
                            <h3>{member.name}</h3>
                            <p className="team-role" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, margin: '2px 0' }}>
                                {member.role}
                            </p>
                            <p className="team-email" style={{ marginBottom: '12px', fontSize: '12px' }}>{member.email}</p>
                            
                            <div className="team-stats" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '10px 0', margin: '10px 0', display: 'flex', justifyContent: 'space-around' }}>
                                <div style={{textAlign: 'center'}}>
                                    <strong style={{display: 'block', color: 'var(--text-primary)'}}>{member.currentTaskCount}</strong>
                                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Tasks Active</span>
                                </div>
                                <div style={{textAlign: 'center'}}>
                                    <strong style={{display: 'block', color: 'var(--text-primary)'}}>{Math.round((member.currentTaskCount/(member.maxTasks||5))*100)}%</strong>
                                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Workload</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                <button className="login-btn" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => openTaskModal(member)}>
                                    Assign Task
                                </button>
                                <button className="btn-primary-ghost" style={{ flex: 1, padding: '8px', fontSize: '13px', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDeleteMember(member._id)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Add to {user.team || 'Squad'}</h2>
                            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddMember}>
                            <div className="edit-modal-content" style={{padding: '20px'}}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <input type="text" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
                                </div>
                            </div>
                            <div className="modal-footer" style={{padding: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 30px'}}>Add Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Task Modal */}
            {isTaskModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Assign Task to {selectedMember?.name}</h2>
                            <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAssignTask}>
                            <div className="edit-modal-content" style={{padding: '20px'}}>
                                <div className="form-group">
                                    <label>Task Title</label>
                                    <input type="text" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea required value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} style={{width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: '#fff', minHeight: '80px'}}></textarea>
                                </div>
                                <div className="form-row" style={{display: 'flex', gap: '15px'}}>
                                    <div className="form-group" style={{flex: 1}}>
                                        <label>Deadline</label>
                                        <input type="datetime-local" required value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{flex: 1}}>
                                        <label>Est. Hours</label>
                                        <input type="number" required value={taskForm.estimatedTime} onChange={e => setTaskForm({...taskForm, estimatedTime: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{padding: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 30px'}}>Assign Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TLDashboard;
