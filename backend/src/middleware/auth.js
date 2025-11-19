// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user; // attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
