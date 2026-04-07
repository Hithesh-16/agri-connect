import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../../constants';

import authRoutes from './auth';
import cropRoutes from './crops';
import mandiRoutes from './mandis';
import priceRoutes from './prices';
import weatherRoutes from './weather';
import newsRoutes from './news';
import scannerRoutes from './scanner';
import supplyChainRoutes from './supply-chain';
import userRoutes from './user';
import priceHistoryRoutes from './price-history';
import alertRoutes from './alerts';
import calendarRoutes from './calendar';
import listingRoutes from './listings';
import schemeRoutes from './schemes';
import inventoryRoutes from './inventory';
import communityRoutes from './community';
import roleRoutes from './roles';
import uploadRoutes from './upload';
import providerRoutes from './providers';
import serviceRoutes from './services';
import bookingRoutes from './bookings';
import availabilityRoutes from './availability';
import chatRoutes from './chat';
import notificationRoutes from './notifications';
import deviceRoutes from './devices';
import paymentRoutes from './payments';
import teamRoutes from './teams';
import jobRoutes from './jobs';
import attendanceRoutes from './attendance';

const v1 = Router();

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Please try again later.' },
});

v1.use('/auth', authLimiter, authRoutes);
v1.use('/crops', cropRoutes);
v1.use('/mandis', mandiRoutes);
v1.use('/prices/history', priceHistoryRoutes);
v1.use('/prices', priceRoutes);
v1.use('/weather', weatherRoutes);
v1.use('/news', newsRoutes);
v1.use('/scanner', scannerRoutes);
v1.use('/supply-chain', supplyChainRoutes);
v1.use('/users', userRoutes);
v1.use('/alerts', alertRoutes);
v1.use('/calendar', calendarRoutes);
v1.use('/listings', listingRoutes);
v1.use('/schemes', schemeRoutes);
v1.use('/inventory', inventoryRoutes);
v1.use('/community', communityRoutes);
v1.use('/rbac', roleRoutes);
v1.use('/upload', uploadRoutes);
v1.use('/providers', providerRoutes);
v1.use('/services', serviceRoutes);
v1.use('/bookings', bookingRoutes);
v1.use('/availability', availabilityRoutes);
v1.use('/chat', chatRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/devices', deviceRoutes);
v1.use('/payments', paymentRoutes);
v1.use('/teams', teamRoutes);
v1.use('/jobs', jobRoutes);
v1.use('/attendance', attendanceRoutes);

export default v1;
