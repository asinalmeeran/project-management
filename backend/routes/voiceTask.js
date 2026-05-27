const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// ─── Priority keywords mapped to priority levels (Tamil + English) ────────
const PRIORITY_RULES = [
    { keywords: ['client', 'customer', 'delivery', 'deploy', 'production', 'launch', 'demo', 'pitch', 'investor', 'urgent', 'critical', 'hotfix', 'உயர்ந்த', 'முக்கியம்', 'அவசரம்'], priority: 'high' },
    { keywords: ['bug', 'error', 'crash', 'fix', 'broken', 'பிழை', 'சரிசெய்'], priority: 'high' },
    { keywords: ['meeting', 'review', 'discussion', 'sync', 'standup', 'planning', 'sprint', 'நடுத்தர', 'ஆலோசனை'], priority: 'medium' },
    { keywords: ['update', 'modify', 'change', 'implement', 'develop', 'build', 'code', 'feature', 'integrate', 'அம்சம்'], priority: 'medium' },
    { keywords: ['test', 'qa', 'check', 'verify', 'validate', 'சோதனை'], priority: 'medium' },
    { keywords: ['learn', 'study', 'explore', 'research', 'experiment', 'tutorial', 'குறைந்த', 'ஆராய்ச்சி'], priority: 'low' },
    { keywords: ['improve', 'refactor', 'optimize', 'cleanup', 'enhance', 'optional', 'மேம்படுத்து'], priority: 'low' },
    { keywords: ['documentation', 'docs', 'readme', 'comment', 'ஆவணம்'], priority: 'low' }
];

// ─── Task Type mapping (Tamil + English) ──────────────────────────────────
const TYPE_RULES = [
    { keywords: ['bug', 'fix', 'error', 'crash', 'issue', 'repair', 'broken', 'problem', 'பிழை', 'கோளாறு'], type: 'bug' },
    { keywords: ['feature', 'new', 'add', 'create', 'build', 'implement', 'அம்சம்', 'புதிய'], type: 'feature' },
    { keywords: ['task', 'work', 'job', 'do', 'generic', 'பணி', 'வேலை'], type: 'task' }
];

// ─── Deadline rules based on keywords (Tamil + English) ───────────────────
const DEADLINE_KEYWORDS = [
    { keywords: ['tomorrow', 'next day', 'நாளை'], daysOffset: 1 },
    { keywords: ['next week', 'next Monday', 'அடுத்த வாரம்'], daysOffset: 7 },
    { keywords: ['today', 'tonight', 'இன்று', 'இப்போதே'], daysOffset: 0 }
];

const DEADLINE_RULES = [
    { keywords: ['meeting', 'demo', 'presentation', 'pitch', 'standup', 'sync'], daysOffset: 1 },
    { keywords: ['submission', 'deliver', 'delivery', 'deploy', 'launch', 'release', 'deadline', 'due'], daysOffset: 1 },
    { keywords: ['bug', 'fix', 'critical', 'urgent', 'security', 'பிழை', 'அவசரம்'], daysOffset: 1 },
    { keywords: ['qa', 'test', 'verify', 'review'], daysOffset: 2 },
    { keywords: ['develop', 'build', 'implement', 'code', 'feature', 'design', 'அம்சம்'], daysOffset: 4 },
    { keywords: ['plan', 'research', 'design', 'prototype'], daysOffset: 5 },
    { keywords: ['learn', 'tutorial', 'docs', 'improve', 'optimize'], daysOffset: 10 }
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function getWorkingDayDate(daysOffset) {
    const date = new Date();
    let added = 0;
    while (added < daysOffset) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) added++;
    }
    date.setHours(18, 0, 0, 0);
    return date;
}

function predictPriority(text) {
    const lower = text.toLowerCase();
    let bestPriority = 'medium';
    let bestScore = 0;
    for (const rule of PRIORITY_RULES) {
        let score = 0;
        for (const kw of rule.keywords) if (lower.includes(kw)) score += kw.length;
        if (score > bestScore) { bestScore = score; bestPriority = rule.priority; }
    }
    return bestPriority;
}

function predictType(text) {
    const lower = text.toLowerCase();
    let bestType = 'task';
    let bestScore = 0;
    for (const rule of TYPE_RULES) {
        let score = 0;
        for (const kw of rule.keywords) if (lower.includes(kw)) score += kw.length;
        if (score > bestScore) { bestScore = score; bestType = rule.type; }
    }
    return bestType;
}

function predictDeadline(text) {
    const lower = text.toLowerCase();
    // 1. Check direct keywords (tomorrow, next week)
    for (const rule of DEADLINE_KEYWORDS) {
        for (const kw of rule.keywords) if (lower.includes(kw)) return getWorkingDayDate(rule.daysOffset);
    }
    // 2. Fallback to task nature
    let bestOffset = 3;
    let bestScore = 0;
    for (const rule of DEADLINE_RULES) {
        let score = 0;
        for (const kw of rule.keywords) if (lower.includes(kw)) score += kw.length;
        if (score > bestScore) { bestScore = score; bestOffset = rule.daysOffset; }
    }
    return getWorkingDayDate(bestOffset);
}

function generateTitle(text) {
    const cleaned = text.trim().replace(/\s+/g, ' ');
    const words = cleaned.split(' ');
    if (words.length <= 6) return capitalize(cleaned);

    const filterWords = ['i', 'need', 'to', 'want', 'please', 'can', 'you', 'we', 'should', 'must', 'புதிய', 'பணி', 'வேலை', 'பிழை'];
    let startIdx = 0;
    for (let i = 0; i < Math.min(words.length, 5); i++) {
        if (!filterWords.includes(words[i].toLowerCase())) { startIdx = i; break; }
    }
    const meaningful = words.slice(startIdx, startIdx + 7).join(' ');
    return capitalize(meaningful.replace(/\s+(and|or|but|with|for|from|to|in|on|at|by)\s*$/i, ''));
}

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── POST /api/voice-task/parse ────────────────────────────────────────────
router.post('/parse', async (req, res) => {
    try {
        const { text, userId } = req.body;

        // 1. Noise Filter: Ignore unclear or very short inputs
        if (!text || text.trim().length < 8) {
            return res.status(400).json({ message: 'Voice input too short or unclear. Please elaborate.' });
        }

        // 2. AI Parsing
        const priority = predictPriority(text);
        const type = predictType(text);
        const deadline = predictDeadline(text);
        const title = generateTitle(text);
        
        // 3. Duplicate Prevention (Simple check)
        const existing = await Task.findOne({ title, status: 'todo' });
        if (existing) {
            return res.status(409).json({ message: 'Similar task already exists in Todo list.' });
        }

        // 4. Automatic Creation
        const newTask = new Task({
            title,
            description: `Auto-generated from voice: "${text.trim()}"`,
            priority,
            deadline: deadline.toISOString(),
            status: 'todo',
            assignedTo: userId || null,
            estimatedTime: priority === 'high' ? 4 : priority === 'medium' ? 8 : 12
        });

        await newTask.save();

        res.status(201).json({
            message: 'Task Created Successfully',
            task: newTask,
            parsed: { title, priority, type, deadline: deadline.toISOString() }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
