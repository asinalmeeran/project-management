import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ─── Simple SVG Pie Chart Component ─────────────────────────────────────────
function SVGPieChart({ successPercent }) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (successPercent / 100) * circumference;

    return (
        <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle 
                cx="75" cy="75" r={radius} fill="none" stroke="var(--accent)" strokeWidth="10" 
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 75 75)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800">
                {successPercent}%
            </text>
        </svg>
    );
}

function HRDashboard() {
    const [employees, setEmployees] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [tls, setTls] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [editForm, setEditForm] = useState({ role: '', team: '', status: '' });

    // TL Management State
    const [isTlModalOpen, setIsTlModalOpen] = useState(false);
    const [tlForm, setTlForm] = useState({ username: '', email: '', password: 'tlpassword123', team: '' });
    const [isTlTaskModalOpen, setIsTlTaskModalOpen] = useState(false);
    const [tlTaskForm, setTlTaskForm] = useState({ title: '', description: '', deadline: '', priority: 'medium' });
    const [selectedTl, setSelectedTl] = useState(null);

    useEffect(() => {
        fetchHRData();
        const interval = setInterval(fetchHRData, 20000); // 20s refresh
        return () => clearInterval(interval);
    }, []);

    const fetchHRData = async () => {
        try {
            const [empRes, altRes, attRes, predRes, tlRes] = await Promise.all([
                axios.get('/api/hr/employees'),
                axios.get('/api/hr/alerts'),
                axios.get('/api/hr/attendance'),
                axios.get('/api/hr/predictions'),
                axios.get('/api/hr/tls')
            ]);
            setEmployees(empRes.data);
            setAlerts(altRes.data);
            setAttendance(attRes.data);
            setPredictions(predRes.data);
            setTls(tlRes.data);
        } catch (err) {
            console.error('HR Data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteClick = (emp) => {
        setEditingMember(emp);
        setEditForm({ role: emp.role, team: emp.team, status: emp.status });
        setIsEditModalOpen(true);
    };

    const handleUpdateMember = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/hr/employees/${editingMember.id}`, editForm);
            setIsEditModalOpen(false);
            fetchHRData();
        } catch (err) {
            alert('Failed to update employee role');
        }
    };

    const handleCreateTl = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/hr/tls', tlForm);
            setIsTlModalOpen(false);
            setTlForm({ username: '', email: '', password: 'tlpassword123', team: '' });
            fetchHRData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create TL');
        }
    };

    const handleAssignTeamToTl = async (e, tlId, newTeam) => {
        try {
            await axios.put(`/api/hr/tls/${tlId}/assign-team`, { team: newTeam });
            fetchHRData();
        } catch (err) { alert('Failed to update TL team'); }
    };

    const handleDeleteTl = async (tlId) => {
        if (!window.confirm("Are you sure you want to remove this TL account?")) return;
        try {
            await axios.delete(`/api/hr/tls/${tlId}`);
            fetchHRData();
        } catch (err) { alert('Failed to delete TL'); }
    };

    const openTlTaskModal = (tl) => {
        setSelectedTl(tl);
        const d = new Date(); d.setDate(d.getDate() + 2);
        setTlTaskForm({ title: '', description: '', deadline: d.toISOString().slice(0, 16), priority: 'high' });
        setIsTlTaskModalOpen(true);
    };

    const handleAssignTlTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/hr/tls/${selectedTl.id}/assign-task`, tlTaskForm);
            setIsTlTaskModalOpen(false);
            fetchHRData();
        } catch(err) { alert('Failed to assign task to TL'); }
    };

    if (loading) return <div className="loading" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>AI Analysis in Progress...</div>;

    return (
        <div className="page-container" style={{maxWidth: '1400px', margin: '0 auto'}}>
            <div className="page-header" style={{marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                    <h1 style={{fontSize: '28px'}}>🏢 HR Control Center</h1>
                    <p className="page-subtitle">Unified Employee Intelligence & Resource Management Portal</p>
                </div>
                <div style={{display: 'flex', gap: '20px', textAlign: 'right'}}>
                    <div className="hr-ai-badge" style={{height: 'fit-content'}}>AI Compliance Active</div>
                    <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>Last synchronized: {new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            <div className="hr-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                {/* A. Summary Widgets */}
                <div className="hr-card" style={{gridColumn: 'span 2'}}>
                    <div className="hr-insight-title"><span>👥</span> Employee Ecosystem Tracking</div>
                    <div className="hr-table-card">
                        <table className="hr-employee-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Current Task</th>
                                    <th>Workload</th>
                                    <th>Last Active</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>
                                            <div className="emp-info-cell">
                                                <div className="emp-avatar-sm">{emp.name[0].toUpperCase()}</div>
                                                <div>
                                                    <span className="emp-name">{emp.name}</span>
                                                    <span className="emp-role" style={{fontSize: '11px', color: 'var(--accent)'}}>{emp.role} • {emp.team}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{fontSize: '13px', color: 'var(--text-secondary)'}}>
                                            {emp.currentTask}
                                        </td>
                                        <td>
                                            <div className="workload-bar-container">
                                                <div 
                                                    className="workload-bar-fill" 
                                                    style={{
                                                        width: `${Math.min(100, emp.workload)}%`,
                                                        background: emp.workload > 80 ? 'var(--red)' : emp.workload > 50 ? 'var(--orange)' : 'var(--green)'
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="workload-msg">{emp.workload}% utilized</span>
                                        </td>
                                        <td style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                                            {emp.lastActive ? new Date(emp.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Inactive'}
                                        </td>
                                        <td>
                                            <span className={`activity-status ${emp.status === 'Active' ? 'Optimal' : 'Engagement'}`} style={{fontSize: '10px'}}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="hr-action-btn" onClick={() => handlePromoteClick(emp)}>Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* B. AI Predictive Analytics & Alerts */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div className="hr-card">
                        <div className="hr-insight-title"><span>📈</span> Sprint Health Prediction</div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                            <SVGPieChart successPercent={predictions.sprintSuccessProb || 0} />
                            <div>
                                <h3 style={{fontSize: '24px'}}>{predictions.sprintSuccessProb}%</h3>
                                <p style={{fontSize: '12px', color: 'var(--text-muted)'}}>Historical Success Probability</p>
                                <div style={{marginTop: '10px', fontSize: '11px', color: predictions.projectDelayRisk > 30 ? 'var(--red)' : 'var(--green)'}}>
                                    ● Risk Level: {predictions.projectDelayRisk > 30 ? 'Elevated' : 'Stable'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hr-card" style={{flex: 1}}>
                        <div className="hr-insight-title"><span>🔊</span> AI Smart Risk Alerts</div>
                        <div className="hr-alert-feed">
                            {alerts.slice(0, 4).map((a, i) => (
                                <div key={i} className={`hr-alert-item ${a.severity}`}>
                                    <div className="hr-alert-msg" style={{fontSize: '12px'}}>{a.message}</div>
                                    <div className="hr-alert-meta">
                                        <span>AI Certainty: {a.probability}</span>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && <p className="empty-state">No critical risks in current sprint cycle.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="hr-grid" style={{marginTop: '20px', gridTemplateColumns: '1fr 2fr'}}>
                {/* C. Attendance & Work Patterns */}
                <div className="hr-card">
                    <div className="hr-insight-title"><span>🕒</span> Workforce Engagement</div>
                    <div className="hr-activity-list">
                        {attendance.map(a => (
                            <div key={a.username} className="activity-chip" style={{padding: '12px'}}>
                                <div>
                                    <div className="activity-name">{a.username}</div>
                                    <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>{a.avgHours} hrs/avg session</div>
                                </div>
                                <span className={`activity-status ${a.profile === 'Burnout Risk' ? 'Burnout' : 'Optimal'}`}>
                                    {a.profile}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* D. Role Management Panel (Promotion History) */}
                <div className="hr-card">
                    <div className="hr-insight-title"><span>🏅</span> Historical Performance & Role Evolution</div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px'}}>
                        {employees.filter(e => e.roleHistory?.length > 0).map(emp => (
                            <div key={emp.id} style={{padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                                    <span style={{fontWeight: 700, fontSize: '14px'}}>{emp.name}</span>
                                    <span style={{color: 'var(--gold)', fontSize: '12px'}}>★ Star Player</span>
                                </div>
                                <div style={{fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px'}}>Role History:</div>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                                    {emp.roleHistory.map((h, i) => (
                                        <span key={i} className="role-history-tag">{h.role} ({h.team})</span>
                                    ))}
                                    <span className="role-history-tag" style={{borderColor: 'var(--accent)', color: 'var(--accent)'}}>{emp.role}</span>
                                </div>
                            </div>
                        ))}
                        {employees.filter(e => e.roleHistory?.length > 0).length === 0 && (
                            <div className="empty-state" style={{gridColumn: 'span 2', padding: '40px'}}>
                                No role transitions recorded yet. Use "Manage" to promote employees.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TL Management Section */}
            <div className="hr-grid" style={{marginTop: '20px', gridTemplateColumns: '1fr'}}>
                <div className="hr-card">
                    <div className="hr-insight-title" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span>🛡️ Team Leaders Management</span>
                        <button className="login-btn" style={{width: 'auto', padding: '6px 15px', fontSize: '12px'}} onClick={() => setIsTlModalOpen(true)}>+ Add New TL</button>
                    </div>
                    <div className="hr-table-card">
                        <table className="hr-employee-table">
                            <thead>
                                <tr>
                                    <th>Team Leader</th>
                                    <th>Assigned Squad/Team</th>
                                    <th>Active Tasks Assigned</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tls.map(tl => (
                                    <tr key={tl.id}>
                                        <td>
                                            <div className="emp-info-cell">
                                                <div className="emp-avatar-sm" style={{background: 'var(--accent)'}}>{tl.username[0].toUpperCase()}</div>
                                                <div>
                                                    <span className="emp-name">{tl.username}</span>
                                                    <span className="emp-role" style={{fontSize: '11px', color: 'var(--text-muted)'}}>{tl.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                defaultValue={tl.team} 
                                                onBlur={(e) => { if (e.target.value !== tl.team) handleAssignTeamToTl(e, tl.id, e.target.value) }}
                                                style={{padding: '5px 10px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff'}}
                                                placeholder="e.g. Frontend"
                                            />
                                        </td>
                                        <td><span className="activity-status Optimal" style={{background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)'}}>{tl.activeTasks} Tasks</span></td>
                                        <td>
                                            <div style={{display: 'flex', gap: '10px'}}>
                                                <button className="login-btn" style={{width: 'auto', padding: '5px 10px', fontSize: '11px'}} onClick={() => openTlTaskModal(tl)}>Assign Task</button>
                                                <button className="btn-primary-ghost" style={{width: 'auto', padding: '5px 10px', fontSize: '11px', color: 'var(--red)', borderColor: 'var(--red)'}} onClick={() => handleDeleteTl(tl.id)}>Remove</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tls.length === 0 && <tr><td colSpan="4" className="empty-state">No Team Leaders configured.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Promotion & Manage Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{maxWidth: '500px'}}>
                        <div className="modal-header">
                            <h2>Promote / Manage: {editingMember?.name}</h2>
                            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateMember}>
                            <div className="edit-modal-content">
                                <div className="form-group">
                                    <label>Current Role</label>
                                    <input 
                                        type="text" 
                                        value={editForm.role} 
                                        onChange={e => setEditForm({...editForm, role: e.target.value})}
                                        placeholder="e.g. Senior Backend Engineer"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Squad / Team</label>
                                    <select 
                                        value={editForm.team} 
                                        onChange={e => setEditForm({...editForm, team: e.target.value})}
                                        style={{width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)'}}
                                    >
                                        <option value="Frontend">Frontend Squad</option>
                                        <option value="Backend">Backend Squad</option>
                                        <option value="Platform">Platform & Infra</option>
                                        <option value="Product">Product & UX</option>
                                        <option value="QA">Quality Assurance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Employment Status</label>
                                    <select 
                                        value={editForm.status} 
                                        onChange={e => setEditForm({...editForm, status: e.target.value})}
                                        style={{width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)'}}
                                    >
                                        <option value="Active">Active / On Duty</option>
                                        <option value="Inactive">On Leave / Vacation</option>
                                        <option value="Terminated">Former Employee</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer" style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button type="button" className="btn-primary-ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 24px'}}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create TL Modal */}
            {isTlModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{maxWidth: '500px'}}>
                        <div className="modal-header">
                            <h2>Create new Team Leader Account</h2>
                            <button className="modal-close" onClick={() => setIsTlModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateTl}>
                            <div className="edit-modal-content">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input type="text" required value={tlForm.username} onChange={e => setTlForm({...tlForm, username: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={tlForm.email} onChange={e => setTlForm({...tlForm, email: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Assigned Team/Squad</label>
                                    <input type="text" placeholder="e.g. Frontend Squad" required value={tlForm.team} onChange={e => setTlForm({...tlForm, team: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Temporary Password</label>
                                    <input type="text" value={tlForm.password} onChange={e => setTlForm({...tlForm, password: e.target.value})} />
                                </div>
                            </div>
                            <div className="modal-footer" style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button type="button" className="btn-primary-ghost" onClick={() => setIsTlModalOpen(false)}>Cancel</button>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 24px'}}>Create TL</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Task to TL Modal */}
            {isTlTaskModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{maxWidth: '500px'}}>
                        <div className="modal-header">
                            <h2>Assign Task to TL: {selectedTl?.username}</h2>
                            <button className="modal-close" onClick={() => setIsTlTaskModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAssignTlTask}>
                            <div className="edit-modal-content">
                                <div className="form-group">
                                    <label>Task Title</label>
                                    <input type="text" required value={tlTaskForm.title} onChange={e => setTlTaskForm({...tlTaskForm, title: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input type="datetime-local" required value={tlTaskForm.deadline} onChange={e => setTlTaskForm({...tlTaskForm, deadline: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={tlTaskForm.priority} onChange={e => setTlTaskForm({...tlTaskForm, priority: e.target.value})} style={{width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)'}}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer" style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button type="button" className="btn-primary-ghost" onClick={() => setIsTlTaskModalOpen(false)}>Cancel</button>
                                <button type="submit" className="login-btn" style={{width: 'auto', padding: '10px 24px'}}>Assign Task to TL</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HRDashboard;
