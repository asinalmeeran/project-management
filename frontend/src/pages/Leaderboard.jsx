import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Leaderboard() {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankings();
        // Polling for real-time feel
        const interval = setInterval(fetchRankings, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchRankings = async () => {
        try {
            const res = await axios.get('/api/rankings');
            
            // 1. Sort by points (highest first)
            const sorted = res.data.sort((a, b) => b.points - a.points);
            
            // 2. Assign ranks dynamically, handling ties
            let currentRank = 1;
            const ranked = sorted.map((item, idx, arr) => {
                if (idx > 0 && item.points < arr[idx - 1].points) {
                    currentRank = idx + 1;
                }
                return { ...item, rank: currentRank };
            });

            setRankings(ranked);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading rankings...</div>;

    // Get top 3 separately for special cards
    const topThree = rankings.filter(r => r.rank <= 3).slice(0, 3);
    const podiumOrder = [
        rankings.find(r => r.rank === 2) || { username: '---', points: 0, rank: 2, icon: '🥈' },
        rankings.find(r => r.rank === 1) || { username: '---', points: 0, rank: 1, icon: '🥇' },
        rankings.find(r => r.rank === 3) || { username: '---', points: 0, rank: 3, icon: '🥉' }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Leaderboard</h1>
                    <p className="page-subtitle">Recognizing top performers in project completion and efficiency.</p>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Auto-updates every 10s
                </div>
            </div>

            {/* Top 3 Podium Highlights */}
            <div className="podium-section">
                <div className="podium">
                    {podiumOrder.map((member, idx) => {
                        const isWinner = member.rank === 1;
                        const medal = member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : '🥉';
                        const medalClass = member.rank === 1 ? 'gold' : member.rank === 2 ? 'silver' : 'bronze';
                        
                        return (
                            <div key={idx} className={`podium-item ${medalClass}`}>
                                {isWinner && <span className="podium-crown" style={{fontSize: '32px'}}>👑</span>}
                                <div className={`podium-avatar ${isWinner ? 'gold-avatar' : ''}`} style={{
                                    width: isWinner ? '80px' : '64px',
                                    height: isWinner ? '80px' : '64px',
                                    fontSize: isWinner ? '28px' : '20px',
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    {member.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="podium-name" style={{fontSize: isWinner ? '18px' : '14px'}}>{member.username}</span>
                                <span className="podium-points">{member.points} pts</span>
                                <div className={`podium-block ${medalClass}-block`} style={{
                                    height: isWinner ? '100px' : member.rank === 2 ? '70px' : '50px'
                                }}>
                                    {medal} Rank #{member.rank}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* List View */}
            <div className="rankings-table-section">
                <h2>Leaderboard Standings</h2>
                <div className="table-wrapper">
                    <table className="rankings-table">
                        <thead>
                            <tr>
                                <th style={{textAlign: 'center'}}>Rank</th>
                                <th>Participant</th>
                                <th>Score</th>
                                <th>Completed</th>
                                <th>Efficiency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((member) => (
                                <tr key={member._id} className={member.rank <= 3 ? `rank-${['gold', 'silver', 'bronze'][member.rank-1]}` : ''}>
                                    <td className="rank-cell">
                                        <span className="rank-badge" style={{
                                            padding: '4px 8px', borderRadius: '4px',
                                            display: 'inline-block', minWidth: '40px',
                                            fontWeight: 700,
                                            background: member.rank === 1 ? 'rgba(251,191,36,0.2)' : 
                                                        member.rank === 2 ? 'rgba(148,163,184,0.2)' : 
                                                        member.rank === 3 ? 'rgba(217,119,6,0.2)' : 'transparent'
                                        }}>
                                            {member.rank === 1 ? '🥇 1st' : 
                                             member.rank === 2 ? '🥈 2nd' : 
                                             member.rank === 3 ? '🥉 3rd' : 
                                             `#${member.rank}`}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="name-cell">
                                            <div className="rank-avatar" style={{
                                                background: member.rank === 1 ? 'var(--gold)' : 
                                                            member.rank === 2 ? '#94a3b8' : 
                                                            member.rank === 3 ? '#d97706' : 'var(--accent)'
                                            }}>
                                                {member.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                                <strong>{member.username}</strong>
                                                <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>{member.role || 'Member'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="points-cell" style={{fontSize: '15px'}}><strong>{member.points}</strong></td>
                                    <td>{member.tasksCompleted || 0} tasks</td>
                                    <td>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <div className="breakdown-bar-bg" style={{width: '60px', margin: 0}}>
                                                <div className="breakdown-bar-fill green" style={{width: `${member.efficiency}%`}}></div>
                                            </div>
                                            <span style={{fontSize: '12px'}}>{member.efficiency || 0}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Leaderboard;
