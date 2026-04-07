import { Response } from 'express';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../errors/app-error';
import { WeatherService } from '../../services/weatherService';
import { cacheGet, cacheSet } from '../../config/redis';
import { CACHE_TTL } from '../../constants';

export async function getWeather(req: AuthRequest, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    throw new AppError('lat and lon query parameters are required.', 400);
  }

  const cacheKey = `weather:${lat}:${lon}`;
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }

  const weather = await WeatherService.getCurrentWeather(lat, lon);

  await cacheSet(cacheKey, weather, CACHE_TTL.WEATHER);

  sendSuccess(res, weather);
}
