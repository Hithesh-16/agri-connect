import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';

const router = Router();

const createAlertSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
  mandiId: z.string().optional(),
  targetPrice: z.number().positive('targetPrice must be positive'),
  direction: z.enum(['above', 'below']),
  priceType: z.enum(['mandi', 'farmGate', 'dealer', 'retail']).default('mandi'),
});

// GET /api/alerts - Get user's alerts
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const alerts = await prisma.priceAlert.findMany({
      where: { userId },
      include: { crop: true, mandi: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch alerts.' });
  }
});

// POST /api/alerts - Create alert
router.post('/', authenticate, validate(createAlertSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { cropId, mandiId, targetPrice, direction, priceType } = req.body;

    // Verify crop exists
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      res.status(404).json({ success: false, error: 'Crop not found.' });
      return;
    }

    // Verify mandi exists if provided
    if (mandiId) {
      const mandi = await prisma.mandi.findUnique({ where: { id: mandiId } });
      if (!mandi) {
        res.status(404).json({ success: false, error: 'Mandi not found.' });
        return;
      }
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        cropId,
        mandiId: mandiId || null,
        targetPrice,
        direction,
        priceType,
      },
      include: { crop: true, mandi: true },
    });

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create alert.' });
  }
});

// PATCH /api/alerts/:id - Toggle active/inactive
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.priceAlert.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Alert not found.' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to modify this alert.' });
      return;
    }

    const alert = await prisma.priceAlert.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: { crop: true, mandi: true },
    });

    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update alert.' });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.priceAlert.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Alert not found.' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this alert.' });
      return;
    }

    await prisma.priceAlert.delete({ where: { id } });

    res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete alert.' });
  }
});

export default router;
