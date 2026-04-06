import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { UploadService } from '../services/uploadService';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

// POST /api/upload — single image
router.post('/', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided.' });
      return;
    }

    const type = (req.body.type as string) || 'listing';
    const validTypes = ['profile', 'service', 'kyc', 'listing', 'community'] as const;
    if (!validTypes.includes(type as any)) {
      res.status(400).json({ success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
      return;
    }

    const url = await UploadService.uploadImage(req.file.buffer, type as any, req.file.originalname);
    res.json({ success: true, data: { url } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
  }
});

// POST /api/upload/multiple — up to 10 images
router.post('/multiple', authenticate, upload.array('images', 10), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No image files provided.' });
      return;
    }

    const type = (req.body.type as string) || 'listing';
    const urls = await UploadService.uploadImages(files, type as any);
    res.json({ success: true, data: { urls } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
  }
});

export default router;
