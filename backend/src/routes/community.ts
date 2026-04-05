import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthRequest, paginate, paginatedResponse } from '../types';

const router = Router();

const createPostSchema = z.object({
  type: z.enum(['question', 'success_story', 'tip', 'pest_help']),
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required').max(10000),
  cropId: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  images: z.array(z.string()).optional(),
});

// GET /api/community - List posts
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query.page as string | undefined, req.query.limit as string | undefined);
    const type = req.query.type as string | undefined;
    const cropId = req.query.cropId as string | undefined;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (cropId) where.cropId = cropId;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, surname: true, village: true, district: true, profilePhoto: true } },
          crop: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(posts, total, page, limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch community posts.' });
  }
});

// GET /api/community/:id - Single post with comments
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, surname: true, village: true, district: true, profilePhoto: true } },
        crop: true,
        comments: {
          include: {
            user: { select: { id: true, firstName: true, surname: true, village: true, district: true, profilePhoto: true } },
          },
          orderBy: [{ isAnswer: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch post.' });
  }
});

// POST /api/community - Create post
router.post('/', authenticate, validate(createPostSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as z.infer<typeof createPostSchema>;

    // Verify crop exists if provided
    if (body.cropId) {
      const crop = await prisma.crop.findUnique({ where: { id: body.cropId } });
      if (!crop) {
        res.status(404).json({ success: false, error: 'Crop not found.' });
        return;
      }
    }

    const post = await prisma.communityPost.create({
      data: {
        userId,
        type: body.type,
        title: body.title,
        content: body.content,
        cropId: body.cropId || null,
        images: body.images || [],
        tags: body.tags || [],
        location: body.location || null,
      },
      include: {
        user: { select: { id: true, firstName: true, surname: true, village: true, district: true, profilePhoto: true } },
        crop: true,
      },
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create post.' });
  }
});

// POST /api/community/:id/comments - Add comment
router.post('/:id/comments', authenticate, validate(createCommentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;
    const body = req.body as z.infer<typeof createCommentSchema>;

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        userId,
        content: body.content,
        images: body.images || [],
      },
      include: {
        user: { select: { id: true, firstName: true, surname: true, village: true, district: true, profilePhoto: true } },
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add comment.' });
  }
});

// POST /api/community/:id/upvote - Upvote a post
router.post('/:id/upvote', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id as string;
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: { upvotes: { increment: 1 } },
    });

    res.json({ success: true, data: { upvotes: updated.upvotes } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upvote post.' });
  }
});

// PATCH /api/community/comments/:id/answer - Mark comment as accepted answer
router.patch('/comments/:id/answer', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const commentId = req.params.id as string;

    // Fetch comment and its parent post to check ownership
    const comment = await prisma.communityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found.' });
      return;
    }

    const parentPost = await prisma.communityPost.findUnique({
      where: { id: comment.postId },
    });

    if (!parentPost) {
      res.status(404).json({ success: false, error: 'Parent post not found.' });
      return;
    }

    // Only the post owner can mark an answer
    if (parentPost.userId !== userId) {
      res.status(403).json({ success: false, error: 'Only the post author can mark an accepted answer.' });
      return;
    }

    const updated = await prisma.communityComment.update({
      where: { id: commentId },
      data: { isAnswer: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark answer.' });
  }
});

// DELETE /api/community/:id - Delete own post
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const postId = req.params.id as string;

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found.' });
      return;
    }

    if (post.userId !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this post.' });
      return;
    }

    await prisma.communityPost.delete({ where: { id: postId } });

    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete post.' });
  }
});

export default router;
