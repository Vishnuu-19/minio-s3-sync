// src/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes (require after app created)
const uploadRoutes = require('./routes/upload.routes');
const fileRoutes = require('./routes/file.routes');
const authRoutes = require('./routes/auth.routes');

app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/files', fileRoutes);

// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
