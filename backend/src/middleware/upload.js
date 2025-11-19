// src/middleware/upload.js
const multer = require('multer');

// memory storage (small files ok). For large files consider presigned uploads.
const storage = multer.memoryStorage();
const limits = {
  fileSize: 200 * 1024 * 1024, // 200MB - adjust as needed
};

module.exports = multer({ storage, limits });
