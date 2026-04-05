import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { prisma } from '../config';

const router = Router();

// All user routes require authentication
router.use(authenticate);

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  surname: z.string().min(1).max(100).optional(),
  aadhaar: z.string().regex(/^\d{12}$/).optional(),
  role: z.enum(['FARMER', 'TRADER', 'DEALER', 'CORPORATE']).optional(),
  houseNo: z.string().optional(),
  street: z.string().optional(),
  village: z.string().optional(),
  post: z.string().optional(),
  mandal: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  language: z.string().optional(),
  updatesConsent: z.boolean().optional(),
  profilePhoto: z.string().optional(),
});

const updateCropsSchema = z.object({
  cropIds: z.array(z.string()),
});

const updateMandisSchema = z.object({
  mandiIds: z.array(z.string()),
});

// GET /api/users/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        crops: { include: { crop: true } },
        mandis: { include: { mandi: true } },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...user,
        crops: user.crops.map((uc) => uc.crop),
        mandis: user.mandis.map((um) => um.mandi),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

// PATCH /api/users/profile
router.patch('/profile', validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (data.dob) {
      data.dob = new Date(data.dob);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// GET /api/users/crops
router.get('/crops', async (req: AuthRequest, res: Response) => {
  try {
    const userCrops = await prisma.userCrop.findMany({
      where: { userId: req.user!.userId },
      include: { crop: true },
    });

    res.json({
      success: true,
      data: userCrops.map((uc) => uc.crop),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user crops.' });
  }
});

// PUT /api/users/crops
router.put('/crops', validate(updateCropsSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { cropIds } = req.body;

    // Replace all user crops in a transaction
    await prisma.$transaction([
      prisma.userCrop.deleteMany({ where: { userId } }),
      ...cropIds.map((cropId: string) =>
        prisma.userCrop.create({ data: { userId, cropId } })
      ),
    ]);

    const userCrops = await prisma.userCrop.findMany({
      where: { userId },
      include: { crop: true },
    });

    res.json({
      success: true,
      data: userCrops.map((uc) => uc.crop),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user crops.' });
  }
});

// GET /api/users/mandis
router.get('/mandis', async (req: AuthRequest, res: Response) => {
  try {
    const userMandis = await prisma.userMandi.findMany({
      where: { userId: req.user!.userId },
      include: { mandi: true },
    });

    res.json({
      success: true,
      data: userMandis.map((um) => um.mandi),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user mandis.' });
  }
});

// PUT /api/users/mandis
router.put('/mandis', validate(updateMandisSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { mandiIds } = req.body;

    await prisma.$transaction([
      prisma.userMandi.deleteMany({ where: { userId } }),
      ...mandiIds.map((mandiId: string) =>
        prisma.userMandi.create({ data: { userId, mandiId } })
      ),
    ]);

    const userMandis = await prisma.userMandi.findMany({
      where: { userId },
      include: { mandi: true },
    });

    res.json({
      success: true,
      data: userMandis.map((um) => um.mandi),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user mandis.' });
  }
});

export default router;
