import { Router, Response } from 'express';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { ENDPOINTS, DEVICE_PLATFORM } from '../constants';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('devices-route');
const E = ENDPOINTS.DEVICES;

// ─── REGISTER DEVICE TOKEN ──────────────────────────────
router.post(E.REGISTER_TOKEN, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { token, platform } = req.body;

    if (!token || !platform) {
      res.status(400).json({ success: false, error: 'token and platform are required.' });
      return;
    }

    if (!Object.values(DEVICE_PLATFORM).includes(platform)) {
      res.status(400).json({ success: false, error: 'platform must be ANDROID, IOS, or WEB.' });
      return;
    }

    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, isActive: true, lastUsedAt: new Date() },
    });

    log.info({ userId, platform }, 'Device token registered');
    res.status(201).json({ success: true, data: deviceToken });
  } catch (err) {
    log.error({ err }, 'Failed to register device token');
    res.status(500).json({ success: false, error: 'Failed to register device token.' });
  }
});

// ─── REMOVE DEVICE TOKEN ────────────────────────────────
router.delete(E.REMOVE_TOKEN, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.deviceToken.updateMany({
      where: { token: req.params.token as string, userId: req.user!.userId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      res.status(404).json({ success: false, error: 'Token not found.' });
      return;
    }

    res.json({ success: true, message: 'Device token removed.' });
  } catch (err) {
    log.error({ err }, 'Failed to remove device token');
    res.status(500).json({ success: false, error: 'Failed to remove device token.' });
  }
});

export default router;
