import { PrismaClient } from '@prisma/client';
import { paginate } from '../utils/pagination';
const prisma = new PrismaClient();

export const domainResolvers = {
  Query: {
    domain: async (_parent: any, { id }: { id: any }) => {
      return prisma.domain.findUnique({ where: { id: Number(id) } });
    },
  domainsPaginated: async (_parent: any, { search, orderBy, args }: { search?: string; orderBy?: any; args?: any }) => {
      // Implement pagination logic similar to other entities
      // Placeholder: returns all for now
      // Use paginate with includes to fetch creator/modifier and avoid N+1
      const result = await paginate({
  model: prisma.domain,
  where: search ? { name: { contains: search } } : {},
        orderBy: orderBy ? [{ [orderBy.field.toLowerCase()]: orderBy.direction.toLowerCase() }] : [{ name: 'asc' }],
        first: args?.first || 20,
        include: { creator: true, modifier: true },
      });

      return {
        data: Array.isArray(result.items) ? result.items : [],
        pagination: result.pagination,
      };
    },
  },
    Mutation: {
  createDomain: async (_parent: any, { input }: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      // createdBy/modifiedBy should come from context.userId
      const data = input || {};
      return prisma.domain.create({
        data: {
          name: data.name,
          parentId: data.parentId ? Number(data.parentId) : null,
          createdBy: context.userId,
          modifiedBy: context.userId,
        },
      });
    },
  updateDomain: async (_parent: any, { input }: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      const data = input || {};
      return prisma.domain.update({
        where: { id: Number(data.id) },
        data: {
          name: data.name,
          parentId: data.parentId ? Number(data.parentId) : undefined,
          modifiedBy: context.userId,
        },
      });
    },
    deleteDomain: async (_parent: any, { id }: { id: any }) => {
      return prisma.domain.delete({ where: { id: Number(id) } });
    },
  },
  Domain: {
    parent: async (domain: any, _args: any, context: any) => {
      if (!domain.parentId) return null;
      if (context?.loadDomain) return context.loadDomain(domain.parentId);
      return prisma.domain.findUnique({ where: { id: domain.parentId } });
    },
    createdBy: async (domain: any, _args: any, context: any) => {
      if (domain.creator) return domain.creator;
      if (!domain.createdBy) return null;
      if (context?.loadUser) return context.loadUser(domain.createdBy);
      return prisma.user.findUnique({ where: { id: domain.createdBy } });
    },
    modifiedBy: async (domain: any, _args: any, context: any) => {
      if (domain.modifier) return domain.modifier;
      if (!domain.modifiedBy) return null;
      if (context?.loadUser) return context.loadUser(domain.modifiedBy);
      return prisma.user.findUnique({ where: { id: domain.modifiedBy } });
    },
    usersWithAccess: async (domain: any) => {
      if (domain.userAccess) return domain.userAccess;
      return prisma.userDomainAccess.findMany({
        where: { domainId: Number(domain.id) },
        include: { user: true, creator: true, modifier: true },
      });
    },
  },
};
