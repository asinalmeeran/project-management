const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    project: { type: String, default: 'General' },
    deadline: { type: Date, required: true },
    estimatedTime: { type: Number, required: true }, // in hours
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['todo', 'ongoing', 'completed', 'due'], default: 'todo' },
    isAtRisk: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // for TL/User assignments
    requiredQualities: [{ type: String }],
    notified: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    isBugFix: { type: Boolean, default: false },
    timeline: [{
        action: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
