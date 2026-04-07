import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import * as weatherController from '../controllers/weather-controller';

const router = Router();
const E = ENDPOINTS.WEATHER;

router.get(E.GET, asyncHandler(weatherController.getWeather));

export default router;
