import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../../src/schema/typeDefs';
import { userResolvers } from '../../src/resolvers/user';
import { countryResolvers } from '../../src/resolvers/country';
import { animalResolvers } from '../../src/resolvers/animal';
import { createContext } from '../../src/context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('usersPaginated integration', () => {
  let server: any;
  beforeAll(async () => {
    await prisma.user.deleteMany({});
    // create 3 users
    await prisma.user.createMany({ data: [
      { username: 'alice_test', email: 'alice@test.example' },
      { username: 'bob_test', email: 'bob@test.example' },
      { username: 'carol_test', email: 'carol@test.example' },
    ]});

    server = new ApolloServer({ typeDefs, resolvers: [countryResolvers, animalResolvers, userResolvers] });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
    await server?.stop?.();
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

  it('errors without x-user-id header', async () => {
    const res = await exec({ query: `query { usersPaginated(args: { first: 1 }) { data { id username } pagination { totalCount } } }` });
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header is required/);
  });

  it('returns paginated users with header', async () => {
    const res = await exec(
      { query: `query { usersPaginated(args: { first: 2 }) { data { id username email } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );

    expect(res.errors).toBeUndefined();
    expect(Array.isArray(res.data?.usersPaginated.data)).toBe(true);
    expect(typeof res.data?.usersPaginated.pagination.totalCount).toBe('number');
    expect(res.data?.usersPaginated.data.length).toBeLessThanOrEqual(2);
  });

  it('honors orderBy direction', async () => {
    const resAsc = await exec({ query: `query { usersPaginated(orderBy: { field: USERNAME, direction: ASC }, args: { first: 3 }) { data { username } } }` }, { req: { headers: { 'x-user-id': '1' } }, res: {} } as any);
    const resDesc = await exec({ query: `query { usersPaginated(orderBy: { field: USERNAME, direction: DESC }, args: { first: 3 }) { data { username } } }` }, { req: { headers: { 'x-user-id': '1' } }, res: {} } as any);

    const asc = resAsc.data?.usersPaginated.data.map((d: any) => d.username) || [];
    const desc = resDesc.data?.usersPaginated.data.map((d: any) => d.username) || [];
    if (asc.length >= 2 && desc.length >= 2) {
      expect(asc[0]).not.toBe(desc[0]);
    }
  });
});
