const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'Member' },
  team:     { type: String, default: '' },
  bio:      { type: String, default: '' },
  skills:   [{ type: String }],
  experience:[{ type: String }],
  linkedin: { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
