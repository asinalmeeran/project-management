const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSession = require('../models/UserSession');

const JWT_SECRET = process.env.JWT_SECRET || 'project_mgmt_secret_key_2024';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, role: role || 'Employee' });
        await user.save();

        // Create initial session
        const session = new UserSession({ userId: user._id, username: user.username });
        await session.save();

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, user: { 
            id: user._id, username: user.username, email: user.email,
            role: user.role, bio: user.bio, skills: user.skills, 
            experience: user.experience, linkedin: user.linkedin 
        } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        
        // Create new session on login
        const session = new UserSession({ userId: user._id, username: user.username });
        await session.save();

        res.json({ token, user: { 
            id: user._id, username: user.username, email: user.email,
            role: user.role, bio: user.bio, skills: user.skills, 
            experience: user.experience, linkedin: user.linkedin 
        } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Profile
router.put('/profile', async (req, res) => {
    try {
        const { username, email, role, bio, skills, experience, linkedin } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { username, role, bio, skills, experience, linkedin },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
