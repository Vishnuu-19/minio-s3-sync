// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email+password required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'email already used' });

  const user = new User({ email, name });
  await user.setPassword(password);
  await user.save();

  const token = jwt.sign({ sub: user._id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await user.validatePassword(password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = jwt.sign({ sub: user._id, email: user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
}

module.exports = { register, login };
