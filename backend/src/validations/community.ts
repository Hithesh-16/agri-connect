import { z } from 'zod';

export const createPostSchema = z.object({
  type: z.enum(['question', 'success_story', 'tip', 'pest_help']),
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required').max(10000),
  cropId: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  images: z.array(z.string()).optional(),
});
