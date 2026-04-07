import { prisma } from '../config';
import { Prisma } from '@prisma/client';

export async function findById(id: string, include?: Prisma.ServiceProviderInclude) {
  return prisma.serviceProvider.findUnique({ where: { id }, include });
}

export async function findByUserId(userId: string, include?: Prisma.ServiceProviderInclude) {
  return prisma.serviceProvider.findUnique({ where: { userId }, include });
}

export async function create(data: Prisma.ServiceProviderCreateInput) {
  return prisma.serviceProvider.create({ data });
}

export async function update(id: string, data: Prisma.ServiceProviderUpdateInput) {
  return prisma.serviceProvider.update({ where: { id }, data });
}

export async function findMany(
  where: Prisma.ServiceProviderWhereInput,
  pagination: { skip: number; take: number },
  include?: Prisma.ServiceProviderInclude,
) {
  return Promise.all([
    prisma.serviceProvider.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
      include,
    }),
    prisma.serviceProvider.count({ where }),
  ]);
}
