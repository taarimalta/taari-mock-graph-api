import { ApolloServer } from '@apollo/server';
import { createContext } from '../../src/context';
import { typeDefs } from '../../src/schema/typeDefs';
import { animalResolvers } from '../../src/resolvers/animal';
import { PrismaClient } from '@prisma/client';
import { seedTestData } from '../../prisma/seed';

const server: any = new ApolloServer({
  typeDefs,
  resolvers: [animalResolvers],
});

const exec = async (op: any, ctx?: any) => {
  if (ctx?.req?.headers) {
    const contextValue = createContext(ctx.req.headers);
    const res = await server.executeOperation(op, { contextValue });
    const anyRes: any = res as any;
    if (anyRes?.body?.kind === 'single') return anyRes.body.singleResult;
    return anyRes as any;
  }
  const res = await server.executeOperation(op, ctx);
  const anyRes: any = res as any;
  if (anyRes?.body?.kind === 'single') return anyRes.body.singleResult;
  return anyRes as any;
};

describe('Cursor Pagination - API scenario', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    const prisma = new PrismaClient();
    await seedTestData(prisma);
    await prisma.$disconnect();
  });

  it('returns same data for first page and after-cursor page (bug reproduction)', async () => {
    // First page: exactly as in curl
    const firstRes = await exec({
      query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`,
    }, { req: { headers: { 'x-user-id': '1' } }, res: {} });
    const firstData = firstRes.data.animalsPaginated.data;
    const firstPageNames = firstData.map((a: any) => a.name);
    const endCursor = firstRes.data.animalsPaginated.pagination.endCursor;
    console.log('DEBUG: First page animal names:', firstPageNames);
    console.log('DEBUG: First page endCursor:', endCursor);

    // After-cursor page: exactly as in curl
    const afterRes = await exec({
      query: `query { animalsPaginated(args: { first: 2, after: "${endCursor}" }) { data { id name } pagination { hasPrevious startCursor endCursor } } }`,
    }, { req: { headers: { 'x-user-id': '1' } }, res: {} });
    const afterData = afterRes.data.animalsPaginated.data;
    const afterPageNames = afterData.map((a: any) => a.name);
    console.log('DEBUG: After-cursor animal names:', afterPageNames);
    console.log('DEBUG: After-cursor pagination:', afterRes.data.animalsPaginated.pagination);

    // Assert that after-cursor page is not the same as first page
    expect(afterPageNames).not.toEqual(firstPageNames);
    // Assert no overlap between pages
    const afterPageIds = afterData.map((a: any) => a.id);
    const firstPageIds = firstData.map((a: any) => a.id);
    firstPageIds.forEach(id => {
      expect(afterPageIds).not.toContain(id);
    });
  });

  it('handles after cursor passed as decoded object (not string) and paginates correctly', async () => {
    // First page
    const firstRes = await exec({
      query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`,
    }, { req: { headers: { 'x-user-id': '1' } }, res: {} });
    const firstData = firstRes.data.animalsPaginated.data;
    const firstPageNames = firstData.map((a: any) => a.name);
    const endCursor = firstRes.data.animalsPaginated.pagination.endCursor;

    // Decode the cursor to simulate a client passing an object
    const decodedCursor = JSON.parse(Buffer.from(endCursor, 'base64').toString('utf8'));

    // After-cursor page: pass decoded object as after inline in the query
    const afterRes = await exec({
      query: `query { animalsPaginated(args: { first: 2, after: { id: ${decodedCursor.id}, orderFields: ["${decodedCursor.orderFields[0]}", "${decodedCursor.orderFields[1]}"], orderValues: ["${decodedCursor.orderValues[0]}", ${decodedCursor.orderValues[1]}], direction: "${decodedCursor.direction}" } }) { data { id name } pagination { hasPrevious startCursor endCursor } } }`,
    }, { req: { headers: { 'x-user-id': '1' } }, res: {} });
    const afterData = afterRes.data.animalsPaginated.data;
    const afterPageNames = afterData.map((a: any) => a.name);
    console.log('DEBUG: After-cursor (object) animal names:', afterPageNames);
    console.log('DEBUG: After-cursor (object) pagination:', afterRes.data.animalsPaginated.pagination);

    // Assert that after-cursor page is not the same as first page
    expect(afterPageNames).not.toEqual(firstPageNames);
    // Assert no overlap between pages
    const afterPageIds = afterData.map((a: any) => a.id);
    const firstPageIds = firstData.map((a: any) => a.id);
    firstPageIds.forEach(id => {
      expect(afterPageIds).not.toContain(id);
    });
  });
});
