import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS, UPLOAD_LIMITS, ALLOWED_MIME_TYPES } from '../../constants';
import * as uploadController from '../controllers/upload-controller';

const router = Router();
const E = ENDPOINTS.UPLOAD;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMITS.IMAGE_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.UPLOAD.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

router.post(E.SINGLE, authenticate, upload.single('image'), asyncHandler(uploadController.single));
router.post(E.MULTIPLE, authenticate, upload.array('images', 10), asyncHandler(uploadController.multiple));

export default router;
