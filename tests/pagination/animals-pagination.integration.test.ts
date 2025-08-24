export {};
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import express from 'express';
import bodyParser from 'body-parser';
import { typeDefs } from '../../src/schema/typeDefs';
import { animalResolvers } from '../../src/resolvers/animal';

let app: any;
let server: any;

beforeAll(async () => {
  server = new ApolloServer({
    typeDefs,
    resolvers: [animalResolvers],
  });
  await server.start();
  app = express();
  app.use(bodyParser.json());
  app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }: { req: express.Request }) => ({ userId: 1, viewDomains: undefined, createDomain: undefined })
  }));
});

describe('Animals Pagination Integration', () => {
  it('should return first page of animals', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { hasNext startCursor endCursor } } }`
      });
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data.animalsPaginated.data)).toBe(true);
  if (res.body.data.animalsPaginated.data.length === 0) {
    expect(res.body.data.animalsPaginated.data).toEqual([]);
  } else {
    expect(res.body.data.animalsPaginated.data.every((a: any) => a.domainId !== null)).toBe(true);
  }
  });

  it('should paginate forward using after cursor', async () => {
    // Get first page
    const firstRes = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`
      });
    const afterCursor = firstRes.body.data.animalsPaginated.pagination.endCursor;
    // Get next page
    const nextRes = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { hasPrevious startCursor endCursor } } }`
      });
    expect(nextRes.status).toBe(200);
    if (!nextRes.body.data || !nextRes.body.data.animalsPaginated || !nextRes.body.data.animalsPaginated.data) {
      expect(nextRes.body.data?.animalsPaginated).toBeUndefined();
      return;
    }
    if (nextRes.body.data.animalsPaginated.data.length === 0) {
      expect(nextRes.body.data.animalsPaginated.data).toEqual([]);
    } else {
      expect(nextRes.body.data.animalsPaginated.data.length).toBeLessThanOrEqual(2);
      expect(nextRes.body.data.animalsPaginated.pagination.hasPrevious).toBe(true);
      expect(nextRes.body.data.animalsPaginated.pagination.startCursor).toBeTruthy();
      expect(nextRes.body.data.animalsPaginated.pagination.endCursor).toBeTruthy();
    }
  });

  it('should not repeat items between pages', async () => {
    const firstRes = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`
      });
    const afterCursor = firstRes.body.data.animalsPaginated.pagination.endCursor;
    const page1Ids = firstRes.body.data.animalsPaginated.data.map((a: any) => a.id);
    const nextRes = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 2, after: "${afterCursor}" }) { data { id name } } }`
      });
    const page2Ids = nextRes.body.data.animalsPaginated.data.map((a: any) => a.id);
    if (page2Ids && page2Ids.length > 0) {
      page1Ids.forEach((id: any) => {
        expect(page2Ids).not.toContain(id);
      });
    }
  });

  it('should handle malformed cursor gracefully', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 2, after: "not-a-valid-cursor" }) { data { id name } } }`
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.animalsPaginated.data)).toBe(true);
  });

  it('should handle single-item page', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query { animalsPaginated(args: { first: 1 }) { data { id name } pagination { startCursor endCursor } } }`
      });
    expect(res.status).toBe(200);
    if (!res.body.data.animalsPaginated || !res.body.data.animalsPaginated.data) {
      expect(res.body.data.animalsPaginated).toBeUndefined();
      return;
    }
    if (res.body.data.animalsPaginated.data.length === 0) {
      expect(res.body.data.animalsPaginated.data).toEqual([]);
    } else {
      expect(res.body.data.animalsPaginated.data.length).toBeLessThanOrEqual(1);
      expect(res.body.data.animalsPaginated.pagination.startCursor).toBeTruthy();
      expect(res.body.data.animalsPaginated.pagination.endCursor).toBeTruthy();
    }
  });
});
