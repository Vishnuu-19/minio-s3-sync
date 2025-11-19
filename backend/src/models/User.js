// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: String,
}, { timestamps: true });

// helper to set password
UserSchema.methods.setPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

UserSchema.methods.validatePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
