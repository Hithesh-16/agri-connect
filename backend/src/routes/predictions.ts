import { Router, Request, Response } from 'express';
import { PredictionService } from '../services/predictionService';

const router = Router();

// GET /api/predictions/:cropId
router.get('/:cropId', async (req: Request, res: Response) => {
  try {
    const { cropId } = req.params;
    const mandiIdRaw = req.query.mandiId;
    const mandiId: string | undefined = typeof mandiIdRaw === 'string' ? mandiIdRaw : undefined;
    const daysParam = parseInt(String(req.query.days || '7'), 10);

    // Validate days parameter
    let days = 7;
    if ([7, 14, 30].includes(daysParam)) {
      days = daysParam;
    }

    const result = await PredictionService.predict(String(cropId), mandiId, days);

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ success: false, error: err.message });
      return;
    }
    console.error('[Predictions] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate prediction.' });
  }
});

export default router;
