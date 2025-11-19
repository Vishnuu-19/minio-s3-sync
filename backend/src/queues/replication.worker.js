// src/queues/replication.worker.js
const { Worker } = require('bullmq');
const { connection } = require('../config/redis');
const { getObjectStream, statObject } = require('../config/minio');
const { s3 } = require('../config/s3');
// const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const env = require('../config/env');
const File = require('../models/File');
const { connectDB } = require('../config/db');

async function startWorker() {
  await connectDB();

  const worker = new Worker('replication', async job => {
    const { fileId } = job.data;
    if (!fileId) throw new Error('Missing fileId in job');

    // Load file metadata
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw new Error('File not found: ' + fileId);

    

    const bucket = env.MINIO_BUCKET;
    const minioKey = fileDoc.minioKey;
    // inside replication.worker.js job processor, after reading fileDoc
    const s3Key = `users/${fileDoc.owner}/replicated/${fileDoc.minioKey.split('/').slice(-1)[0]}`;
    // or simply reuse minioKey but under users/.. path on S3 as well:


    try {
      // 1) Get object metadata (size) from MinIO
      const stat = await statObject(bucket, minioKey);
      const contentLength = stat && stat.size ? stat.size : undefined;
      if (typeof contentLength === 'undefined') {
        throw new Error('Could not determine content length for ' + minioKey);
      }

      // stream from MinIO
      const stream = await getObjectStream(bucket, minioKey);

      // Upload to S3 using stream
      const putParams = {
        Bucket: env.S3_BUCKET,
        Key: s3Key,
        Body: stream,
        ContentType: fileDoc.mimeType,
        ContentLength: contentLength, 
      };

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: env.S3_BUCKET,
          Key: s3Key,
          Body: stream,
          ContentType: fileDoc.mimeType || 'application/octet-stream',
          ContentLength: contentLength,
        },
        queueSize: 4,                 // concurrent multipart uploads
        partSize: 5 * 1024 * 1024,    // 5 MB parts (safe)
      });

      await upload.done();

      // await s3.send(new PutObjectCommand(putParams));

      fileDoc.s3Key = s3Key;
      fileDoc.status = 'replicated_to_s3';
      fileDoc.replicatedAt = new Date();
      await fileDoc.save();

      console.log(`Replication successful: ${minioKey} -> s3://${env.S3_BUCKET}/${s3Key}`);
      return { ok: true };
    } catch (err) {
      console.error('Replication failed for fileId', fileId, err);
      fileDoc.status = 'replication_failed';
      (await fileDoc.save()).save().catch(() => {});
      throw err; // let BullMQ handle retries
    }
  }, { connection });

  worker.on('completed', (job) => {
    console.log('Job completed', job.id);
  });

  worker.on('failed', (job, err) => {
    console.error('Job failed', job.id, err.message);
  });

  console.log('Replication worker started');
}

if (require.main === module) {
  // allow running this file directly: `node src/queues/replication.worker.js`
  startWorker().catch(err => {
    console.error('Worker crashed', err);
    process.exit(1);
  });
}

module.exports = {
  startWorker,
};
