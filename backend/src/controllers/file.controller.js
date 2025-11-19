// src/controllers/file.controller.js
const File = require('../models/File');
const { putObject, ensureBucket, removeObject } = require('../config/minio');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../config/s3');
const env = require('../config/env');
const { addReplicationJob } = require('../queues/replication.queue');

async function getS3DownloadUrl(req, res) {
  const fileId = req.params.id;

  const fileDoc = await File.findById(fileId);
  if (!fileDoc) return res.status(404).json({ error: "File not found" });

  // ensure the logged-in user owns the file
  if (!fileDoc.owner.equals(req.user._id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: fileDoc.s3Key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

  return res.json({ url });
}

/**
 * Replace/update a file by id. Uploads new file to MinIO and enqueues replication.
 */
async function updateFile(req, res) {
  try {
    const { id } = req.params;
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ error: 'File not found' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // Ensure bucket
    await ensureBucket(env.MINIO_BUCKET);

    // Upload new object
    const newKey = `${Date.now()}-${req.file.originalname}`;
    await putObject(env.MINIO_BUCKET, newKey, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype,
    });

    // Optionally remove old object from MinIO (if you want to save space)
    try {
      if (fileDoc.minioKey) {
        await removeObject(env.MINIO_BUCKET, fileDoc.minioKey);
      }
    } catch (e) {
      // not critical — log and continue
      console.warn('Failed to remove old minio object', e.message);
    }

    // Update metadata
    fileDoc.minioKey = newKey;
    fileDoc.filename = req.file.originalname;
    fileDoc.mimeType = req.file.mimetype;
    fileDoc.size = req.file.size;
    fileDoc.status = 'stored_in_minio';
    fileDoc.updatedAt = new Date();
    await fileDoc.save();

    // Enqueue replication immediate or delayed
    const replicateNow = req.body.replicateNow === 'true' || req.body.replicateNow === true;
    if (replicateNow) {
      await addReplicationJob({ fileId: fileDoc._id.toString() });
    } else {
      const delayMs = 24 * 60 * 60 * 1000;
      await addReplicationJob({ fileId: fileDoc._id.toString() }, { delay: delayMs });
      fileDoc.replicateScheduledAt = new Date(Date.now() + delayMs);
      await fileDoc.save();
    }

    return res.json({ ok: true, fileId: fileDoc._id });
  } catch (err) {
    console.error('updateFile error', err);
    return res.status(500).json({ error: 'Update failed' });
  }
}

/**
 * Get metadata for a file
 */
async function getFile(req, res) {
  try {
    const { id } = req.params;
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ error: 'File not found' });
    return res.json({ ok: true, file: fileDoc });
  } catch (err) {
    console.error('getFile error', err);
    return res.status(500).json({ error: 'Failed to fetch file' });
  }
}

/**
 * List files (basic)
 */
async function listFiles(req, res) {
  try {
    const files = await File.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(100);
    return res.json({ ok: true, files });
  } catch (err) {
    console.error('listFiles error', err);
    return res.status(500).json({ error: 'Failed to list files' });
  }
}

async function replicateNow(req, res) {
  try {
    const { id } = req.params;
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ error: 'File not found' });

    // ownership check if you use auth
    if (req.user && fileDoc.owner && !fileDoc.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // enqueue immediate replication
    await addReplicationJob({ fileId: fileDoc._id.toString() }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });

    fileDoc.status = 'replication_queued';
    await fileDoc.save();

    return res.json({ ok: true, message: 'Replication queued' });
  } catch (err) {
    console.error('replicateNow error', err);
    return res.status(500).json({ error: 'Failed to enqueue replication' });
  }
}

async function deleteFile(req, res) {
  try {
    const { id } = req.params;
    const fileDoc = await File.findById(id);
    if (!fileDoc) return res.status(404).json({ error: 'File not found' });

    // ownership check (if using auth)
    if (req.user && fileDoc.owner && !fileDoc.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Remove from MinIO (ignore if missing)
    try {
      if (fileDoc.minioKey) {
        await removeObject(env.MINIO_BUCKET, fileDoc.minioKey);
        console.log('Deleted from MinIO:', fileDoc.minioKey);
      }
    } catch (minioErr) {
      console.warn('MinIO delete error (continuing):', minioErr.message);
      // continue — object may already be missing
    }

    // Remove from S3 if s3Key exists
    if (fileDoc.s3Key) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: fileDoc.s3Key,
        }));
        console.log('Deleted from S3:', fileDoc.s3Key);
      } catch (s3Err) {
        console.warn('S3 delete error (continuing):', s3Err.message);
        // continue — could be already deleted or permission issue
      }
    }

    // Remove DB record (or soft delete if you prefer)
    await File.findByIdAndDelete(id);

    return res.json({ ok: true, message: 'Deleted from storage and DB' });
  } catch (err) {
    console.error('deleteFile error', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
}


module.exports = {
  getS3DownloadUrl,
  updateFile,
  getFile,
  listFiles,
  replicateNow,
  deleteFile,
};
