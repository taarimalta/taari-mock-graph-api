import { PrismaClient } from '@prisma/client';
import type { IncomingHttpHeaders } from 'http';

process.env.DATABASE_URL = 'file:./prisma/dev.db';
const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  headers: Record<string, string | undefined>;
  userId?: number;
  viewDomains?: number[];
  createDomain?: number;
  // simple per-request caches to avoid duplicate DB hits
  loadUser?: (id: number) => Promise<any | null>;
  loadDomain?: (id: number) => Promise<any | null>;
}

export const createContext = (headers: IncomingHttpHeaders = {}, prismaOverride?: PrismaClient): Context => {
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

  // Parse view domains header
  const rawViewDomains = normalized['x-view-domains'];
  const viewDomains = rawViewDomains
    ? rawViewDomains.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0)
    : undefined;

  // Parse create domain header
  const rawCreateDomain = normalized['x-create-domain'];
  const createDomain = rawCreateDomain && Number.isFinite(Number(rawCreateDomain)) && Number(rawCreateDomain) > 0
    ? Number(rawCreateDomain)
    : undefined;

  // Per-request caches
  const userCache = new Map<number, any>();
  const domainCache = new Map<number, any>();

  // Simple DataLoader-like batching without external deps
  const { createUserLoader, createDomainLoader } = require('./utils/batchLoaders');
  const client = prismaOverride || prisma;
  const userLoader = createUserLoader(client);
  const domainLoader = createDomainLoader(client);

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

  return { prisma: client, headers: normalized, userId, viewDomains, createDomain, loadUser, loadDomain };
};
