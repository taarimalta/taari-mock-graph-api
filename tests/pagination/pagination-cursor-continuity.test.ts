import { paginate, encodeCursor, decodeCursor } from '../../src/utils/pagination';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Cursor-based Pagination', () => {
  let model: any;
  beforeAll(() => {
    model = prisma.animal;
  });

  it('should return different items when using endCursor for next page (cursor continuity)', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    // First page
    const page1 = await paginate({
      model,
      where: {},
      orderBy,
      first: 2,
    });
    const page1Ids = page1.items.map((item: any) => item.id);
    const endCursor = page1.pagination.endCursor;
    expect(endCursor).toBeTruthy();
    // Second page
    const page2 = await paginate({
      model,
      where: {},
      orderBy,
      first: 2,
      after: endCursor ?? undefined,
    });
    const page2Ids = page2.items.map((item: any) => item.id);
    // No overlap
    page1Ids.forEach((id: any) => {
      expect(page2Ids).not.toContain(id);
    });
  });

  it('should encode and decode compound cursor correctly', async () => {
    const cursorData = {
      id: 1,
      orderFields: ['name', 'id'],
      orderValues: ['Lion', 1],
      direction: 'ASC' as const,
    };
    const encoded = encodeCursor(cursorData);
    const decoded = decodeCursor(encoded);
    expect(decoded).toMatchObject(cursorData);
  });

  it('should support compound sorting', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    const page = await paginate({
      model,
      where: {},
      orderBy,
      first: 5,
    });
    // Items should be sorted by name, then id
    for (let i = 1; i < page.items.length; i++) {
      const prev = page.items[i - 1];
      const curr = page.items[i];
      if (prev.name === curr.name) {
        expect(prev.id).toBeLessThan(curr.id);
      } else {
        expect(prev.name <= curr.name).toBe(true);
      }
    }
  });

  it('should handle backward pagination', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    const page = await paginate({
      model,
      where: {},
      orderBy,
      last: 2,
    });
    expect(page.items.length).toBeLessThanOrEqual(2);
  });

  it('should handle malformed cursor gracefully', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    const page = await paginate({
      model,
      where: {},
      orderBy,
      first: 2,
      after: 'not-a-valid-cursor',
    });
    expect(Array.isArray(page.items)).toBe(true);
  });

  it('should handle empty result sets', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    const page = await paginate({
      model,
      where: { name: 'ZZZZZZZZZZ' },
      orderBy,
      first: 2,
    });
    expect(page.items.length).toBe(0);
  });

  it('should handle single item pages', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    const page = await paginate({
      model,
      where: {},
      orderBy,
      first: 1,
    });
    expect(page.items.length).toBeLessThanOrEqual(1);
  });

  it('should handle boundary conditions (first/last page)', async () => {
    const orderBy = [{ name: 'asc' }, { id: 'asc' }];
    // First page
    const firstPage = await paginate({
      model,
      where: {},
      orderBy,
      first: 2,
    });
    expect(firstPage.pagination.hasPrevious).toBe(false);
    // Last page
    const lastPage = await paginate({
      model,
      where: {},
      orderBy,
      last: 2,
    });
    expect(lastPage.pagination.hasNext).toBe(false);
  });
});
