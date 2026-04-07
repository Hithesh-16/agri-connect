import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../errors/app-error';
import { SCHEMES, Scheme } from '../../data/schemes';

export async function list(_req: AuthRequest, res: Response) {
  sendSuccess(res, SCHEMES);
}

export async function checkEligibility(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { crops: true, mandis: true },
  });

  if (!user) throw new NotFoundError('User');

  const eligible: Scheme[] = [];
  const ineligible: { scheme: Scheme; reasons: string[] }[] = [];

  for (const scheme of SCHEMES) {
    const reasons: string[] = [];

    // Check role eligibility
    if (scheme.eligibility.roles.length > 0 && !scheme.eligibility.roles.includes('all')) {
      const userRole = (user.role || '').toLowerCase();
      if (!scheme.eligibility.roles.includes(userRole)) {
        reasons.push(`Requires role: ${scheme.eligibility.roles.join(', ')}`);
      }
    }

    // Check state eligibility
    if (scheme.eligibility.states.length > 0 && !scheme.eligibility.states.includes('all')) {
      const userState = (user as any).state || '';
      if (!scheme.eligibility.states.includes(userState)) {
        reasons.push(`Available in: ${scheme.eligibility.states.join(', ')}`);
      }
    }

    if (reasons.length === 0) {
      eligible.push(scheme);
    } else {
      ineligible.push({ scheme, reasons });
    }
  }

  sendSuccess(res, { eligible, ineligible, totalSchemes: SCHEMES.length });
}
