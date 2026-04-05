import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../types';
import { CALENDAR_TEMPLATES } from '../data/calendarTemplates';

const router = Router();

// GET /api/calendar/templates/:cropId - Get calendar template for a crop
router.get('/templates/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    const region = (req.query.region as string) || 'telangana_kharif';

    // Try database first
    const dbCalendar = await prisma.cropCalendar.findUnique({
      where: { cropId_region: { cropId, region } },
      include: { crop: true },
    });

    if (dbCalendar) {
      res.json({ success: true, data: dbCalendar });
      return;
    }

    // Fall back to static templates
    const templates = CALENDAR_TEMPLATES[cropId];
    if (!templates) {
      res.status(404).json({ success: false, error: 'No calendar template found for this crop.' });
      return;
    }

    const template = templates.find(t => t.region === region);
    if (!template) {
      res.status(404).json({ success: false, error: `No template found for region "${region}".` });
      return;
    }

    res.json({
      success: true,
      data: {
        cropId,
        region,
        activities: template.activities,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch calendar template.' });
  }
});

const generateTasksSchema = z.object({
  cropId: z.string().min(1, 'cropId is required'),
  sowingDate: z.string().min(1, 'sowingDate is required'),
});

// GET /api/calendar/tasks - Get user's calendar tasks
router.get('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cropId = req.query.cropId as string | undefined;

    const where: any = { userId };
    if (cropId) {
      where.cropId = cropId;
    }

    const tasks = await prisma.userCalendarTask.findMany({
      where,
      orderBy: [{ scheduledFor: 'asc' }],
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch calendar tasks.' });
  }
});

// POST /api/calendar/tasks - Generate tasks from template
router.post('/tasks', authenticate, validate(generateTasksSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { cropId, sowingDate } = req.body;

    // Verify crop exists
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      res.status(404).json({ success: false, error: 'Crop not found.' });
      return;
    }

    // Find template - try DB first, then static
    const region = (req.query.region as string) || 'telangana_kharif';
    let activities: Array<{ week: number; activity: string; description: string; inputs?: string }> = [];

    const dbCalendar = await prisma.cropCalendar.findUnique({
      where: { cropId_region: { cropId, region } },
    });

    if (dbCalendar) {
      activities = dbCalendar.activities as any[];
    } else {
      const templates = CALENDAR_TEMPLATES[cropId];
      if (!templates) {
        res.status(404).json({ success: false, error: 'No calendar template found for this crop.' });
        return;
      }
      const template = templates.find(t => t.region === region);
      if (!template) {
        // Fall back to first available template
        activities = templates[0].activities;
      } else {
        activities = template.activities;
      }
    }

    // Delete existing tasks for this user+crop to regenerate
    await prisma.userCalendarTask.deleteMany({
      where: { userId, cropId },
    });

    // Generate tasks from activities
    const baseDate = new Date(sowingDate);
    const tasks = activities.map(act => {
      const scheduledFor = new Date(baseDate);
      scheduledFor.setDate(scheduledFor.getDate() + (act.week - 1) * 7);

      return {
        userId,
        cropId,
        activity: act.activity,
        description: act.description + (act.inputs ? ` | Inputs: ${act.inputs}` : ''),
        week: act.week,
        scheduledFor,
        isCompleted: false,
      };
    });

    const created = await prisma.userCalendarTask.createMany({ data: tasks });

    // Fetch the created tasks
    const allTasks = await prisma.userCalendarTask.findMany({
      where: { userId, cropId },
      orderBy: { scheduledFor: 'asc' },
    });

    res.status(201).json({ success: true, data: allTasks, count: created.count });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to generate calendar tasks.' });
  }
});

// PATCH /api/calendar/tasks/:id - Toggle task completion
router.patch('/tasks/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.userCalendarTask.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Task not found.' });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to modify this task.' });
      return;
    }

    const task = await prisma.userCalendarTask.update({
      where: { id },
      data: { isCompleted: !existing.isCompleted },
    });

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update task.' });
  }
});

export default router;
