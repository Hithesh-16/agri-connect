import { Response } from 'express';
import { AuthRequest } from '../../types';
import { sendSuccess } from '../../utils/response';
import { NotFoundError, AppError } from '../../errors/app-error';
import { INVENTORY_CATEGORIES } from '../../data/inventoryData';

export async function list(req: AuthRequest, res: Response) {
  const category = req.query.category as string | undefined;

  let categories = INVENTORY_CATEGORIES;
  if (category) {
    categories = categories.filter((c) => c.id === category);
  }

  sendSuccess(res, categories);
}

export async function search(req: AuthRequest, res: Response) {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) throw new AppError('Search query "q" is required.', 400);

  const results: any[] = [];

  for (const cat of INVENTORY_CATEGORIES) {
    for (const item of cat.items) {
      const nameMatch =
        item.names.en.toLowerCase().includes(q) ||
        item.names.te.includes(q) ||
        item.names.hi.includes(q);

      if (nameMatch) {
        results.push({ ...item, categoryId: cat.id, categoryName: cat.names.en });
      }
    }
  }

  sendSuccess(res, results);
}

export async function byCategory(req: AuthRequest, res: Response) {
  const { categoryId } = req.params;

  const category = INVENTORY_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new NotFoundError('Inventory category');

  sendSuccess(res, category);
}

export async function itemDetail(req: AuthRequest, res: Response) {
  const { itemId } = req.params;

  for (const cat of INVENTORY_CATEGORIES) {
    const item = cat.items.find((i) => i.id === itemId);
    if (item) {
      sendSuccess(res, { ...item, categoryId: cat.id, categoryName: cat.names.en });
      return;
    }
  }

  throw new NotFoundError('Inventory item');
}
