import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'Employee' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const res = await axios.post(endpoint, formData);
            onLogin(res.data.token, res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">🚀</div>
                    <h1>ProManage</h1>
                    <p>{isRegister ? 'Create your account' : 'Welcome back, sign in to continue'}</p>
                </div>

                <div className="login-form">
                    <h2>{isRegister ? 'Sign Up' : 'Sign In'}</h2>
                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {isRegister && (
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {isRegister && (
                            <div className="form-group">
                                <label>Role</label>
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleChange}
                                    className="role-selector"
                                    style={{ width: '100%', padding: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', marginBottom: '15px' }}
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="TL">Team Leader (TL)</option>
                                    <option value="HR">HR Specialist</option>
                                </select>
                            </div>
                        )}

                        <button className="login-btn" type="submit" disabled={loading}>
                            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
                        </button>
                    </form>

                    <div className="toggle-auth">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
