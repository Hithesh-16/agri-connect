import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as userRepo from '../../repositories/user-repository';
import { NotFoundError } from '../../errors/app-error';
import { sendSuccess } from '../../utils/response';

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await userRepo.findUserById(req.user!.userId, {
    crops: { include: { crop: true } },
    mandis: { include: { mandi: true } },
  });

  if (!user) throw new NotFoundError('User');

  sendSuccess(res, {
    ...user,
    crops: (user as any).crops.map((uc: any) => uc.crop),
    mandis: (user as any).mandis.map((um: any) => um.mandi),
  });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const data: any = { ...req.body };
  if (data.dob) {
    data.dob = new Date(data.dob);
  }

  const user = await userRepo.updateUser(req.user!.userId, data);
  sendSuccess(res, user);
}

export async function getCrops(req: AuthRequest, res: Response) {
  const userCrops = await userRepo.findUserCrops(req.user!.userId);
  sendSuccess(res, userCrops.map((uc) => uc.crop));
}

export async function updateCrops(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { cropIds } = req.body;

  await userRepo.replaceUserCrops(userId, cropIds);

  const userCrops = await userRepo.findUserCrops(userId);
  sendSuccess(res, userCrops.map((uc) => uc.crop));
}

export async function getMandis(req: AuthRequest, res: Response) {
  const userMandis = await userRepo.findUserMandis(req.user!.userId);
  sendSuccess(res, userMandis.map((um) => um.mandi));
}

export async function updateMandis(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { mandiIds } = req.body;

  await userRepo.replaceUserMandis(userId, mandiIds);

  const userMandis = await userRepo.findUserMandis(userId);
  sendSuccess(res, userMandis.map((um) => um.mandi));
}
