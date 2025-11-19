// src/server.js
const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const { ensureBucket } = require('./config/minio');
const { startWorker } = require('./queues/replication.worker'); // optional: start worker from same process or run separately
const { client: minioClient } = require('./config/minio');

async function bootstrap() {
  try {
    await connectDB();

    // ensure MinIO bucket exists
    try {
      await ensureBucket(env.MINIO_BUCKET);
      console.log('MinIO bucket ensured:', env.MINIO_BUCKET);
    } catch (e) {
      console.warn('Could not ensure MinIO bucket on startup', e.message);
    }

    // Optionally start worker in the same process (useful for dev).
    // For production it's better to run worker separately.
    // Uncomment if you want server+worker in same process:
    // startWorker().catch(err => console.error('Worker failed to start', err));

    app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('Bootstrap failed', err);
    process.exit(1);
  }
}

bootstrap();
