// src/routes/file.routes.js
const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/upload');
const { updateFile, getFile, listFiles, getS3DownloadUrl, replicateNow, deleteFile } = require('../controllers/file.controller');
const auth = require('../middleware/auth');

router.get('/', auth, listFiles);
router.get('/:id', auth, getFile);
router.put('/:id', auth, uploadMiddleware.single('file'), updateFile);
router.get('/:id/download', auth, getS3DownloadUrl);
router.post('/:id/replicate',auth,replicateNow);
router.delete('/:id', auth, deleteFile);

module.exports = router;
