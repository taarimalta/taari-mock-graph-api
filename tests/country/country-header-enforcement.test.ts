import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../../src/schema/typeDefs';
import { countryResolvers } from '../../src/resolvers/country';
import { animalResolvers } from '../../src/resolvers/animal';
import { createContext } from '../../src/context';

describe('Audit Fields Enforcement', () => {
  let server: any;
  beforeAll(() => {
    server = new ApolloServer({
      typeDefs,
      resolvers: [countryResolvers, animalResolvers],
    });
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

  describe('Country audit field header enforcement', () => {
    it('should throw error if x-user-id header is missing for createCountry', async () => {
      const res = await exec({
        query: `mutation { createCountry(input: { name: "Testland", continent: africa }) { id } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for countries (paginated) query', async () => {
      const res = await exec({
        query: `query { countriesPaginated(args: { first: 1 }) { data { id name } } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for countries (paginated) query', async () => {
      const res = await exec(
        { query: `query { countriesPaginated(args: { first: 1 }) { data { id name } } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for countriesPaginated query', async () => {
      const res = await exec({
        query: `query { countriesPaginated(args: { first: 1 }) { data { id name } } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for countriesPaginated query', async () => {
      const res = await exec(
        { query: `query { countriesPaginated(args: { first: 1 }) { data { id name } } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for country query', async () => {
      const res = await exec({
        query: `query { country(id: 1) { id name } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for country query', async () => {
      const res = await exec(
        { query: `query { country(id: 1) { id name } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for deleteCountry mutation', async () => {
      const res = await exec({
        query: `mutation { deleteCountry(id: 1) { id } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for deleteCountry mutation', async () => {
      const res = await exec(
        { query: `mutation { deleteCountry(id: 1) { id } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
    });
  });
  // Add similar tests for Animal audit fields if needed
});
