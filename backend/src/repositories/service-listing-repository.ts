import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── SERVICE LISTING ────────────────────────────────────

export async function findById(id: string, include?: Prisma.ServiceListingInclude) {
  return prisma.serviceListing.findUnique({ where: { id }, include });
}

export async function findMany(
  where: Prisma.ServiceListingWhereInput,
  pagination: { skip: number; take: number },
  include?: Prisma.ServiceListingInclude,
) {
  return Promise.all([
    prisma.serviceListing.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include,
    }),
    prisma.serviceListing.count({ where }),
  ]);
}

export async function create(data: Prisma.ServiceListingCreateInput) {
  return prisma.serviceListing.create({ data });
}

export async function update(id: string, data: Prisma.ServiceListingUpdateInput) {
  return prisma.serviceListing.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.serviceListing.delete({ where: { id } });
}

// ─── SERVICE CATEGORY ───────────────────────────────────

export async function findCategories(where?: Prisma.ServiceCategoryWhereInput) {
  return prisma.serviceCategory.findMany({
    where: where || { isActive: true },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function findCategoryById(id: string) {
  return prisma.serviceCategory.findUnique({ where: { id } });
}
