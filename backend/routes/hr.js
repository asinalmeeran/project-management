const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const UserSession = require('../models/UserSession');
const ReassignmentLog = require('../models/ReassignmentLog');
const User = require('../models/User');

// ─── helpers for analysis ──────────────────────────────────────────────────
const calculateScore = (member, tasks) => {
    const memberTasks = tasks.filter(t => t.assignedTo?.toString() === member._id.toString());
    if (memberTasks.length === 0) return 0;

    const completed = memberTasks.filter(t => t.status === 'completed');
    const buggy = memberTasks.filter(t => t.isBugFix);
    const overdue = memberTasks.filter(t => t.status === 'due');

    // Score components
    const completionRate = (completed.length / memberTasks.length) * 40; // max 40
    const qualityRate = (1 - (buggy.length / memberTasks.length)) * 30; // max 30
    const punctualityRate = (1 - (overdue.length / memberTasks.length)) * 30; // max 30

    return Math.round(completionRate + qualityRate + punctualityRate);
};

// ─── 1. AI Employee Activity Intelligence ──────────────────────────────────
router.get('/intelligence', async (req, res) => {
    try {
        const members = await TeamMember.find();
        const tasks = await Task.find();

        const analysis = members.map(m => {
            const mTasks = tasks.filter(t => t.assignedTo?.toString() === m._id.toString());
            const ongoing = mTasks.filter(t => t.status === 'ongoing');
            
            let status = 'Optimal';
            if (ongoing.length > 3) status = 'Overloaded';
            else if (ongoing.length === 0 && mTasks.length > 0) status = 'Idle/Stuck';
            else if (mTasks.length === 0) status = 'Unassigned';

            return {
                id: m._id,
                name: m.name,
                status,
                taskCount: mTasks.length,
                ongoingCount: ongoing.length,
                recommendation: status === 'Overloaded' ? 'Reassign tasks' : status === 'Idle/Stuck' ? 'Review capacity' : 'Keep current'
            };
        });

        res.json(analysis);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 2. AI Promotion & Role Recommendation ──────────────────────────────────
router.get('/recommendations', async (req, res) => {
    try {
        const members = await TeamMember.find();
        const tasks = await Task.find();

        const recommendations = members.map(m => {
            const score = calculateScore(m, tasks);
            const mTasks = tasks.filter(t => t.assignedTo?.toString() === m._id.toString());
            const completed = mTasks.filter(t => t.status === 'completed');

            let recommendation = 'No Change';
            let justification = 'Maintain current performance levels.';

            if (score > 85 && completed.length > 10) {
                recommendation = 'Promotion Candidate';
                justification = `Exceptional efficiency (${score}%) and high quality output. Ready for Lead role.`;
            } else if (score > 70 && m.currentTaskCount > 3) {
                recommendation = 'Senior Role Upgrade';
                justification = 'Consistent delivery under high load. Suggest mentoring responsibilities.';
            }

            return { id: m._id, name: m.name, score, recommendation, justification };
        }).filter(r => r.recommendation !== 'No Change');

        res.json(recommendations);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 3. AI Attendance & Work Pattern ───────────────────────────────────────
router.get('/attendance', async (req, res) => {
    try {
        const sessions = await UserSession.find();
        const users = [...new Set(sessions.map(s => s.username))];

        const patterns = users.map(username => {
            const uSessions = sessions.filter(s => s.username === username);
            const totalMs = uSessions.reduce((acc, s) => acc + (s.endTime ? (s.endTime - s.startTime) : (Date.now() - s.startTime)), 0);
            const avgSessionLength = totalMs / uSessions.length;

            let profile = 'Healthy';
            if (avgSessionLength > 10 * 60 * 60 * 1000) profile = 'Burnout Risk';
            else if (avgSessionLength < 2 * 60 * 60 * 1000) profile = 'Low Engagement';

            return {
                username,
                avgHours: (avgSessionLength / (1000 * 60 * 60)).toFixed(1),
                consistency: (uSessions.length > 5 ? 'High' : 'Moderate'),
                profile
            };
        });

        res.json(patterns);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 4. AI Smart Alerts ─────────────────────────────────────────────────────
router.get('/alerts', async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedTo');
        const now = new Date();
        const alerts = [];

        // 1. Critical: Approaching Deadline + High Risk
        tasks.filter(t => t.status === 'ongoing' && new Date(t.deadline) < new Date(now.getTime() + 2 * 60 * 60 * 1000))
            .forEach(t => {
                alerts.push({
                    severity: 'Critical',
                    message: `Task "${t.title}" may miss deadline (within 2h).`,
                    probability: '92%'
                });
            });

        // 2. Warning: Over-utilized members
        const members = await TeamMember.find();
        members.filter(m => m.currentTaskCount > 4).forEach(m => {
            alerts.push({
                severity: 'Warning',
                message: `${m.name} is over-utilized for 5+ consecutive tasks.`,
                probability: '85%'
            });
        });

        // 3. Info: Resource suggestions
        const projects = [...new Set(tasks.map(t => t.project))];
        // 4. Critical: Tasks at risk (failed reassignment)
        tasks.filter(t => t.isAtRisk).forEach(t => {
            alerts.push({
                severity: 'Critical',
                message: `Task "${t.title}" is AT RISK. No available replacements found during leave.`,
                probability: '100%'
            });
        });

        res.json(alerts);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 5. Predictive Analytics ────────────────────────────────────────────────
router.get('/predictions', async (req, res) => {
    try {
        const tasks = await Task.find();
        const completed = tasks.filter(t => t.status === 'completed').length;
        const total = tasks.length || 1;
        const successProb = Math.round((completed / total) * 100);

        res.json({
            sprintSuccessProb: successProb,
            projectDelayRisk: 100 - successProb,
            productivityTrend: [65, 78, 72, successProb] // Mock trend data
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 6. Detailed Employee List for HR Tracking ──────────────────────────
router.get('/employees', async (req, res) => {
    try {
        const members = await TeamMember.find();
        const tasks = await Task.find();

        const employeeList = members.map(m => {
            const mTasks = tasks.filter(t => t.assignedTo?.toString() === m._id.toString());
            const currentTask = mTasks.find(t => t.status === 'ongoing') || mTasks.find(t => t.status === 'todo') || null;
            
            const workload = Math.round((mTasks.filter(t => t.status !== 'completed').length / (m.maxTasks || 5)) * 100);

            return {
                id: m._id,
                name: m.name,
                email: m.email,
                role: m.role,
                team: m.team,
                currentTask: currentTask ? currentTask.title : 'No active task',
                status: m.status,
                lastActive: m.lastActive,
                workload,
                roleHistory: m.roleHistory || []
            };
        });

        res.json(employeeList);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 7. Update Employee Role & Team (HR Action) ─────────────────────────
router.put('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, team, status } = req.body;
        
        const member = await TeamMember.findById(id);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Save history if role or team changes
        if (role !== member.role || team !== member.team) {
            member.roleHistory.push({
                role: member.role,
                team: member.team,
                startDate: member.createdAt // Approximation for old role start
            });
        }

        member.role = role || member.role;
        member.team = team || member.team;
        member.status = status || member.status;
        
        await member.save();
        res.json(member);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 8. AI Reassignment Logs ──────────────────────────────────────────
router.get('/reassignment-logs', async (req, res) => {
    try {
        const logs = await ReassignmentLog.find()
            .populate('fromUserId', 'name')
            .populate('toUserId', 'name')
            .sort({ timestamp: -1 })
            .limit(20);
        res.json(logs);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 9. Get all TL users ─────────────────────────────────────────────────
router.get('/tls', async (req, res) => {
    try {
        const tls = await User.find({ role: 'TL' }).select('-password');
        const tasks = await Task.find();
        const tlList = tls.map(tl => {
            const tlTasks = tasks.filter(t => t.assignedToUser?.toString() === tl._id.toString());
            return {
                id: tl._id,
                username: tl.username,
                email: tl.email,
                team: tl.team,
                activeTasks: tlTasks.filter(t => t.status !== 'completed').length
            };
        });
        res.json(tlList);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 10. Add a new TL user ───────────────────────────────────────────────
router.post('/tls', async (req, res) => {
    try {
        const { username, email, password, team } = req.body;
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password || 'tl@1234', 10);
        const tl = new User({ username, email, password: hashedPassword, role: 'TL', team: team || '' });
        await tl.save();
        res.status(201).json({ id: tl._id, username: tl.username, email: tl.email, team: tl.team });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 11. Delete a TL user ────────────────────────────────────────────────
router.delete('/tls/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'TL deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 12. Assign TL to a team ─────────────────────────────────────────────
router.put('/tls/:id/assign-team', async (req, res) => {
    try {
        const { team } = req.body;
        const tl = await User.findByIdAndUpdate(req.params.id, { team }, { new: true }).select('-password');
        if (!tl) return res.status(404).json({ message: 'TL not found' });
        res.json(tl);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 13. Assign a task to a TL (stored with assignedToUser) ─────────────
router.post('/tls/:id/assign-task', async (req, res) => {
    try {
        const { title, description, deadline, priority } = req.body;
        const tl = await User.findById(req.params.id);
        if (!tl) return res.status(404).json({ message: 'TL not found' });
        const task = new Task({
            title,
            description,
            deadline,
            priority: priority || 'medium',
            assignedToUser: req.params.id,
            status: 'todo'
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── 14. Get tasks assigned to a TL ─────────────────────────────────────
router.get('/tls/:id/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({ assignedToUser: req.params.id });
        res.json(tasks);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
