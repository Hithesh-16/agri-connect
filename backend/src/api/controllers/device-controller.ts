import { Response } from 'express';
import { AuthRequest } from '../../types';
import { sendCreated, sendMessage } from '../../utils/response';
import { AppError } from '../../errors/app-error';
import { DEVICE_PLATFORM } from '../../constants';
import * as notificationRepo from '../../repositories/notification-repository';

const validPlatforms = Object.values(DEVICE_PLATFORM);

export async function registerToken(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { token, platform } = req.body;

  if (!token || !platform) {
    throw new AppError('token and platform are required.', 400);
  }

  if (!validPlatforms.includes(platform)) {
    throw new AppError(`platform must be one of: ${validPlatforms.join(', ')}`, 400);
  }

  const device = await notificationRepo.upsertDeviceToken(userId, token, platform);

  sendCreated(res, device);
}

export async function removeToken(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const token = req.params.token as string;

  await notificationRepo.deactivateDeviceToken(token, userId);

  sendMessage(res, 'Device token deactivated.');
}
