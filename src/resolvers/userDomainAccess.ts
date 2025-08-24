import { PrismaClient } from '@prisma/client';
import { paginate } from '../utils/pagination';
import { mapUserDomainAccessOrderField, buildOrderBy } from '../utils/sorting';
import { assertPositiveInt, assertArrayOfPositiveInts } from '../utils/validation';
const prisma = new PrismaClient();

export const userDomainAccessResolvers = {
  Query: {
  userDomainAccessPaginated: async (_: any, args: any, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where: any = {};
      if (args.filter) {
        if (args.filter.userId !== undefined) { assertPositiveInt(args.filter.userId, 'filter.userId'); where.userId = Number(args.filter.userId); }
        if (args.filter.domainId !== undefined) { assertPositiveInt(args.filter.domainId, 'filter.domainId'); where.domainId = Number(args.filter.domainId); }
        if (args.filter.createdBy !== undefined) { assertPositiveInt(args.filter.createdBy, 'filter.createdBy'); where.createdBy = Number(args.filter.createdBy); }
        if (args.filter.modifiedBy !== undefined) { assertPositiveInt(args.filter.modifiedBy, 'filter.modifiedBy'); where.modifiedBy = Number(args.filter.modifiedBy); }
      }

      const orderFieldToken = args.orderBy?.field || 'CREATEDAT';
      const direction = args.orderBy?.direction || 'ASC';
      const orderField = mapUserDomainAccessOrderField(orderFieldToken);
      const orderBy = buildOrderBy(orderField, direction as any);
      const pageArgs = args.args || { first: 20 };

      const result = await paginate({
        model: prisma.userDomainAccess,
        where,
        orderBy,
        first: pageArgs.first,
        after: pageArgs.after,
        last: pageArgs.last,
        before: pageArgs.before,
        include: { user: true, domain: true, creator: true, modifier: true },
      });

      return {
        data: Array.isArray(result.items) ? result.items : [],
        pagination: result.pagination,
      };
    },

    hasUserDomainAccess: async (_: any, { userId, domainId }: { userId: number; domainId: number }) => {
      assertPositiveInt(userId, 'userId');
      assertPositiveInt(domainId, 'domainId');
      const found = await prisma.userDomainAccess.findUnique({
        where: { userId_domainId: { userId: Number(userId), domainId: Number(domainId) } },
      });
      return !!found;
    },

  userAccessibleDomains: async (_: any, { userId, args }: { userId: number; args?: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      assertPositiveInt(userId, 'userId');
      const pageArgs = args || { first: 20 };
      const where = { userAccess: { some: { userId: Number(userId) } } };
      const orderBy = [{ name: 'asc' }, { id: 'asc' }];
      const result = await paginate({
        model: prisma.domain,
        where,
        orderBy,
        first: pageArgs.first,
        after: pageArgs.after,
        last: pageArgs.last,
        before: pageArgs.before,
        include: { creator: true, modifier: true },
      });
      return { data: Array.isArray(result.items) ? result.items : [], pagination: result.pagination };
    },

  domainAccessibleUsers: async (_: any, { domainId, args }: { domainId: number; args?: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      assertPositiveInt(domainId, 'domainId');
      const pageArgs = args || { first: 20 };
      const where = { domainAccess: { some: { domainId: Number(domainId) } } };
      const orderBy = [{ username: 'asc' }, { id: 'asc' }];
      const result = await paginate({
        model: prisma.user,
        where,
        orderBy,
        first: pageArgs.first,
        after: pageArgs.after,
        last: pageArgs.last,
        before: pageArgs.before,
        include: { creator: true, modifier: true },
      });
      return { data: Array.isArray(result.items) ? result.items : [], pagination: result.pagination };
    },
  },

  Mutation: {
  grantDomainAccess: async (_: any, { input }: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      assertPositiveInt(input.userId, 'input.userId');
      assertPositiveInt(input.domainId, 'input.domainId');
      const userId = Number(input.userId);
      const domainId = Number(input.domainId);
      const existing = await prisma.userDomainAccess.findUnique({ where: { userId_domainId: { userId, domainId } } });
      if (existing) return existing;
      return prisma.userDomainAccess.create({
        data: { userId, domainId, createdBy: context.userId, modifiedBy: context.userId },
        include: { user: true, domain: true, creator: true, modifier: true },
      });
    },

  revokeDomainAccess: async (_: any, { input }: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      assertPositiveInt(input.userId, 'input.userId');
      assertPositiveInt(input.domainId, 'input.domainId');
      const userId = Number(input.userId);
      const domainId = Number(input.domainId);
      const existing = await prisma.userDomainAccess.findUnique({ where: { userId_domainId: { userId, domainId } } });
      if (!existing) return null;
      return prisma.userDomainAccess.delete({ where: { id: existing.id }, include: { user: true, domain: true, creator: true, modifier: true } });
    },

  grantMultipleDomainAccess: async (_: any, { userId, domainIds }: { userId: number; domainIds: number[] }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      assertPositiveInt(userId, 'userId');
      assertArrayOfPositiveInts(domainIds, 'domainIds');
      const created: any[] = [];
      for (const d of domainIds) {
        const domainId = Number(d);
        try {
          const upserted = await prisma.userDomainAccess.upsert({
            where: { userId_domainId: { userId: Number(userId), domainId } },
            update: { modifiedAt: new Date(), modifiedBy: context.userId },
            create: { userId: Number(userId), domainId, createdBy: context.userId, modifiedBy: context.userId },
            include: { user: true, domain: true, creator: true, modifier: true },
          });
          created.push(upserted);
        } catch (e) {
          // ignore individual failures and continue
        }
      }
      return created;
    },

  revokeMultipleDomainAccess: async (_: any, { userId, domainIds }: { userId: number; domainIds: number[] }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      assertPositiveInt(userId, 'userId');
      assertArrayOfPositiveInts(domainIds, 'domainIds');
      const existing = await prisma.userDomainAccess.findMany({ where: { userId: Number(userId), domainId: { in: domainIds.map((d: any) => Number(d)) } } });
      const deleted: any[] = [];
      for (const e of existing) {
        try {
          const d = await prisma.userDomainAccess.delete({ where: { id: e.id }, include: { user: true, domain: true, creator: true, modifier: true } });
          deleted.push(d);
        } catch (err) {
          // ignore
        }
      }
      return deleted;
    },
  },

  UserDomainAccess: {
    user: async (uda: any) => {
      if (uda.user) return uda.user;
      return prisma.user.findUnique({ where: { id: uda.userId } });
    },
    domain: async (uda: any) => {
      if (uda.domain) return uda.domain;
      return prisma.domain.findUnique({ where: { id: uda.domainId } });
    },
    createdBy: async (uda: any) => {
      if (uda.creator) return uda.creator;
      if (!uda.createdBy) return null;
      return prisma.user.findUnique({ where: { id: uda.createdBy } });
    },
    modifiedBy: async (uda: any) => {
      if (uda.modifier) return uda.modifier;
      if (!uda.modifiedBy) return null;
      return prisma.user.findUnique({ where: { id: uda.modifiedBy } });
    },
  },
};
