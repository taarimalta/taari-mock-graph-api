import { getUserAccessibleDomains, buildDomainAccessWhereClause, isUserDomainAccessible, getDomainDescendants, expandDomainAccess, clearDomainAccessCache } from '../../src/utils/domainAccess';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Domain Access Utilities', () => {
  const { cleanupTestData } = require('../global/setup');
  beforeAll(async () => {
    await cleanupTestData();
    // Seed test data: domains, users, user-domain-access
    await prisma.domain.createMany({
      data: [
        { id: 1, name: 'Root', parentId: null },
        { id: 2, name: 'Child', parentId: 1 },
        { id: 3, name: 'Grandchild', parentId: 2 },
        { id: 4, name: 'Unrelated', parentId: null },
      ]
    });
    await prisma.user.createMany({
      data: [
        { id: 10, username: 'alice', email: 'alice@example.com' },
        { id: 11, username: 'bob', email: 'bob@example.com' },
        { id: 12, username: 'charlie', email: 'charlie@example.com' },
      ]
    });
    await prisma.userDomainAccess.createMany({
      data: [
        { userId: 10, domainId: 1 }, // Alice: root
        { userId: 11, domainId: 2 }, // Bob: child
        { userId: 12, domainId: 4 }, // Charlie: unrelated
      ]
    });
  });

  afterAll(async () => {
    await prisma.userDomainAccess.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.domain.deleteMany({});
    await prisma.$disconnect();
    clearDomainAccessCache();
  });

  test('getUserAccessibleDomains: direct and inherited', async () => {
    const aliceDomains = await getUserAccessibleDomains(prisma, 10); // Should include 1,2,3
    expect(aliceDomains).toEqual(expect.arrayContaining([1,2,3]));
    expect(aliceDomains).not.toContain(4);

    const bobDomains = await getUserAccessibleDomains(prisma, 11); // Should include 2,3
    expect(bobDomains).toEqual(expect.arrayContaining([2,3]));
    expect(bobDomains).not.toContain(1);
    expect(bobDomains).not.toContain(4);

    const charlieDomains = await getUserAccessibleDomains(prisma, 12); // Should include only 4
    expect(charlieDomains).toEqual([4]);
  });

  test('getDomainDescendants: recursive', async () => {
    const descendants1 = await getDomainDescendants(prisma, 1); // Should be [2,3]
    expect(descendants1).toEqual(expect.arrayContaining([2,3]));
    const descendants2 = await getDomainDescendants(prisma, 2); // Should be [3]
    expect(descendants2).toEqual([3]);
    const descendants4 = await getDomainDescendants(prisma, 4); // Should be []
    expect(descendants4).toEqual([]);
  });

  test('expandDomainAccess: expands all descendants', async () => {
    const expanded = await expandDomainAccess(prisma, [1]); // Should be [1,2,3]
    expect(expanded).toEqual(expect.arrayContaining([1,2,3]));
    expect(expanded).not.toContain(4);
  });

  test('isUserDomainAccessible: true/false', async () => {
    expect(await isUserDomainAccessible(prisma, 10, 3)).toBe(true); // Alice can access grandchild
    expect(await isUserDomainAccessible(prisma, 11, 1)).toBe(false); // Bob cannot access root
    expect(await isUserDomainAccessible(prisma, 12, 2)).toBe(false); // Charlie cannot access child
    expect(await isUserDomainAccessible(prisma, 12, 4)).toBe(true); // Charlie can access unrelated
  });

  test('buildDomainAccessWhereClause: returns correct clause', async () => {
    const clause = await buildDomainAccessWhereClause(prisma, 10);
    expect(clause).toHaveProperty('domainId');
    expect(clause.domainId.in).toEqual(expect.arrayContaining([1,2,3]));
  });

  test('Caching: repeated calls do not duplicate queries', async () => {
    // This test is a placeholder for memoization checks
    // Could use spies/mocks to verify query count if implemented
    const first = await getUserAccessibleDomains(prisma, 10);
    const second = await getUserAccessibleDomains(prisma, 10);
    expect(second).toEqual(first);
  });
});
