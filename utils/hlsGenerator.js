const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function generateHLS(inputPath, outputDir, videoId, partTitle = '') {
  return new Promise((resolve, reject) => {
    const hlsDir = path.join(outputDir, 'hls');
    fs.mkdirSync(hlsDir, { recursive: true });
    const outputPath = path.join(hlsDir, 'index.m3u8');
    const keyPrefix = `hls/${videoId}/${partTitle ? `${partTitle}/` : ''}`;

    let duration = 0;
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (!err) duration = Math.round(metadata.format.duration);
    });

    ffmpeg(inputPath)
      .outputOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls',
        '-hls_segment_filename', path.join(hlsDir, '%03d.ts'),
      ])
      .output(outputPath)
      .on('end', async () => {
        const files = fs.readdirSync(hlsDir).filter(f => f.endsWith('.m3u8') || f.endsWith('.ts'));
        const uploadPromises = files.map(file => {
          const fileStream = fs.createReadStream(path.join(hlsDir, file));
          return s3.upload({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${keyPrefix}${file}`,
            Body: fileStream,
            ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
            ACL: 'public-read',
          }).promise();
        });
        await Promise.all(uploadPromises);
        fs.rmSync(hlsDir, { recursive: true });
        resolve({ url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${keyPrefix}index.m3u8`, duration });
      })
      .on('error', reject)
      .run();
  });
}

module.exports = { generateHLS };