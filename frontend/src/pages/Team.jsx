import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Team() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', role: 'Developer', team: 'Frontend', status: 'Active'
    });
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await axios.get('/api/team');
            setMembers(res.data);
        } catch (err) {
            console.error('Error fetching team:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/team', formData);
            setMembers([...members, res.data].sort((a, b) => a.name.localeCompare(b.name)));
            setIsModalOpen(false);
            setFormData({ name: '', email: '', role: 'Developer', team: 'Frontend', status: 'Active' });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error('Error adding member:', err);
            alert('Failed to add member');
        }
    };

    if (loading) return <div className="loading">Loading team members...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Team Members</h1>
                    <p className="page-subtitle">Manage and view the workload of your project team.</p>
                </div>
                <button className="add-btn" onClick={() => setIsModalOpen(true)}>
                    + Add Member
                </button>
            </div>

            {showSuccess && (
                <div className="success-toast" style={{
                    position: 'fixed', top: '20px', right: '20px', 
                    background: 'var(--green)', color: '#fff', 
                    padding: '12px 24px', borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    ✅ Member added successfully!
                </div>
            )}

            <div className="team-grid">
                {members.length === 0 ? (
                    <div className="empty-state">No team members found.</div>
                ) : (
                    members.map(member => (
                        <div key={member._id} className="team-card">
                            <div className="card-status-badge" style={{
                                position: 'absolute', top: '15px', right: '15px',
                                fontSize: '10px', color: member.status === 'Active' ? 'var(--green)' : 'var(--text-muted)',
                                fontWeight: 700, textTransform: 'uppercase'
                            }}>
                                ● {member.status}
                            </div>
                            <div className="team-avatar">
                                {member.name?.[0]?.toUpperCase() || member.username?.[0]?.toUpperCase()}
                            </div>
                            <h3>{member.name || member.username}</h3>
                            <p className="team-role" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, margin: '2px 0 6px' }}>
                                {member.role || 'Developer'}
                            </p>
                            <p className="team-email" style={{ marginBottom: '12px' }}>{member.email}</p>
                            
                            <div className="team-stats" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                <div>
                                    <strong>{member.team || 'General'}</strong>
                                    <span>Team</span>
                                </div>
                                <div>
                                    <strong>{member.currentTaskCount}</strong>
                                    <span>Tasks</span>
                                </div>
                            </div>

                            <div className="quality-tags" style={{ marginTop: '12px' }}>
                                {member.qualities?.length > 0 ? (
                                    member.qualities.map(q => <span key={q} className="quality-tag">{q}</span>)
                                ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No specialized skills listed</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Add New Team Member</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="edit-modal-content">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" required 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" required 
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select 
                                            value={formData.role} 
                                            onChange={e => setFormData({...formData, role: e.target.value})}
                                            style={{ width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                                        >
                                            <option value="Developer">Developer</option>
                                            <option value="Designer">Designer</option>
                                            <option value="Manager">Manager</option>
                                            <option value="QA Lead">QA Lead</option>
                                            <option value="Product Owner">Product Owner</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Team</label>
                                        <input 
                                            type="text" placeholder="e.g. Frontend"
                                            value={formData.team} 
                                            onChange={e => setFormData({...formData, team: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select 
                                        value={formData.status} 
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer" style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 32px'}}>Add Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Team;
