require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/team', require('./routes/team'));
app.use('/api/status', require('./routes/status'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/voice-task', require('./routes/voiceTask'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/hr', require('./routes/hr'));

// ─── Cron Job: check every minute for upcoming deadlines ───────────────
const Task = require('./models/Task');
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        // Mark tasks as due whose deadline has passed
        await Task.updateMany(
            { status: { $in: ['todo', 'ongoing'] }, deadline: { $lt: now } },
            { $set: { status: 'due' } }
        );

        // Find tasks within 1 hour of deadline that haven't been notified
        const upcoming = await Task.find({
            status: { $in: ['todo', 'ongoing'] },
            deadline: { $lte: oneHourLater, $gte: now },
            notified: false
        });

        if (upcoming.length > 0) {
            console.log(`🔔 ${upcoming.length} task(s) approaching deadline within 1 hour`);
            // Mark them as notified (frontend will poll /api/status/notifications)
            await Task.updateMany(
                { _id: { $in: upcoming.map(t => t._id) } },
                { $set: { notified: true } }
            );
        }
    } catch (err) {
        console.error('Cron error:', err);
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'Project Management API is running' });
});

// Connect to MongoDB Atlas and start server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Atlas connected successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
