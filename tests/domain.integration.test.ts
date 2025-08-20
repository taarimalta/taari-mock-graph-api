import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/schema/typeDefs';
import { domainResolvers } from '../src/resolvers/domain';

describe('Domain GraphQL API', () => {
  let server: ApolloServer;

  beforeAll(async () => {
    server = new ApolloServer({
      typeDefs,
      resolvers: { Query: domainResolvers.Query, Mutation: domainResolvers.Mutation, Domain: domainResolvers.Domain },
    });
    await server.start();
  });

  let createdDomainId: number;
  let userId: number;
  const PrismaClient = require('@prisma/client').PrismaClient;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    // Get a valid userId from the database
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found in database. Seed script may have failed.');
    userId = user.id;

    server = new ApolloServer({
      typeDefs,
      resolvers: { Query: domainResolvers.Query, Mutation: domainResolvers.Mutation, Domain: domainResolvers.Domain },
    });
    await server.start();
  });

  it('creates a domain', async () => {
    const res = await server.executeOperation(
      {
        query: `
          mutation CreateDomain($name: String!) {
            createDomain(name: $name) {
              id
              name
              createdBy
            }
          }
        `,
        variables: { name: 'Test Domain' }
      },
      { contextValue: { userId } }
    );
  expect(res.body.kind).toBe('single');
  if (res.body.kind !== 'single') throw new Error('Expected single result');
  const { data, errors } = res.body.singleResult;
  expect(errors).toBeUndefined();
  const domainData = data as { createDomain: { id: string, name: string, createdBy: number } };
  expect(domainData.createDomain.name).toBe('Test Domain');
  expect(domainData.createDomain.createdBy).toBe(userId);
  createdDomainId = Number(domainData.createDomain.id);
  });

  it('fetches a domain by id', async () => {
    const res = await server.executeOperation(
      {
        query: `
          query GetDomain($id: ID!) {
            domain(id: $id) {
              id
              name
              createdBy
            }
          }
        `,
        variables: { id: createdDomainId }
      },
      { contextValue: { userId } }
    );
  expect(res.body.kind).toBe('single');
  if (res.body.kind !== 'single') throw new Error('Expected single result');
  const { data, errors } = res.body.singleResult;
  expect(errors).toBeUndefined();
  const domainData = data as { domain: { id: string, name: string, createdBy: number } };
  expect(domainData.domain.id).toBe(String(createdDomainId));
  expect(domainData.domain.name).toBe('Test Domain');
  expect(domainData.domain.createdBy).toBe(userId);
  });

  it('updates a domain', async () => {
    const res = await server.executeOperation(
      {
        query: `
          mutation UpdateDomain($id: ID!, $name: String!) {
            updateDomain(id: $id, name: $name) {
              id
              name
            }
          }
        `,
        variables: { id: createdDomainId, name: 'Updated Domain' }
      },
      { contextValue: { userId } }
    );
  expect(res.body.kind).toBe('single');
  if (res.body.kind !== 'single') throw new Error('Expected single result');
  const { data, errors } = res.body.singleResult;
  expect(errors).toBeUndefined();
  const domainData = data as { updateDomain: { id: string, name: string } };
  expect(domainData.updateDomain.name).toBe('Updated Domain');
  });

  it('deletes a domain', async () => {
    const res = await server.executeOperation(
      {
        query: `
          mutation DeleteDomain($id: ID!) {
            deleteDomain(id: $id) {
              id
              name
            }
          }
        `,
        variables: { id: createdDomainId }
      },
      { contextValue: { userId } }
    );
  expect(res.body.kind).toBe('single');
  if (res.body.kind !== 'single') throw new Error('Expected single result');
  const { data, errors } = res.body.singleResult;
  expect(errors).toBeUndefined();
  const domainData = data as { deleteDomain: { id: string, name: string } };
  expect(domainData.deleteDomain.id).toBe(String(createdDomainId));
  expect(domainData.deleteDomain.name).toBe('Updated Domain');
  });
});
