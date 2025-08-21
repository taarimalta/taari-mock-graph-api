import { ApolloServer } from '@apollo/server';
import { typeDefs } from '../src/schema/typeDefs';
import { userDomainAccessResolvers } from '../src/resolvers/userDomainAccess';
import { domainResolvers } from '../src/resolvers/domain';
import { userResolvers } from '../src/resolvers/user';

describe('UserDomainAccess GraphQL API', () => {
  let server: ApolloServer;
  const PrismaClient = require('@prisma/client').PrismaClient;
  const prisma = new PrismaClient();
  let userId: number;
  let domainId: number;

  beforeAll(async () => {
    // Ensure we have at least one user and one domain
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found in DB for tests');
    userId = user.id;

    let domain = await prisma.domain.findFirst();
    if (!domain) {
      domain = await prisma.domain.create({ data: { name: 'Seed Domain', createdBy: userId, modifiedBy: userId } });
    }
    domainId = domain.id;

    server = new ApolloServer({
      typeDefs,
      resolvers: {
        Query: {
          ...userDomainAccessResolvers.Query,
          ...domainResolvers.Query,
          ...userResolvers.Query,
        },
        Mutation: {
          ...userDomainAccessResolvers.Mutation,
          ...domainResolvers.Mutation,
          ...userResolvers.Mutation,
        },
        UserDomainAccess: userDomainAccessResolvers.UserDomainAccess,
        Domain: domainResolvers.Domain,
        User: userResolvers.User,
      },
    });
    await server.start();
  });

  it('grants domain access to a user', async () => {
    const res = await server.executeOperation(
      {
        query: `
          mutation Grant($userId: ID!, $domainId: ID!) {
            grantDomainAccess(input: { userId: $userId, domainId: $domainId }) {
              id
              user { id }
              domain { id }
              createdBy { id }
            }
          }
        `,
        variables: { userId, domainId },
      },
      { contextValue: { userId } }
    );
    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') throw new Error('Expected single result');
    const { data, errors } = res.body.singleResult;
    expect(errors).toBeUndefined();
    const granted = data as { grantDomainAccess: { id: string; user: { id: string }; domain: { id: string }; createdBy: { id: string } } };
    expect(granted.grantDomainAccess.user.id).toBe(String(userId));
    expect(granted.grantDomainAccess.domain.id).toBe(String(domainId));
    expect(granted.grantDomainAccess.createdBy.id).toBe(String(userId));
  });

  it('confirms hasUserDomainAccess returns true', async () => {
    const res = await server.executeOperation(
      {
        query: `
          query HasAccess($userId: ID!, $domainId: ID!) {
            hasUserDomainAccess(userId: $userId, domainId: $domainId)
          }
        `,
        variables: { userId, domainId },
      },
      { contextValue: { userId } }
    );
    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') throw new Error('Expected single result');
    const { data, errors } = res.body.singleResult;
    expect(errors).toBeUndefined();
    const payload = data as { hasUserDomainAccess: boolean };
    expect(payload.hasUserDomainAccess).toBe(true);
  });

  it('lists userDomainAccessPaginated', async () => {
    const res = await server.executeOperation(
      {
        query: `
          query List($filter: UserDomainAccessFilter) {
            userDomainAccessPaginated(filter: $filter, args: { first: 10 }) {
              data { id user { id } domain { id } }
              pagination { totalCount }
            }
          }
        `,
        variables: { filter: { userId } },
      },
      { contextValue: { userId } }
    );
    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') throw new Error('Expected single result');
    const { data, errors } = res.body.singleResult;
    expect(errors).toBeUndefined();
    const payload = data as { userDomainAccessPaginated: { data: Array<any>, pagination: { totalCount: number } } };
    expect(Array.isArray(payload.userDomainAccessPaginated.data)).toBe(true);
    expect(payload.userDomainAccessPaginated.pagination.totalCount).toBeGreaterThanOrEqual(1);
  });

  it('revokes domain access', async () => {
    const res = await server.executeOperation(
      {
        query: `
          mutation Revoke($userId: ID!, $domainId: ID!) {
            revokeDomainAccess(input: { userId: $userId, domainId: $domainId }) {
              id
            }
          }
        `,
        variables: { userId, domainId },
      },
      { contextValue: { userId } }
    );
    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') throw new Error('Expected single result');
    const { data, errors } = res.body.singleResult;
    expect(errors).toBeUndefined();
    const payload = data as { revokeDomainAccess: { id: string } | null };
    expect(payload.revokeDomainAccess).not.toBeNull();
  });

  it('confirms hasUserDomainAccess returns false after revoke', async () => {
    const res = await server.executeOperation(
      {
        query: `
          query HasAccess($userId: ID!, $domainId: ID!) {
            hasUserDomainAccess(userId: $userId, domainId: $domainId)
          }
        `,
        variables: { userId, domainId },
      },
      { contextValue: { userId } }
    );
    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') throw new Error('Expected single result');
    const { data, errors } = res.body.singleResult;
    expect(errors).toBeUndefined();
    const payload = data as { hasUserDomainAccess: boolean };
    expect(payload.hasUserDomainAccess).toBe(false);
  });

});
