import { Response } from 'express';
import { AuthRequest } from '../../types';
import { AppError } from '../../errors/app-error';
import { sendSuccess } from '../../utils/response';
import { UploadService } from '../../services/uploadService';

const VALID_TYPES = ['profile', 'service', 'kyc', 'listing', 'community'] as const;

export async function single(req: AuthRequest, res: Response) {
  if (!req.file) {
    throw new AppError('No image file provided.', 400);
  }

  const type = (req.body.type as string) || 'listing';
  if (!VALID_TYPES.includes(type as any)) {
    throw new AppError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }

  const url = await UploadService.uploadImage(req.file.buffer, type as any, req.file.originalname);
  sendSuccess(res, { url });
}

export async function multiple(req: AuthRequest, res: Response) {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new AppError('No image files provided.', 400);
  }

  const type = (req.body.type as string) || 'listing';
  const urls = await UploadService.uploadImages(files, type as any);
  sendSuccess(res, { urls });
}
