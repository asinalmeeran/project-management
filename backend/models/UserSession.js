const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    lastActive: { type: Date, default: Date.now },
    totalActiveMs: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('UserSession', UserSessionSchema);
