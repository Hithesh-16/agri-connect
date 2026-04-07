import { prisma } from '../config';
import { Prisma } from '@prisma/client';

export async function findSlots(
  where: Prisma.AvailabilitySlotWhereInput,
) {
  return prisma.availabilitySlot.findMany({ where });
}

export async function upsertSlot(
  providerId: string,
  date: Date,
  slotType: string,
  serviceListingId: string,
  data: Partial<{
    isAvailable: boolean;
    isBlocked: boolean;
    blockReason: string | null;
  }>,
) {
  return prisma.availabilitySlot.upsert({
    where: {
      providerId_date_slotType_serviceListingId: {
        providerId,
        date,
        slotType,
        serviceListingId,
      },
    },
    create: {
      providerId,
      date,
      slotType,
      serviceListingId: serviceListingId || null,
      isAvailable: data.isAvailable ?? true,
      isBlocked: data.isBlocked ?? false,
      blockReason: data.blockReason ?? null,
    },
    update: {
      isAvailable: data.isAvailable,
      isBlocked: data.isBlocked,
      blockReason: data.blockReason,
    },
  });
}
