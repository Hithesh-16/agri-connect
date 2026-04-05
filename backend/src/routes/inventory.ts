import { Router } from 'express';
import { prisma } from '../config';

const router = Router();

// GET /api/inventory - All categories with items
router.get('/', async (req, res) => {
  try {
    const categoryFilter = req.query.category as string | undefined;

    const where: any = { isActive: true };
    if (categoryFilter) {
      where.id = categoryFilter;
    }

    const categories = await prisma.inventoryCategory.findMany({
      where,
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory.' });
  }
});

// GET /api/inventory/search - Search items across all categories
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim().toLowerCase();
    if (!q) {
      res.status(400).json({ success: false, error: 'Search query "q" is required.' });
      return;
    }

    // Search in JSON name fields across all locales
    // Prisma doesn't support JSON text search natively in a cross-locale way,
    // so we fetch all active items and filter in-memory.
    const allItems = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });

    const results = allItems.filter((item) => {
      const names = item.names as Record<string, string>;
      const descriptions = (item.descriptions as Record<string, string>) || {};
      const searchFields = [
        ...Object.values(names),
        ...Object.values(descriptions),
        ...(item.tags || []),
        item.brand || '',
        item.id,
      ];
      return searchFields.some((field) => field.toLowerCase().includes(q));
    });

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to search inventory.' });
  }
});

// GET /api/inventory/:categoryId - Single category with items
router.get('/:categoryId', async (req, res) => {
  try {
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: req.params.categoryId },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found.' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch category.' });
  }
});

// GET /api/inventory/items/:itemId - Single item detail
router.get('/items/:itemId', async (req, res) => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.itemId },
      include: { category: true },
    });

    if (!item) {
      res.status(404).json({ success: false, error: 'Item not found.' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch item.' });
  }
});

export default router;
