import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AuthRequest } from '../types';
import { prisma } from '../config';
import {
  createTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getMyTeams,
  getTeamDetails,
  updateTeam,
} from '../services/teamService';
import { createChildLogger } from '../config/logger';

const router = Router();
const log = createChildLogger('teams-route');

// ─── CREATE TEAM ────────────────────────────────────────
router.post('/', authenticate, requirePermission('teams', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider || provider.type !== 'LABOR_TEAM_LEADER') {
      res.status(403).json({ success: false, error: 'Only labor team leaders can create teams.' });
      return;
    }

    const { name, description, skills, primarySkill, maxMembers, baseLocation, serviceRadius, dailyRatePerWorker, minimumWorkers } = req.body;

    if (!name || !skills?.length || !primarySkill || !baseLocation || !dailyRatePerWorker) {
      res.status(400).json({ success: false, error: 'name, skills, primarySkill, baseLocation, and dailyRatePerWorker are required.' });
      return;
    }

    const team = await createTeam(provider.id, {
      name, description, skills, primarySkill, maxMembers, baseLocation, serviceRadius, dailyRatePerWorker, minimumWorkers,
    });

    res.status(201).json({ success: true, data: team });
  } catch (err: any) {
    log.error({ err }, 'Failed to create team');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── GET MY TEAMS ───────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider profile not found.' });
      return;
    }

    const teams = await getMyTeams(provider.id);
    res.json({ success: true, data: teams });
  } catch (err: any) {
    log.error({ err }, 'Failed to get teams');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET TEAM DETAILS ───────────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const team = await getTeamDetails(req.params.id as string);
    if (!team) {
      res.status(404).json({ success: false, error: 'Team not found.' });
      return;
    }
    res.json({ success: true, data: team });
  } catch (err: any) {
    log.error({ err }, 'Failed to get team details');
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── UPDATE TEAM ────────────────────────────────────────
router.put('/:id', authenticate, requirePermission('teams', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider profile not found.' });
      return;
    }

    const team = await updateTeam(req.params.id as string, provider.id, req.body);
    res.json({ success: true, data: team });
  } catch (err: any) {
    log.error({ err }, 'Failed to update team');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── ADD MEMBER ─────────────────────────────────────────
router.post('/:id/members', authenticate, requirePermission('teams', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider profile not found.' });
      return;
    }

    const { name, phone, aadhaarLast4, photo, skills, experience, preferredCrops, dailyRate, bankAccountNumber, bankIfsc, bankAccountName, upiId } = req.body;

    if (!name || !phone || !skills?.length || !dailyRate) {
      res.status(400).json({ success: false, error: 'name, phone, skills, and dailyRate are required.' });
      return;
    }

    const member = await addTeamMember(req.params.id as string, provider.id, {
      name, phone, aadhaarLast4, photo, skills, experience, preferredCrops, dailyRate, bankAccountNumber, bankIfsc, bankAccountName, upiId,
    });

    res.status(201).json({ success: true, data: member });
  } catch (err: any) {
    log.error({ err }, 'Failed to add team member');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── UPDATE MEMBER ──────────────────────────────────────
router.put('/:id/members/:memberId', authenticate, requirePermission('teams', 'update'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider profile not found.' });
      return;
    }

    const member = await updateTeamMember(req.params.id as string, req.params.memberId as string, provider.id, req.body);
    res.json({ success: true, data: member });
  } catch (err: any) {
    log.error({ err }, 'Failed to update team member');
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── REMOVE MEMBER ──────────────────────────────────────
router.delete('/:id/members/:memberId', authenticate, requirePermission('teams', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) {
      res.status(404).json({ success: false, error: 'Provider profile not found.' });
      return;
    }

    await removeTeamMember(req.params.id as string, req.params.memberId as string, provider.id);
    res.json({ success: true, message: 'Member removed from team.' });
  } catch (err: any) {
    log.error({ err }, 'Failed to remove team member');
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
