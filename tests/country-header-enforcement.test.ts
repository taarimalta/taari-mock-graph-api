import { ApolloServer } from 'apollo-server';
import { typeDefs } from '../src/schema/typeDefs';
import { countryResolvers } from '../src/resolvers/country';
import { animalResolvers } from '../src/resolvers/animal';

describe('Audit Fields Enforcement', () => {
  let server: ApolloServer;
  beforeAll(() => {
    server = new ApolloServer({
      typeDefs,
      resolvers: [countryResolvers, animalResolvers],
      context: ({ req }) => {
        const rawUserId = req?.headers['x-user-id'];
        const userId = rawUserId ? Number(rawUserId) : undefined;
        return { userId };
      },
    });
  });

  describe('Country audit field header enforcement', () => {
    it('should throw error if x-user-id header is missing for createCountry', async () => {
      const res = await server.executeOperation({
        query: `mutation { createCountry(name: "Testland", continent: africa) { id } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for countries query', async () => {
      const res = await server.executeOperation({
        query: `query { countries { id name } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for countries query', async () => {
      const res = await server.executeOperation(
        { query: `query { countries { id name } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for countriesPaginated query', async () => {
      const res = await server.executeOperation({
        query: `query { countriesPaginated(args: { first: 1 }) { data { id name } } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for countriesPaginated query', async () => {
      const res = await server.executeOperation(
        { query: `query { countriesPaginated(args: { first: 1 }) { data { id name } } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for country query', async () => {
      const res = await server.executeOperation({
        query: `query { country(id: 1) { id name } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for country query', async () => {
      const res = await server.executeOperation(
        { query: `query { country(id: 1) { id name } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for deleteCountry mutation', async () => {
      const res = await server.executeOperation({
        query: `mutation { deleteCountry(id: 1) { id } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for deleteCountry mutation', async () => {
      const res = await server.executeOperation(
        { query: `mutation { deleteCountry(id: 1) { id } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
    });
  });
  // Add similar tests for Animal audit fields if needed
});
