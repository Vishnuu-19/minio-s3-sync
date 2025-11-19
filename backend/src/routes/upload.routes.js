// src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/upload.controller');
const uploadMiddleware = require('../middleware/upload');

// src/routes/upload.routes.js
const auth = require('../middleware/auth');
router.post('/', auth, uploadMiddleware.single('file'), uploadFile);


module.exports = router;
