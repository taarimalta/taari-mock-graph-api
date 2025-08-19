import { PrismaClient } from '@prisma/client';
import type { IncomingHttpHeaders } from 'http';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  headers: Record<string, string | undefined>;
  userId?: number;
}

export const createContext = (headers: IncomingHttpHeaders = {}): Context => {
  const normalized: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (Array.isArray(v)) {
      normalized[k] = v.join(',');
    } else {
      normalized[k] = v;
    }
  }

  // Parse user ID from x-user-id header if present
  const rawUserId = normalized['x-user-id'] || normalized['x-userid'] || normalized['userid'];
  const parsed = rawUserId !== undefined ? Number(rawUserId) : undefined;
  const userId = parsed !== undefined && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

  return { prisma, headers: normalized, userId };
};
