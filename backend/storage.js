const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'us-west-000',
  endpoint: 'https://s3.us-west-000.backblazeb2.com',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

async function uploadPdf(buffer, referenceNo) {
  const folderName = referenceNo.replace('/', '-');
  const key = `workers/${folderName}/Acknowledgment.pdf`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.B2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  }));
  
  return `https://f000.backblazeb2.com/file/${process.env.B2_BUCKET}/${key}`;
}

module.exports = { uploadPdf };
