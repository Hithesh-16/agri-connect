import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, UPLOAD_LIMITS, ALLOWED_MIME_TYPES } from '../../constants';
import * as scannerController from '../controllers/scanner-controller';

const router = Router();
const E = ENDPOINTS.SCANNER;

// Configure multer for image uploads
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `scan-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMITS.SCANNER_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.SCANNER.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and HEIC images are allowed.'));
    }
  },
});

router.post(E.ANALYZE, upload.single('image'), asyncHandler(scannerController.analyze));

export default router;
