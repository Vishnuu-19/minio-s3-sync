// // src/queues/replication.queue.js
// const { Queue, QueueScheduler } = require('bullmq');
// const { connection } = require('../config/redis');

// // Ensure a QueueScheduler is running for delayed jobs and retries
// new QueueScheduler('replication', { connection });

// const replicationQueue = new Queue('replication', { connection });

// async function addReplicationJob(data, opts = {}) {
//   // data: { fileId: '...' }
//   return replicationQueue.add('replicate', data, opts);
// }

// module.exports = {
//   replicationQueue,
//   addReplicationJob,
// };
// backend/src/queues/replication.queue.js
// const { Queue, QueueScheduler } = require('bullmq');
// const { connection } = require('../config/redis');

// // Instantiate a QueueScheduler for the queue name 'replication'.
// // This is required to enable delayed jobs and retries.
// new QueueScheduler('replication', { connection });

// // Create the actual queue instance
// const replicationQueue = new Queue('replication', { connection });

// async function addReplicationJob(data, opts = {}) {
//   // data: { fileId: '...' }
//   return replicationQueue.add('replicate', data, opts);
// }

// module.exports = {
//   replicationQueue,
//   addReplicationJob,
// };
// backend/src/queues/replication.queue.js
const { Queue, JobScheduler } = require('bullmq');
const { connection } = require('../config/redis');

// Start a JobScheduler for the queue name 'replication'.
// This replaces QueueScheduler from older bullmq versions.
// JobScheduler enables delayed jobs, retries, and other job scheduling features.
new JobScheduler('replication', { connection });

// Create the queue
const replicationQueue = new Queue('replication', { connection });

async function addReplicationJob(data, opts = {}) {
  // data: { fileId: '...' }
  return replicationQueue.add('replicate', data, opts);
}

module.exports = {
  replicationQueue,
  addReplicationJob,
};
