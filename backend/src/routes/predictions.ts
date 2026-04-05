import { Router, Request, Response } from 'express';
import { PredictionService } from '../services/predictionService';

const router = Router();

// GET /api/predictions/:cropId
router.get('/:cropId', async (req: Request, res: Response) => {
  try {
    const { cropId } = req.params;
    const mandiId = req.query.mandiId as string | undefined;
    const daysParam = parseInt(req.query.days as string, 10);

    // Validate days parameter
    let days = 7;
    if ([7, 14, 30].includes(daysParam)) {
      days = daysParam;
    }

    const result = await PredictionService.predict(cropId, mandiId, days);

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
