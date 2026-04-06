import { Router, Response } from 'express';
import { WeatherService } from '../services/weatherService';
import { cacheGet, cacheSet, CACHE_TTL } from '../config/redis';

const router = Router();

// GET /api/weather?lat=17.977&lon=79.601
router.get('/', async (req, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 17.977;
    const lon = parseFloat(req.query.lon as string) || 79.601;

    // Cache by rounded coordinates (0.1 degree ~ 11km)
    const cacheKey = `weather:${lat.toFixed(1)}:${lon.toFixed(1)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const weather = await WeatherService.getCurrentWeather(lat, lon);
    await cacheSet(cacheKey, weather, CACHE_TTL.WEATHER);
    res.json({ success: true, data: weather });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch weather data.' });
  }
});

export default router;
