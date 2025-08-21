import type { PrismaClient } from '@prisma/client';

// Very small DataLoader-like batching utility to avoid adding an external dependency.
// It batches keys within the same tick and caches results per-request.
function createBatchedLoader<T, K extends number>(batchFn: (keys: K[]) => Promise<T[]>, idAccessor: (item: T) => number) {
  const cache = new Map<number, T | null>();
  let queue: Array<{ key: number; resolve: (v: T | null) => void; reject: (e: any) => void }> = [];
  let scheduled = false;

  async function flush() {
    scheduled = false;
    const batch = queue;
    queue = [];
    const uniqueKeys = Array.from(new Set(batch.map((b) => b.key)));
    try {
      const rows = await batchFn(uniqueKeys as K[]);
      const map = new Map<number, T>();
      for (const r of rows) map.set(idAccessor(r), r);
      for (const item of batch) {
        const v = map.has(item.key) ? (map.get(item.key) as T) : null;
        cache.set(item.key, v);
        item.resolve(v);
      }
    } catch (e) {
      for (const item of batch) item.reject(e);
    }
  }

  return {
    async load(key: number) {
      const n = Number(key);
      if (!Number.isFinite(n) || n <= 0) return null;
      if (cache.has(n)) return cache.get(n) ?? null;
      return new Promise<T | null>((resolve, reject) => {
        queue.push({ key: n, resolve, reject });
        if (!scheduled) {
          scheduled = true;
          // schedule a microtask to batch all loads in the same tick
          Promise.resolve().then(flush);
        }
      });
    },
    clear(key: number) {
      cache.delete(key);
    },
    prime(key: number, value: T | null) {
      cache.set(key, value);
    },
  };
}

export function createUserLoader(prisma: PrismaClient) {
  return createBatchedLoader(async (keys: number[]) => {
    const rows = await prisma.user.findMany({ where: { id: { in: keys } } });
    return rows as any[];
  }, (r) => (r as any).id);
}

export function createDomainLoader(prisma: PrismaClient) {
  return createBatchedLoader(async (keys: number[]) => {
    const rows = await prisma.domain.findMany({ where: { id: { in: keys } } });
    return rows as any[];
  }, (r) => (r as any).id);
}
