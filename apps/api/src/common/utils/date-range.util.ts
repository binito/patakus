import { Prisma } from '@prisma/client';

export function buildDateRange(
  startDate?: string,
  endDate?: string,
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;
  const range: Prisma.DateTimeFilter = {};
  if (startDate) {
    const from = new Date(startDate);
    from.setUTCHours(0, 0, 0, 0);
    range.gte = from;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    range.lte = end;
  }
  return range;
}
