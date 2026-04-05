import { Router, Response } from 'express';
import { WeatherService } from '../services/weatherService';

const router = Router();

// GET /api/weather?lat=17.977&lon=79.601
router.get('/', async (req, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 17.977;
    const lon = parseFloat(req.query.lon as string) || 79.601;
    const weather = await WeatherService.getCurrentWeather(lat, lon);
    res.json({ success: true, data: weather });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch weather data.' });
  }
});

export default router;
