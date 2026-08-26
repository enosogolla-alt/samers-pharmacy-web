const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function buildKey(originalName) {
  const ext = path.extname(originalName);
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

// Uploads to the public product/blog bucket. Returns the permanent public URL to store in the database.
async function uploadPublicFile(buffer, originalName, mimetype) {
  const key = buildKey(originalName);
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_PRODUCT_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    }),
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// Uploads to the private prescriptions bucket. Returns only the object key — never a public URL.
async function uploadPrivateFile(buffer, originalName, mimetype) {
  const key = buildKey(originalName);
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_PRESCRIPTION_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    }),
  );
  return key;
}

// Generates a short-lived signed URL for staff to view a private prescription file on demand.
async function getSignedPrescriptionUrl(key, expiresInSeconds = 900) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_PRESCRIPTION_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

module.exports = { uploadPublicFile, uploadPrivateFile, getSignedPrescriptionUrl };
