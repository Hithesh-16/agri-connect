import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { updateProfileSchema, updateCropsSchema, updateMandisSchema } from '../../validations/users';
import * as userController from '../controllers/user-controller';

const router = Router();
const E = ENDPOINTS.USERS;

router.use(authenticate);

router.get(E.PROFILE, asyncHandler(userController.getProfile));
router.patch(E.PROFILE, validate(updateProfileSchema), asyncHandler(userController.updateProfile));
router.get(E.CROPS, asyncHandler(userController.getCrops));
router.put(E.CROPS, validate(updateCropsSchema), asyncHandler(userController.updateCrops));
router.get(E.MANDIS, asyncHandler(userController.getMandis));
router.put(E.MANDIS, validate(updateMandisSchema), asyncHandler(userController.updateMandis));

export default router;
