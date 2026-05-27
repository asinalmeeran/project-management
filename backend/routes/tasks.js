const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');

// ─── Helper: Predict best team‑member ──────────────────────────────────
function predictAssignment(members, requiredQualities) {
    if (!members.length) return null;

    return members
        .map(m => {
            // quality match score: how many required qualities does this member have?
            const qualityMatch = requiredQualities.filter(q =>
                m.qualities.map(mq => mq.toLowerCase()).includes(q.toLowerCase())
            ).length;
            const qualityScore = requiredQualities.length ? (qualityMatch / requiredQualities.length) * 100 : 50;

            // capacity score: prefer members with more free capacity
            const capacityScore = m.maxTasks > 0
                ? ((m.maxTasks - m.currentTaskCount) / m.maxTasks) * 100
                : 0;

            const totalScore = qualityScore * 0.6 + capacityScore * 0.4;
            return { member: m, totalScore, qualityScore, capacityScore };
        })
        .sort((a, b) => b.totalScore - a.totalScore)[0];
}

// ─── Helper: Predict priority from deadline ────────────────────────────
function predictPriority(deadline) {
    const hoursLeft = (new Date(deadline) - new Date()) / (1000 * 60 * 60);
    if (hoursLeft <= 6) return 'critical';
    if (hoursLeft <= 24) return 'high';
    if (hoursLeft <= 72) return 'medium';
    return 'low';
}

// ─── Get all tasks ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedTo').sort({ deadline: 1 });
        res.json(tasks);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Get single task (sub‑page) ────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('assignedTo');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Create task with auto‑prediction ──────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { title, description, deadline, estimatedTime, requiredQualities, assignedTo } = req.body;

        // Auto-predict priority
        const priority = predictPriority(deadline);

        let assignedMemberId = assignedTo || null;

        // Auto-predict team member if none specified
        if (!assignedMemberId && requiredQualities && requiredQualities.length) {
            const members = await TeamMember.find();
            const best = predictAssignment(members, requiredQualities);
            if (best) assignedMemberId = best.member._id;
        }

        const task = new Task({
            title, description, deadline, estimatedTime,
            priority, requiredQualities: requiredQualities || [],
            assignedTo: assignedMemberId,
            status: 'todo'
        });
        await task.save();

        // Increment the member's current task count
        if (assignedMemberId) {
            await TeamMember.findByIdAndUpdate(assignedMemberId, { $inc: { currentTaskCount: 1 } });
        }

        const populated = await Task.findById(task._id).populate('assignedTo');
        res.status(201).json(populated);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Update task status ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Delete task ───────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        if (task.assignedTo) {
            await TeamMember.findByIdAndUpdate(task.assignedTo, { $inc: { currentTaskCount: -1 } });
        }
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Prediction endpoint (for the sub‑page) ───────────────────────────
router.post('/predict', async (req, res) => {
    try {
        const { deadline, requiredQualities } = req.body;
        const priority = predictPriority(deadline);
        const members = await TeamMember.find();
        const best = predictAssignment(members, requiredQualities || []);
        res.json({
            predictedPriority: priority,
            predictedMember: best ? {
                member: best.member,
                qualityScore: Math.round(best.qualityScore),
                capacityScore: Math.round(best.capacityScore),
                totalScore: Math.round(best.totalScore)
            } : null,
            allScores: members.map(m => {
                const result = predictAssignment([m], requiredQualities || []);
                return { member: m, score: result ? Math.round(result.totalScore) : 0 };
            }).sort((a, b) => b.score - a.score)
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
