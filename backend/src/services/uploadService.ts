import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('upload');

const s3Bucket = process.env.S3_BUCKET;
const s3Region = process.env.S3_REGION || 'ap-south-1';
const cdnUrl = process.env.CDN_URL;
const uploadDir = process.env.UPLOAD_DIR || './uploads';

let s3: S3Client | null = null;
if (s3Bucket) {
  s3 = new S3Client({ region: s3Region });
}

export class UploadService {
  /**
   * Process and upload an image. Returns the public URL.
   * - Resizes to max 1200px width
   * - Converts to WebP at 80% quality
   * - Uploads to S3 or local filesystem
   */
  static async uploadImage(
    buffer: Buffer,
    type: 'profile' | 'service' | 'kyc' | 'listing' | 'community',
    originalName?: string,
  ): Promise<string> {
    // Optimize with Sharp
    const optimized = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `${type}/${uuid()}.webp`;

    if (s3 && s3Bucket) {
      // Upload to S3
      await s3.send(new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: optimized,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      }));

      const url = cdnUrl ? `${cdnUrl}/${key}` : `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
      log.info({ key, size: optimized.length, original: originalName }, 'Image uploaded to S3');
      return url;
    }

    // Fallback: local filesystem storage (development)
    const dir = path.join(uploadDir, type);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${uuid()}.webp`);
    await fs.writeFile(filePath, optimized);

    log.info({ filePath, size: optimized.length }, 'Image saved locally');
    return `/uploads/${type}/${path.basename(filePath)}`;
  }

  /**
   * Upload multiple images. Returns array of URLs.
   */
  static async uploadImages(
    files: Express.Multer.File[],
    type: 'profile' | 'service' | 'kyc' | 'listing' | 'community',
  ): Promise<string[]> {
    return Promise.all(
      files.map((f) => this.uploadImage(f.buffer, type, f.originalname)),
    );
  }
}
