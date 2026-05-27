const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    qualities: [{ type: String }],          // e.g. ["frontend", "design", "testing"]
    capacity: { type: Number, default: 100 }, // percentage available (0-100)
    currentTaskCount: { type: Number, default: 0 },
    maxTasks: { type: Number, default: 5 },
    role:     { type: String, default: 'Developer' },
    team:     { type: String, default: 'General' },
    status:   { type: String, default: 'Active' },
    lastActive: { type: Date, default: Date.now },
    roleHistory: [{
        role: String,
        team: String,
        startDate: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
