import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const domainResolvers = {
  Query: {
    domain: async (_parent, { id }) => {
      return prisma.domain.findUnique({ where: { id: Number(id) } });
    },
    domains: async (_parent, { search }) => {
      return prisma.domain.findMany({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      });
    },
    domainsPaginated: async (_parent, { search, orderBy, args }) => {
      // Implement pagination logic similar to other entities
      // Placeholder: returns all for now
      return {
        data: await prisma.domain.findMany({
          where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
          orderBy: orderBy ? { [orderBy.field.toLowerCase()]: orderBy.direction.toLowerCase() } : { name: 'asc' },
        }),
        pagination: {
          hasNext: false,
          hasPrevious: false,
          startCursor: null,
          endCursor: null,
          totalCount: await prisma.domain.count(),
        },
      };
    },
  },
  Mutation: {
    createDomain: async (_parent, { name, parentId }, context) => {
      // createdBy/modifiedBy should come from context.userId
      return prisma.domain.create({
        data: {
          name,
          parentId: parentId ? Number(parentId) : null,
          createdBy: context.userId,
          modifiedBy: context.userId,
        },
      });
    },
    updateDomain: async (_parent, { id, name, parentId }, context) => {
      return prisma.domain.update({
        where: { id: Number(id) },
        data: {
          name,
          parentId: parentId ? Number(parentId) : undefined,
          modifiedBy: context.userId,
        },
      });
    },
    deleteDomain: async (_parent, { id }) => {
      return prisma.domain.delete({ where: { id: Number(id) } });
    },
  },
  Domain: {
    parent: async (domain) => {
      if (!domain.parentId) return null;
      return prisma.domain.findUnique({ where: { id: domain.parentId } });
    },
    createdBy: (domain) => domain.createdBy,
    modifiedBy: (domain) => domain.modifiedBy,
  },
};
