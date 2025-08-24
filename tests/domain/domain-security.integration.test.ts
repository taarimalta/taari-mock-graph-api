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
});

afterAll(async () => {
  await cleanupTestData();
});

describe('Mutation Domain Assignment Security', () => {
  it('should fail to updateCountry if user lacks domain access (via x-create-domain)', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '2') // User 2 does NOT have access to domain 99
      .set('x-create-domain', '99')
      .send({
        query: `mutation { updateCountry(input: { id: 3, name: "Hacked" }) { id name domainId } }`
      });
    // Accept either error or null result if record not found
    if (res.body.errors) {
      expect(res.body.errors[0].message).toMatch(/Access denied|not found/);
    } else {
      expect(res.body.data.updateCountry).toBeNull();
    }
  });

  it('should fail to updateAnimal if user lacks domain access (via x-create-domain)', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '2') // User 2 does NOT have access to domain 99
      .set('x-create-domain', '99')
      .send({
        query: `mutation { updateAnimal(input: { id: 3, name: "Hacked" }) { id name } }`
      });
    if (res.body.errors) {
      expect(res.body.errors[0].message).toMatch(/Access denied|not found/);
    } else {
      expect(res.body.data.updateAnimal).toBeNull();
    }
  });

  it('should fail to createUser in unauthorized domain (via x-create-domain)', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '2') // User 2 does NOT have access to domain 99
      .set('x-create-domain', '99')
      .send({
        query: `mutation { createUser(input: { username: "evil", email: "evil@example.com" }) { id username } }`
      });
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Access denied/);
  });

  it('should fail to updateUser in unauthorized domain (via x-create-domain)', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '2') // User 2 does NOT have access to domain 99
      .set('x-create-domain', '99')
      .send({
        query: `mutation { updateUser(input: { id: 1, username: "evil" }) { id username } }`
      });
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Access denied/);
  });
});

describe('Domain Security Edge Cases', () => {
  it('should not return countries with domainId=null', async () => {
    // Seed a country with domainId=null
    const { prisma } = require('../global/setup');
    await prisma.country.create({
      data: {
        id: 100,
        name: 'Orphan Country',
        continent: 'europe',
        domainId: null,
        createdBy: 1,
        modifiedBy: 1,
      }
    });
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .send({
        query: `query { countriesPaginated(args: { first: 100 }) { data { id name domainId } } }`
      });
    expect(res.body.data.countriesPaginated.data.some((c: any) => c.id === 100)).toBe(false);
  });

  it('should return empty results for non-existent user', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '9999') // user does not exist
      .send({
        query: `query { countriesPaginated(args: { first: 10 }) { data { id name domainId } } }`
      });
    expect(res.body.data.countriesPaginated.data.length).toBe(0);
  });

  it('should fail gracefully for malformed x-user-id header', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', 'notanumber')
      .send({
        query: `query { countriesPaginated(args: { first: 10 }) { data { id name domainId } } }`
      });
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/x-user-id header/);
  });

  it('should fail gracefully for malformed x-view-domains header', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('x-user-id', '1')
      .set('x-view-domains', 'notanumber,2')
      .send({
        query: `query { countriesPaginated(args: { first: 10 }) { data { id name domainId } } }`
      });
  // Should only return countries for accessible domains (malformed entries ignored)
  const returnedDomainIds = res.body.data.countriesPaginated.data.map((c: any) => c.domainId);
  console.log('Returned domainIds:', returnedDomainIds);
  expect(returnedDomainIds.every((id: any) => [2].includes(Number(id)))).toBe(true);
  });
});

// More tests for hierarchy, orphaned records, and no domain assignment will follow.
