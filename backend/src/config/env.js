require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 4000,

    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
    MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000',10),
    MINIO_USE_SSL: (process.env.MINIO_USE_SSL==='true'),
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
    MINIO_BUCKET: process.env.MINIO_BUCKET || 'my-local-bucket',

    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    S3_BUCKET: process.env.S3_BUCKET || '',

    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/minio_s3_sync',
}