import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendCreated } from '../../utils/response';
import { CALENDAR_TEMPLATES } from '../../data/calendarTemplates';

export async function getTemplates(req: AuthRequest, res: Response) {
  const cropId = req.params.cropId as string;
  const region = (req.query.region as string) || 'telangana_kharif';

  // Try database first
  const dbCalendar = await prisma.cropCalendar.findUnique({
    where: { cropId_region: { cropId, region } },
    include: { crop: true },
  });

  if (dbCalendar) {
    sendSuccess(res, dbCalendar);
    return;
  }

  // Fall back to static templates
  const templates = CALENDAR_TEMPLATES[cropId];
  if (!templates) throw new NotFoundError('Calendar template for this crop');

  const template = templates.find((t: any) => t.region === region);
  if (!template) throw new NotFoundError(`Template for region "${region}"`);

  sendSuccess(res, { cropId, region, activities: template.activities });
}

export async function getTasks(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const cropId = req.query.cropId as string | undefined;

  const where: any = { userId };
  if (cropId) where.cropId = cropId;

  const tasks = await prisma.userCalendarTask.findMany({
    where,
    orderBy: [{ scheduledFor: 'asc' }],
  });

  sendSuccess(res, tasks);
}

export async function createTasks(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { cropId, sowingDate } = req.body;

  const crop = await prisma.crop.findUnique({ where: { id: cropId } });
  if (!crop) throw new NotFoundError('Crop');

  const region = (req.query.region as string) || 'telangana_kharif';
  let activities: Array<{ week: number; activity: string; description: string; inputs?: string }> = [];

  const dbCalendar = await prisma.cropCalendar.findUnique({
    where: { cropId_region: { cropId, region } },
  });

  if (dbCalendar) {
    activities = dbCalendar.activities as any[];
  } else {
    const templates = CALENDAR_TEMPLATES[cropId];
    if (!templates) throw new NotFoundError('Calendar template for this crop');

    const template = templates.find((t: any) => t.region === region);
    if (!template) {
      activities = templates[0].activities;
    } else {
      activities = template.activities;
    }
  }

  // Delete existing tasks for this user+crop to regenerate
  await prisma.userCalendarTask.deleteMany({ where: { userId, cropId } });

  // Generate tasks from activities
  const baseDate = new Date(sowingDate);
  const tasks = activities.map((act) => {
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

  const allTasks = await prisma.userCalendarTask.findMany({
    where: { userId, cropId },
    orderBy: { scheduledFor: 'asc' },
  });

  sendCreated(res, { tasks: allTasks, count: created.count });
}

export async function toggleTask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const existing = await prisma.userCalendarTask.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Task');
  if (existing.userId !== userId) throw new ForbiddenError('Not authorized to modify this task.');

  const task = await prisma.userCalendarTask.update({
    where: { id },
    data: { isCompleted: !existing.isCompleted },
  });

  sendSuccess(res, task);
}
