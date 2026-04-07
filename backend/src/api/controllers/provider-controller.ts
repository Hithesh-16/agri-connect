import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as providerService from '../../services/provider-service';
import { sendSuccess, sendCreated } from '../../utils/response';

export async function register(req: AuthRequest, res: Response) {
  const provider = await providerService.registerProvider(req.user!.userId, req.body);
  sendCreated(res, provider);
}

export async function getMe(req: AuthRequest, res: Response) {
  const provider = await providerService.getMyProfile(req.user!.userId);
  sendSuccess(res, provider);
}

export async function updateMe(req: AuthRequest, res: Response) {
  const provider = await providerService.updateMyProfile(req.user!.userId, req.body);
  sendSuccess(res, provider);
}

export async function getPublic(req: AuthRequest, res: Response) {
  const provider = await providerService.getPublicProfile(req.params.id as string);
  sendSuccess(res, provider);
}

export async function submitKyc(req: AuthRequest, res: Response) {
  const result = await providerService.submitKyc(req.user!.userId, req.body);
  sendSuccess(res, result);
}

export async function getKycStatus(req: AuthRequest, res: Response) {
  const status = await providerService.getKycStatus(req.user!.userId);
  sendSuccess(res, status);
}

export async function reviewKyc(req: AuthRequest, res: Response) {
  const result = await providerService.reviewKyc(req.params.id as string, req.user!.userId, req.body.action, req.body.note);
  sendSuccess(res, result);
}

export async function kycQueue(req: AuthRequest, res: Response) {
  const { providers, total, page, limit } = await providerService.getKycQueue(req.query as Record<string, string>);
  sendSuccess(res, providers, { page, limit, total, totalPages: Math.ceil(total / limit) });
}
