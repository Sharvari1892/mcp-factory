const Minio = require('minio');

// Internal client — used for uploads and bucket operations (connects to minio:9000 inside Docker)
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  region: 'us-east-1'
});

// Public client — used ONLY for generating presigned URLs.
// Setting `region` prevents the SDK from making a network call to look up the bucket region,
// making presignedGetObject a pure local HMAC computation — no connection to localhost needed.
const minioPublicClient = new Minio.Client({
  endPoint: process.env.PUBLIC_MINIO_HOST || 'localhost',
  port: parseInt(process.env.PUBLIC_MINIO_PORT, 10) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  region: 'us-east-1'
});

async function ensureBucket(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
    }
  } catch (error) {
    throw new Error(`Failed to ensure bucket "${bucketName}": ${error.message}`);
  }
}

async function uploadFile(bucket, key, buffer, contentType) {
  try {
    await ensureBucket(bucket);
    await minioClient.putObject(bucket, key, buffer, buffer.length, {
      'Content-Type': contentType || 'application/octet-stream'
    });
  } catch (error) {
    throw new Error(`Failed to upload to "${bucket}/${key}": ${error.message}`);
  }
}

async function getPresignedUrl(bucket, key) {
  try {
    // Use the public client so the URL is signed with localhost:9000.
    // presignedGetObject never connects to the server — it only does local HMAC signing.
    // The configured endPoint controls what hostname appears in the signed URL.
    const url = await minioPublicClient.presignedGetObject(bucket, key, 900);
    return url;
  } catch (error) {
    throw new Error(`Failed to generate presigned URL for "${bucket}/${key}": ${error.message}`);
  }
}

async function saveGeneratedServerCode(serverId, code) {
  try {
    const buffer = Buffer.from(code, 'utf8');
    const storageKey = `${serverId}/server.ts`;
    await uploadFile('servers', storageKey, buffer, 'application/typescript');
    return storageKey;
  } catch (error) {
    throw new Error(`Failed to save server code for "${serverId}": ${error.message}`);
  }
}

module.exports = {
  ensureBucket,
  uploadFile,
  getPresignedUrl,
  saveGeneratedServerCode
};