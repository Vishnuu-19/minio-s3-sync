const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err);
    throw err;
  }
}

module.exports = {
  connectDB,
};
