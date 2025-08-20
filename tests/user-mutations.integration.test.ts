import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/schema/typeDefs';
import { userResolvers } from '../src/resolvers/user';
import { countryResolvers } from '../src/resolvers/country';
import { animalResolvers } from '../src/resolvers/animal';
import { createContext } from '../src/context';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('user mutations integration', () => {
  let server: any;
  let modifierId: number;
  beforeAll(async () => {
    await prisma.user.deleteMany({});
    // create a modifier user so update operations can set modifiedBy without FK violation
    const mod = await prisma.user.create({ data: { username: `modifier_${Date.now()}`, email: `modifier_${Date.now()}@example.com` } });
    modifierId = mod.id;
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

  it('creates a user without header', async () => {
    const uname = `testuser_${Date.now()}`;
    const res = await exec({ query: `mutation { createUser(input: { username: \"${uname}\", email: \"${uname}@example.com\", firstName: \"T\", lastName: \"U\" }) { id username email } }` });
    expect(res.errors).toBeUndefined();
    expect(res.data?.createUser).toBeDefined();
    expect(res.data.createUser.username).toBe(uname);
  });

  it('updates a user with header', async () => {
    // create user via prisma
    const u = await prisma.user.create({ data: { username: `upd_${Date.now()}`, email: `upd_${Date.now()}@example.com` } });
  const res = await exec({ query: `mutation { updateUser(input: { id: ${u.id}, firstName: \"New\" }) { id firstName modifiedBy { id } } }` }, { req: { headers: { 'x-user-id': String(modifierId) } }, res: {} } as any);
    expect(res.errors).toBeUndefined();
    expect(res.data?.updateUser).toBeDefined();
    expect(res.data.updateUser.firstName).toBe('New');
  });

  it('deletes a user with header', async () => {
    const u = await prisma.user.create({ data: { username: `del_${Date.now()}`, email: `del_${Date.now()}@example.com` } });
  const res = await exec({ query: `mutation { deleteUser(id: ${u.id}) { id username } }` }, { req: { headers: { 'x-user-id': String(modifierId) } }, res: {} } as any);
    expect(res.errors).toBeUndefined();
    expect(res.data?.deleteUser).toBeDefined();
    expect(String(res.data.deleteUser.id)).toBe(String(u.id));

    // deleting non-existent returns null
  const res2 = await exec({ query: `mutation { deleteUser(id: 9999999) { id } }` }, { req: { headers: { 'x-user-id': String(modifierId) } }, res: {} } as any);
    expect(res2.errors).toBeUndefined();
    expect(res2.data.deleteUser).toBeNull();
  });
});
