import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../../src/schema/typeDefs';
import { countryResolvers } from '../../src/resolvers/country';
import { animalResolvers } from '../../src/resolvers/animal';
import { userResolvers } from '../../src/resolvers/user';
import { createContext } from '../../src/context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User query', () => {
  let server: any;
  beforeAll(async () => {
    // Ensure a user exists in the test DB
    await prisma.user.deleteMany({});
    await prisma.user.create({ data: { username: 'testuser', email: 'test@example.com', firstName: 'Test', lastName: 'User' } });

    server = new ApolloServer({
      typeDefs,
      resolvers: [countryResolvers, animalResolvers, userResolvers],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
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

  it('returns user by id when x-user-id header present', async () => {
    const created = await prisma.user.findFirst({ where: { username: 'testuser' } });
    const res = await exec(
      { query: `query { user(id: ${created?.id}) { id username email } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    expect(res.errors).toBeUndefined();
    expect(res.data.user).toBeDefined();
    // Normalize id to string for predictable assertion
    expect(String(res.data.user.id)).toBe(String(created?.id));
    expect(res.data.user.username).toBe('testuser');
    expect(res.data.user.email).toBe('test@example.com');
  });

  it('errors if x-user-id header missing', async () => {
    const created = await prisma.user.findFirst({ where: { username: 'testuser' } });
    const res = await exec({ query: `query { user(id: ${created?.id}) { id } }` });
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
  });

  it('returns null for non-existent user', async () => {
    const res = await exec(
      { query: `query { user(id: 999999) { id username } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    expect(res.errors).toBeUndefined();
    expect(res.data.user).toBeNull();
  });
});
