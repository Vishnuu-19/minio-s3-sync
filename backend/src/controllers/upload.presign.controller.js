// src/controllers/upload.presign.controller.js
const { client: minioClient } = require('../config/minio');
const env = require('../config/env');

async function getPresignedUploadUrl(req, res) {
  // auth middleware must ensure req.user
  const { filename, contentType } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename required' });

  const minioKey = `users/${req.user._id}/${Date.now()}-${filename}`;

  // presigned PUT (expires 15 minutes)
  minioClient.presignedPutObject(env.MINIO_BUCKET, minioKey, 15 * 60, (err, presignedUrl) => {
    if (err) {
      console.error('presigned error', err);
      return res.status(500).json({ error: 'Could not create presigned URL' });
    }
    // optionally store a pending File doc with status 'uploading' and owner
    // return url and minioKey so client can later tell server to finalize
    res.json({ url: presignedUrl, minioKey });
  });
}

module.exports = {
  getPresignedUploadUrl,
};
