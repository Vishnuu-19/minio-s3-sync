// src/controllers/upload.controller.js
const { putObject, ensureBucket } = require('../config/minio');
const env = require('../config/env');
const File = require('../models/File');
const { addReplicationJob } = require('../queues/replication.queue');

/**
 * Upload single file (multer memoryStorage used)
 */
async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    // Ensure bucket exists
    await ensureBucket(env.MINIO_BUCKET);

    const minioKey = `users/${req.user._id}/${Date.now()}-${req.file.originalname}`;

    // Upload buffer to MinIO
    await putObject(env.MINIO_BUCKET, minioKey, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype,
    });

    // Save metadata
    const fileDoc = await File.create({
      filename: req.file.originalname,
      minioKey,
      mimeType: req.file.mimetype,
      size: req.file.size,
      owner: req.user._id,
      status: 'stored_in_minio',
    });

    // Decide replicate now or schedule
    const replicateNow = req.body.replicateNow === 'true' || req.body.replicateNow === true;
    if (replicateNow) {
      await addReplicationJob({ fileId: fileDoc._id.toString() });
    } else {
      const delayMs = 24 * 60 * 60 * 1000; // 24 hours
      await addReplicationJob({ fileId: fileDoc._id.toString() }, { delay: delayMs });
      fileDoc.replicateScheduledAt = new Date(Date.now() + delayMs);
      await fileDoc.save();
    }

    return res.json({ ok: true, fileId: fileDoc._id });
  } catch (err) {
    console.error('uploadFile error', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
}

module.exports = {
  uploadFile,
};
