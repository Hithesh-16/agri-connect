import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ENDPOINTS } from '../../constants';
import { generateTasksSchema } from '../../validations/calendar';
import * as calendarController from '../controllers/calendar-controller';

const router = Router();
const E = ENDPOINTS.CALENDAR;

router.get(E.TEMPLATES, asyncHandler(calendarController.getTemplates));
router.get(E.TASKS, authenticate, asyncHandler(calendarController.getTasks));
router.post(E.CREATE_TASK, authenticate, validate(generateTasksSchema), asyncHandler(calendarController.createTasks));
router.patch(E.UPDATE_TASK, authenticate, asyncHandler(calendarController.toggleTask));

export default router;
