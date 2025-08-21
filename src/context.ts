import { PrismaClient } from '@prisma/client';
import type { IncomingHttpHeaders } from 'http';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  headers: Record<string, string | undefined>;
  userId?: number;
  // simple per-request caches to avoid duplicate DB hits
  loadUser?: (id: number) => Promise<any | null>;
  loadDomain?: (id: number) => Promise<any | null>;
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

  // Per-request caches
  const userCache = new Map<number, any>();
  const domainCache = new Map<number, any>();

  // Simple DataLoader-like batching without external deps
  const { createUserLoader, createDomainLoader } = require('./utils/batchLoaders');
  const userLoader = createUserLoader(prisma);
  const domainLoader = createDomainLoader(prisma);

  async function loadUser(id: number) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (userCache.has(n)) return userCache.get(n);
    const u = await userLoader.load(n);
    userCache.set(n, u);
    return u;
  }

  async function loadDomain(id: number) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (domainCache.has(n)) return domainCache.get(n);
    const d = await domainLoader.load(n);
    domainCache.set(n, d);
    return d;
  }

  return { prisma, headers: normalized, userId, loadUser, loadDomain };
};
