// Returns only the domains the user is allowed to view from the requested list
export async function getEffectiveViewDomains(prisma: any, userId: number, requestedDomains?: number[]): Promise<number[]> {
  const accessible = await getUserAccessibleDomains(prisma, userId);
  if (!requestedDomains || requestedDomains.length === 0) return accessible;
  return requestedDomains.filter(d => accessible.includes(d));
}

// Throws error if user tries to create in a domain they don't have access to
export async function validateCreateDomain(prisma: any, userId: number, requestedDomain?: number): Promise<number> {
  const accessible = await getUserAccessibleDomains(prisma, userId);
  if (!requestedDomain || !accessible.includes(requestedDomain)) {
    throw new Error(`Access denied to domain ${requestedDomain}`);
  }
  return requestedDomain;
}

// Simple per-request cache (in-memory, not persistent)
const requestCache: Record<string, any> = {};

export async function getUserAccessibleDomains(prisma: any, userId: number): Promise<number[]> {
  const cacheKey = `userAccessibleDomains:${userId}`;
  if (requestCache[cacheKey]) return requestCache[cacheKey];

  // Get direct access domains
  const directAccess = await prisma.userDomainAccess.findMany({
    where: { userId },
    select: { domainId: true },
  });
  const directDomainIds = directAccess.map((d: { domainId: number }) => d.domainId);
    console.log(`[getUserAccessibleDomains] userId=${userId}, directDomainIds=${JSON.stringify(directDomainIds)}`);
  // Expand to descendants
  const allDomainIds = await expandDomainAccess(prisma, directDomainIds);
    console.log(`[getUserAccessibleDomains] userId=${userId}, allDomainIds=${JSON.stringify(allDomainIds)}`);
  requestCache[cacheKey] = allDomainIds;
  return allDomainIds;
}

export async function getDomainDescendants(prisma: any, domainId: number): Promise<number[]> {
  // Recursive descent
  const descendants: Set<number> = new Set();
  async function recurse(id: number) {
    const children = await prisma.domain.findMany({ where: { parentId: id }, select: { id: true } });
    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        await recurse(child.id);
      }
    }
  }
  await recurse(domainId);
  return Array.from(descendants);
}

export async function expandDomainAccess(prisma: any, domainIds: number[]): Promise<number[]> {
  const expanded: Set<number> = new Set(domainIds);
  for (const id of domainIds) {
    const descendants = await getDomainDescendants(prisma, id);
      console.log(`[expandDomainAccess] domainId=${id}, descendants=${JSON.stringify(descendants)}`);
    for (const desc of descendants) expanded.add(desc);
  }
    console.log(`[expandDomainAccess] final allDomainIds=${JSON.stringify(Array.from(expanded))}`);
  return Array.from(expanded);
}

export async function isUserDomainAccessible(prisma: any, userId: number, domainId: number): Promise<boolean> {
  const accessible = await getUserAccessibleDomains(prisma, userId);
  return accessible.includes(domainId);
}

export async function buildDomainAccessWhereClause(prisma: any, userId: number): Promise<{ domainId: { in: number[] } }> {
  const accessible = await getUserAccessibleDomains(prisma, userId);
  return { domainId: { in: accessible } };
}

// For tests: clear cache between test runs
export function clearDomainAccessCache() {
  Object.keys(requestCache).forEach(k => delete requestCache[k]);
}
