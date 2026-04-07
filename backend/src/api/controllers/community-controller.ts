import { Response } from 'express';
import { AuthRequest } from '../../types';
import { prisma } from '../../config';
import { paginate } from '../../utils/pagination';
import { NotFoundError, ForbiddenError } from '../../errors/app-error';
import { sendSuccess, sendCreated, sendMessage } from '../../utils/response';

const userSelect = { id: true, firstName: true, surname: true, village: true, district: true, profilePhoto: true };

export async function list(req: AuthRequest, res: Response) {
  const { page, limit, skip } = paginate(req.query.page as string, req.query.limit as string);
  const type = req.query.type as string | undefined;
  const cropId = req.query.cropId as string | undefined;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (cropId) where.cropId = cropId;

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      include: {
        user: { select: userSelect },
        crop: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.communityPost.count({ where }),
  ]);

  sendSuccess(res, posts, { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function detail(req: AuthRequest, res: Response) {
  const post = await prisma.communityPost.findUnique({
    where: { id: req.params.id as string },
    include: {
      user: { select: userSelect },
      crop: true,
      comments: {
        include: { user: { select: userSelect } },
        orderBy: [{ isAnswer: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!post) throw new NotFoundError('Post');

  sendSuccess(res, post);
}

export async function create(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { type, title, content, cropId, images, tags, location } = req.body;

  if (cropId) {
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) throw new NotFoundError('Crop');
  }

  const post = await prisma.communityPost.create({
    data: {
      userId,
      type,
      title,
      content,
      cropId: cropId || null,
      images: images || [],
      tags: tags || [],
      location: location || null,
    },
    include: {
      user: { select: userSelect },
      crop: true,
    },
  });

  sendCreated(res, post);
}

export async function addComment(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const postId = req.params.id as string;
  const { content, images } = req.body;

  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  const comment = await prisma.communityComment.create({
    data: {
      postId,
      userId,
      content,
      images: images || [],
    },
    include: { user: { select: userSelect } },
  });

  sendCreated(res, comment);
}

export async function upvote(req: AuthRequest, res: Response) {
  const postId = req.params.id as string;

  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  const updated = await prisma.communityPost.update({
    where: { id: postId },
    data: { upvotes: { increment: 1 } },
  });

  sendSuccess(res, { upvotes: updated.upvotes });
}

export async function markAnswer(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const commentId = req.params.id as string;

  const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError('Comment');

  const parentPost = await prisma.communityPost.findUnique({ where: { id: comment.postId } });
  if (!parentPost) throw new NotFoundError('Parent post');

  if (parentPost.userId !== userId) {
    throw new ForbiddenError('Only the post author can mark an accepted answer.');
  }

  const updated = await prisma.communityComment.update({
    where: { id: commentId },
    data: { isAnswer: true },
  });

  sendSuccess(res, updated);
}

export async function remove(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const postId = req.params.id as string;

  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post');

  if (post.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this post.');
  }

  await prisma.communityPost.delete({ where: { id: postId } });

  sendMessage(res, 'Post deleted.');
}
