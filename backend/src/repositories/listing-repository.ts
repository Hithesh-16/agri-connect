import { prisma } from '../config';
import { Prisma } from '@prisma/client';

// ─── LISTING ────────────────────────────────────────────

export async function findById(id: string, include?: Prisma.ListingInclude) {
  return prisma.listing.findUnique({ where: { id }, include });
}

export async function findMany(
  where: Prisma.ListingWhereInput,
  pagination: { skip: number; take: number },
  include?: Prisma.ListingInclude,
  orderBy?: Prisma.ListingOrderByWithRelationInput,
) {
  return Promise.all([
    prisma.listing.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    }),
    prisma.listing.count({ where }),
  ]);
}

export async function create(data: Prisma.ListingCreateInput) {
  return prisma.listing.create({ data });
}

export async function update(id: string, data: Prisma.ListingUpdateInput) {
  return prisma.listing.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.listing.delete({ where: { id } });
}

// ─── INQUIRY ────────────────────────────────────────────

export async function createInquiry(data: Prisma.InquiryCreateInput) {
  return prisma.inquiry.create({ data });
}
