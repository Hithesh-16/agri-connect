import { prisma } from '../config';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('team-service');

// ─── CREATE TEAM ────────────────────────────────────────

export async function createTeam(leaderId: string, data: {
  name: Record<string, string>;
  description?: Record<string, string>;
  skills: string[];
  primarySkill: string;
  maxMembers?: number;
  baseLocation: { lat: number; lng: number; village?: string; mandal?: string; district?: string; state?: string };
  serviceRadius?: number;
  dailyRatePerWorker: number;
  minimumWorkers?: number;
}) {
  const provider = await prisma.serviceProvider.findFirst({
    where: { id: leaderId, type: 'LABOR_TEAM_LEADER' },
  });
  if (!provider) throw new Error('Only team leaders can create teams');

  const team = await prisma.laborTeam.create({
    data: {
      leaderId,
      name: data.name,
      description: data.description,
      skills: data.skills,
      primarySkill: data.primarySkill,
      maxMembers: data.maxMembers || 20,
      baseLocation: data.baseLocation,
      serviceRadius: data.serviceRadius || 30,
      dailyRatePerWorker: data.dailyRatePerWorker,
      minimumWorkers: data.minimumWorkers || 1,
    },
    include: { members: true },
  });

  log.info({ teamId: team.id, leaderId }, 'Team created');
  return team;
}

// ─── ADD MEMBER ─────────────────────────────────────────

export async function addTeamMember(teamId: string, leaderId: string, memberData: {
  name: string;
  phone: string;
  aadhaarLast4?: string;
  photo?: string;
  skills: string[];
  experience?: number;
  preferredCrops?: string[];
  dailyRate: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountName?: string;
  upiId?: string;
}) {
  const team = await prisma.laborTeam.findFirst({
    where: { id: teamId, leaderId },
  });
  if (!team) throw new Error('Team not found or unauthorized');
  if (team.activeMembers >= team.maxMembers) throw new Error('Team is full');

  const member = await prisma.teamMember.create({
    data: {
      teamId,
      name: memberData.name,
      phone: memberData.phone,
      aadhaarLast4: memberData.aadhaarLast4,
      photo: memberData.photo,
      skills: memberData.skills,
      experience: memberData.experience,
      preferredCrops: memberData.preferredCrops || [],
      dailyRate: memberData.dailyRate,
      bankAccountNumber: memberData.bankAccountNumber,
      bankIfsc: memberData.bankIfsc,
      bankAccountName: memberData.bankAccountName,
      upiId: memberData.upiId,
    },
  });

  await prisma.laborTeam.update({
    where: { id: teamId },
    data: { activeMembers: { increment: 1 } },
  });

  log.info({ teamId, memberId: member.id }, 'Team member added');
  return member;
}

// ─── UPDATE MEMBER ──────────────────────────────────────

export async function updateTeamMember(teamId: string, memberId: string, leaderId: string, data: {
  name?: string;
  phone?: string;
  skills?: string[];
  experience?: number;
  preferredCrops?: string[];
  dailyRate?: number;
  isAvailable?: boolean;
  unavailableFrom?: Date;
  unavailableTo?: Date;
  unavailableReason?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountName?: string;
  upiId?: string;
}) {
  const team = await prisma.laborTeam.findFirst({
    where: { id: teamId, leaderId },
  });
  if (!team) throw new Error('Team not found or unauthorized');

  const member = await prisma.teamMember.update({
    where: { id: memberId, teamId },
    data,
  });

  return member;
}

// ─── REMOVE MEMBER ──────────────────────────────────────

export async function removeTeamMember(teamId: string, memberId: string, leaderId: string) {
  const team = await prisma.laborTeam.findFirst({
    where: { id: teamId, leaderId },
  });
  if (!team) throw new Error('Team not found or unauthorized');

  await prisma.teamMember.update({
    where: { id: memberId, teamId },
    data: { isActive: false },
  });

  await prisma.laborTeam.update({
    where: { id: teamId },
    data: { activeMembers: { decrement: 1 } },
  });

  log.info({ teamId, memberId }, 'Team member removed');
}

// ─── GET MY TEAMS ───────────────────────────────────────

export async function getMyTeams(leaderId: string) {
  return prisma.laborTeam.findMany({
    where: { leaderId, isActive: true },
    include: {
      members: {
        where: { isActive: true },
        orderBy: { joinedAt: 'desc' },
      },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── GET TEAM DETAILS ───────────────────────────────────

export async function getTeamDetails(teamId: string) {
  return prisma.laborTeam.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { isActive: true },
        orderBy: { rating: 'desc' },
      },
      leader: {
        include: { user: { select: { firstName: true, surname: true, mobile: true, profilePhoto: true } } },
      },
      _count: { select: { bids: true } },
    },
  });
}

// ─── UPDATE TEAM ────────────────────────────────────────

export async function updateTeam(teamId: string, leaderId: string, data: {
  name?: Record<string, string>;
  description?: Record<string, string>;
  skills?: string[];
  primarySkill?: string;
  maxMembers?: number;
  baseLocation?: { lat: number; lng: number; village?: string; mandal?: string; district?: string; state?: string };
  serviceRadius?: number;
  dailyRatePerWorker?: number;
  minimumWorkers?: number;
}) {
  const team = await prisma.laborTeam.findFirst({
    where: { id: teamId, leaderId },
  });
  if (!team) throw new Error('Team not found or unauthorized');

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.skills !== undefined) updateData.skills = data.skills;
  if (data.primarySkill !== undefined) updateData.primarySkill = data.primarySkill;
  if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers;
  if (data.baseLocation !== undefined) updateData.baseLocation = data.baseLocation;
  if (data.serviceRadius !== undefined) updateData.serviceRadius = data.serviceRadius;
  if (data.dailyRatePerWorker !== undefined) updateData.dailyRatePerWorker = data.dailyRatePerWorker;
  if (data.minimumWorkers !== undefined) updateData.minimumWorkers = data.minimumWorkers;

  return prisma.laborTeam.update({
    where: { id: teamId },
    data: updateData,
    include: { members: { where: { isActive: true } } },
  });
}
