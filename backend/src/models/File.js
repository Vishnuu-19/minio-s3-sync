// src/models/File.js
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  minioKey: { type: String, required: true },
  s3Key: { type: String, default: null },
  mimeType: { type: String },
  size: { type: Number },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'stored_in_minio' }, // e.g. stored_in_minio | replicated_to_s3 | replication_failed
  replicateScheduledAt: { type: Date, default: null },
  replicatedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('File', FileSchema);
