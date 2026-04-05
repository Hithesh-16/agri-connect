import { Router, Response } from 'express';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { SCHEMES, Scheme } from '../data/schemes';

const router = Router();

// GET /api/schemes - List all schemes
router.get('/', (_req, res) => {
  try {
    res.json({ success: true, data: SCHEMES });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch schemes.' });
  }
});

// GET /api/schemes/check-eligibility - Check eligibility for user
router.get('/check-eligibility', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { crops: true, mandis: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const userRole = user.role?.toLowerCase() || '';
    const userState = user.state || '';
    const userDob = user.dob;

    let userAge: number | null = null;
    if (userDob) {
      const today = new Date();
      const birth = new Date(userDob);
      userAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        userAge--;
      }
    }

    // Determine if user "has land" based on role being farmer
    const hasLand = userRole === 'farmer';

    const results = SCHEMES.map((scheme: Scheme) => {
      const reasons: string[] = [];
      let eligible = true;

      // Check role
      const roleMatch = scheme.eligibility.roles.some(r => r.toLowerCase() === userRole);
      if (!roleMatch) {
        eligible = false;
        reasons.push(`Requires role: ${scheme.eligibility.roles.join(' or ')}`);
      }

      // Check state
      if (!scheme.eligibility.states.includes('all')) {
        const stateMatch = scheme.eligibility.states.some(s => s.toLowerCase() === userState.toLowerCase());
        if (!stateMatch) {
          eligible = false;
          reasons.push(`Available only in: ${scheme.eligibility.states.join(', ')}`);
        }
      }

      // Check land requirement
      if (scheme.eligibility.requiresLand && !hasLand) {
        eligible = false;
        reasons.push('Requires land ownership');
      }

      // Check age
      if (scheme.eligibility.minAge && userAge !== null && userAge < scheme.eligibility.minAge) {
        eligible = false;
        reasons.push(`Minimum age: ${scheme.eligibility.minAge}`);
      }
      if (scheme.eligibility.maxAge && userAge !== null && userAge > scheme.eligibility.maxAge) {
        eligible = false;
        reasons.push(`Maximum age: ${scheme.eligibility.maxAge}`);
      }

      return {
        ...scheme,
        eligible,
        reasons: eligible ? [] : reasons,
      };
    });

    // Sort eligible schemes first
    results.sort((a, b) => (a.eligible === b.eligible ? 0 : a.eligible ? -1 : 1));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to check eligibility.' });
  }
});

export default router;
