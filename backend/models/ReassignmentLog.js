const mongoose = require('mongoose');

const ReassignmentLogSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    taskTitle: String,
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' },
    reason: { type: String, default: 'Employee on leave' },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReassignmentLog', ReassignmentLogSchema);
