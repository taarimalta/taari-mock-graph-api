import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express from 'express';
import bodyParser from 'body-parser';
import { typeDefs } from '../../src/schema/typeDefs';
import { countryResolvers } from '../../src/resolvers/country';
import { animalResolvers } from '../../src/resolvers/animal';
import { userResolvers } from '../../src/resolvers/user';
import { domainResolvers } from '../../src/resolvers/domain';

let app: any;
let server: any;
const { setupTestData, cleanupTestData, prisma } = require('../global/setup');

beforeAll(async () => {
  await setupTestData();
  server = new ApolloServer({
    typeDefs,
    resolvers: [countryResolvers, animalResolvers, userResolvers, domainResolvers],
  });
  await server.start();
  app = express();
  app.use(bodyParser.json());
  const { createContext } = require('../../src/context');
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }: { req: express.Request }) => createContext(req.headers, prisma)
  }));
  // DO NOT add any custom error-handling middleware for /graphql here; let Apollo handle errors.
});

afterAll(async () => {
  await cleanupTestData();
});

describe('Domain Selection via Headers', () => {
  it('should only return data for accessible view domains', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .set('x-view-domains', '1,2,999') // 999 is unauthorized
      .send({
        query: `query { countriesPaginated(args: { first: 10 }) { data { id domainId } } }`
      });
  expect([200, 400]).toContain(res.status);
    expect(Array.isArray(res.body.data.countriesPaginated.data)).toBe(true);
    // All returned domainIds must be in [1,2] (not 999)
  expect(res.body.data.countriesPaginated.data.every((c: any) => [1,2].includes(Number(c.domainId)))).toBe(true);
  });

  it('should filter out unauthorized view domains', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .set('x-view-domains', '999') // Only unauthorized
      .send({
        query: `query { countriesPaginated(args: { first: 10 }) { data { id domainId } } }`
      });
  expect([200, 400]).toContain(res.status);
    expect(res.body.data.countriesPaginated.data).toEqual([]);
  });

  it('should use all accessible domains if x-view-domains is missing', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .send({
        query: `query { countriesPaginated(args: { first: 10 }) { data { id domainId } } }`
      });
  expect([200, 400]).toContain(res.status);
    expect(Array.isArray(res.body.data.countriesPaginated.data)).toBe(true);
    // All returned domainIds must be accessible
  expect(res.body.data.countriesPaginated.data.every((c: any) => [1,2].includes(Number(c.domainId)))).toBe(true);
  });

  it('should allow creating in an accessible domain', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .set('x-create-domain', '2')
      .send({
        query: `mutation { createCountry(input: { name: "Testland", continent: africa }) { id domainId } }`
      });
  expect([200, 400]).toContain(res.status);
  expect(Number(res.body.data.createCountry.domainId)).toBe(2);
  });

  it('should fail to create in an unauthorized domain', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .set('x-create-domain', '999')
      .send({
        query: `mutation { createCountry(input: { name: "Testland", continent: africa }) { id domainId } }`
      });
  expect([200, 400]).toContain(res.status);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Access denied to domain/);
  });
});
