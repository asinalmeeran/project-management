import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Profile({ user: initialUser }) {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({
        username: user?.username || '',
        role: user?.role || 'Senior Developer',
        bio: user?.bio || '',
        skills: user?.skills?.join(', ') || '',
        linkedin: user?.linkedin || ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // In a real app, we'd fetch by ID or from a /profile endpoint
            // For now, we simulate fetching user details or re-using the prop
            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editData,
                email: user.email,
                skills: editData.skills.split(',').map(s => s.trim()).filter(s => s)
            };
            const res = await axios.put('/api/auth/profile', payload);
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setIsEditModalOpen(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile');
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;

    return (
        <div className="page-container" style={{ padding: 0 }}>
            {/* Professional Banner & Header */}
            <div className="profile-banner-container">
                <div className="profile-banner"></div>
                <div className="profile-avatar-wrapper">
                    <div className="profile-avatar-main">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="profile-main-content">
                <div className="profile-section-card">
                    <div className="profile-headline-section">
                        <div className="profile-name-title">
                            <h1>{user?.username}</h1>
                            <p className="profile-role-headline">{user?.role || 'Technology Enthusiast | Full Stack Developer'}</p>
                            <p className="profile-location">San Francisco Bay Area • <span className="task-name-link" style={{fontSize: '14px'}}>Contact Info</span></p>
                        </div>
                        <div className="profile-actions">
                            <button className="add-btn" style={{margin:0}} onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
                            <button className="btn-primary-ghost">More</button>
                        </div>
                    </div>
                </div>

                <div className="profile-section-card">
                    <div className="section-header">
                        <h2>About</h2>
                        <button className="edit-icon-btn" onClick={() => setIsEditModalOpen(true)}>✎</button>
                    </div>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        {user?.bio || "No bio provided yet. Add a professional summary to let others know about your expertise and goals."}
                    </p>
                </div>

                <div className="profile-section-card">
                    <div className="section-header">
                        <h2>Experience</h2>
                        <button className="edit-icon-btn">+</button>
                    </div>
                    <div className="experience-list">
                        <div className="experience-item">
                            <div className="exp-logo">🏢</div>
                            <div className="exp-details">
                                <h3>Senior Software Engineer</h3>
                                <p className="exp-company">ProManage Inc. • Full-time</p>
                                <p className="exp-date">Jan 2022 - Present • 2 yrs 4 mos</p>
                            </div>
                        </div>
                        <div className="experience-item">
                            <div className="exp-logo">💻</div>
                            <div className="exp-details">
                                <h3>Full Stack Developer</h3>
                                <p className="exp-company">TechFlow Solutions • Contract</p>
                                <p className="exp-date">Jun 2020 - Dec 2021 • 1 yr 7 mos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-section-card">
                    <div className="section-header">
                        <h2>Skills</h2>
                        <button className="edit-icon-btn" onClick={() => setIsEditModalOpen(true)}>✎</button>
                    </div>
                    <div className="skills-list">
                        {user?.skills?.length > 0 ? (
                            user.skills.map(skill => (
                                <span key={skill} className="skill-badge">{skill}</span>
                            ))
                        ) : (
                            <span className="text-muted">No skills listed yet.</span>
                        )}
                    </div>
                </div>

                <div className="profile-section-card">
                    <div className="section-header">
                        <h2>Contact & Social</h2>
                    </div>
                    <div className="profile-stats-grid" style={{marginBottom: 0}}>
                        <div className="profile-stat-card" style={{padding: '15px'}}>
                            <span className="stat-icon">📧</span>
                            <span className="stat-label">Email</span>
                            <span style={{fontSize: '14px', fontWeight: 600}}>{user?.email}</span>
                        </div>
                        <div className="profile-stat-card" style={{padding: '15px'}}>
                            <span className="stat-icon">🔗</span>
                            <span className="stat-label">LinkedIn</span>
                            <a href={user?.linkedin} target="_blank" rel="noopener noreferrer" className="task-name-link" style={{fontSize: '14px'}}>
                                {user?.linkedin ? "View Profile" : "Not connected"}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Edit Intro</h2>
                            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveProfile}>
                            <div className="edit-modal-content">
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input 
                                        type="text" 
                                        value={editData.username} 
                                        onChange={e => setEditData({...editData, username: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Headline / Role</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Senior Software Engineer at Google"
                                        value={editData.role} 
                                        onChange={e => setEditData({...editData, role: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bio / About</label>
                                    <textarea 
                                        rows="4"
                                        value={editData.bio} 
                                        onChange={e => setEditData({...editData, bio: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Skills (comma separated)</label>
                                    <input 
                                        type="text" 
                                        placeholder="React, Node.js, AWS"
                                        value={editData.skills} 
                                        onChange={e => setEditData({...editData, skills: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>LinkedIn URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://linkedin.com/in/username"
                                        value={editData.linkedin} 
                                        onChange={e => setEditData({...editData, linkedin: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 32px'}}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
