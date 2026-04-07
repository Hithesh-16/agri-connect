import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { AppError, NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';
import {
  createTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getMyTeams,
  getTeamDetails,
  updateTeam,
} from '../../services/teamService';

async function getProviderOrFail(userId: string) {
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) throw new NotFoundError('Provider profile');
  return provider;
}

export async function create(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });

  if (!provider || provider.type !== 'LABOR_TEAM_LEADER') {
    throw new ForbiddenError('Only labor team leaders can create teams.');
  }

  const { name, description, skills, primarySkill, maxMembers, baseLocation, serviceRadius, dailyRatePerWorker, minimumWorkers } = req.body;

  if (!name || !skills?.length || !primarySkill || !baseLocation || !dailyRatePerWorker) {
    throw new AppError('name, skills, primarySkill, baseLocation, and dailyRatePerWorker are required.', 400);
  }

  const team = await createTeam(provider.id, {
    name, description, skills, primarySkill, maxMembers, baseLocation, serviceRadius, dailyRatePerWorker, minimumWorkers,
  });

  sendCreated(res, team);
}

export async function myTeams(req: AuthRequest, res: Response) {
  const provider = await getProviderOrFail(req.user!.userId);
  const teams = await getMyTeams(provider.id);
  sendSuccess(res, teams);
}

export async function detail(req: AuthRequest, res: Response) {
  const team = await getTeamDetails(req.params.id as string);
  if (!team) throw new NotFoundError('Team');
  sendSuccess(res, team);
}

export async function update(req: AuthRequest, res: Response) {
  const provider = await getProviderOrFail(req.user!.userId);
  const team = await updateTeam(req.params.id as string, provider.id, req.body);
  sendSuccess(res, team);
}

export async function addMember(req: AuthRequest, res: Response) {
  const provider = await getProviderOrFail(req.user!.userId);

  const { name, phone, aadhaarLast4, photo, skills, experience, preferredCrops, dailyRate, bankAccountNumber, bankIfsc, bankAccountName, upiId } = req.body;

  if (!name || !phone || !skills?.length || !dailyRate) {
    throw new AppError('name, phone, skills, and dailyRate are required.', 400);
  }

  const member = await addTeamMember(req.params.id as string, provider.id, {
    name, phone, aadhaarLast4, photo, skills, experience, preferredCrops, dailyRate, bankAccountNumber, bankIfsc, bankAccountName, upiId,
  });

  sendCreated(res, member);
}

export async function updateMember(req: AuthRequest, res: Response) {
  const provider = await getProviderOrFail(req.user!.userId);
  const member = await updateTeamMember(req.params.id as string, req.params.memberId as string, provider.id, req.body);
  sendSuccess(res, member);
}

export async function removeMember(req: AuthRequest, res: Response) {
  const provider = await getProviderOrFail(req.user!.userId);
  await removeTeamMember(req.params.id as string, req.params.memberId as string, provider.id);
  sendMessage(res, 'Member removed from team.');
}
