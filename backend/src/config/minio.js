const Minio = require('minio');
const env = require('./env');

const client = new Minio.Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
});

function ensureBucket(bucket){
    return new Promise((resolve,reject) => {
        client.bucketExists(bucket, (err,exists) => {
            if(err) return reject(err);
            if(exists) return resolve(true);
            client.makeBucket(bucket, '', (mErr) =>{
                if(mErr) return reject(mErr);
                resolve(true);
            });
        });
    });
}

function putObject(bucket,objectName, bufferOrStream, size, meta){
  return new Promise((resolve, reject) =>{
    // Allow calling putObject(bucket, objectName, bufferOrStream, meta)
    // where size may be omitted when passing a Buffer/Stream.
    if (meta === undefined && (typeof size === 'object' || typeof size === 'undefined')) {
      meta = size;
      size = undefined;
    }

    // Minio client.putObject signature accepts (bucket, objectName, stream/buffer, size?, meta?, callback)
    const callback = (err, etag)=> {
      if(err) return reject(err);
      resolve(etag);
    };

    try {
      if (size !== undefined) {
        client.putObject(bucket, objectName, bufferOrStream, size, meta || {}, callback);
      } else {
        client.putObject(bucket, objectName, bufferOrStream, meta || {}, callback);
      }
    } catch (err) {
      reject(err);
    }
  });
}

function getObjectStream(bucket, objectName) {
  return new Promise((resolve, reject) => {
    client.getObject(bucket, objectName, (err, dataStream) => {
      if (err) return reject(err);
      resolve(dataStream);
    });
  });
}

function removeObject(bucket, objectName) {
  return new Promise((resolve, reject) => {
    client.removeObject(bucket, objectName, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

function statObject(bucket, objectName) {
  return new Promise((resolve, reject) => {
    client.statObject(bucket, objectName, (err, stat) => {
      if (err) return reject(err);
      resolve(stat);
    });
  });
}

module.exports = {
  client,
  ensureBucket,
  putObject,
  getObjectStream,
  removeObject,
  statObject,
};