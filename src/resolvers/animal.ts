import { PrismaClient } from '@prisma/client';
import { buildAnimalWhere } from '../utils/filtering';
import { mapAnimalOrderField, buildOrderBy } from '../utils/sorting';
import { paginate } from '../utils/pagination';
import logger from '../logger';
const prisma = new PrismaClient();

export const animalResolvers = {
  Query: {
    animalsPaginated: async (_: any, args: {
      search?: string,
      filter?: any,
      orderBy?: any,
      args?: any,
      first?: number,
      after?: string,
      last?: number,
      before?: string
    }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where = buildAnimalWhere(args.filter, args.search);
      const orderField = args.orderBy?.field || 'NAME';
      const direction = args.orderBy?.direction || 'ASC';
      // Always use compound sorting: primary field + id as tiebreaker
      const primaryField = mapAnimalOrderField(orderField);
      const orderFields = [primaryField, 'id'];
      const orderBy = [
        { [primaryField]: direction.toLowerCase() },
        { id: 'asc' },
      ];
      // Accept both top-level and nested args for pagination
      const rawAfter = args.after ?? args.args?.after;
      const rawBefore = args.before ?? args.args?.before;
      // Always ensure after/before are base64 strings
      function ensureCursorString(cursor: any) {
        if (!cursor) return undefined;
        if (typeof cursor === 'string') return cursor;
        try {
          return Buffer.from(JSON.stringify(cursor)).toString('base64');
        } catch (e) {
          return undefined;
        }
      }
      const pageArgs = {
        first: args.first ?? args.args?.first,
        after: ensureCursorString(rawAfter),
        last: args.last ?? args.args?.last,
        before: ensureCursorString(rawBefore),
      };
      // If neither first nor last is set, default to first: 20
      if (pageArgs.first == null && pageArgs.last == null) {
        pageArgs.first = 20;
      }

      // Debug logging for incoming pagination args
      logger.info('=== ANIMAL RESOLVER DEBUG ===');
      logger.info({ args }, 'Incoming args');
      logger.info({ pageArgs }, 'Resolved pageArgs');
      logger.info({ orderFields }, 'Order fields (DB)');
      logger.info({ rawAfter }, 'Raw after argument');

      const result = await paginate({
        model: prisma.animal,
        where,
        orderBy,
        first: pageArgs.first,
        after: pageArgs.after,
        last: pageArgs.last,
        before: pageArgs.before,
        include: { creator: true, modifier: true },
        orderFields, // Pass mapped DB field names for cursor encoding
      });
      // Debug: log cursor contents if available
      if (result?.pagination?.startCursor) {
        const decoded = require('../utils/pagination').decodeCursor(result.pagination.startCursor);
        logger.info({ decoded }, 'Decoded startCursor');
      }
      if (result?.pagination?.endCursor) {
        const decoded = require('../utils/pagination').decodeCursor(result.pagination.endCursor);
        logger.info({ decoded }, 'Decoded endCursor');
      }
      return {
        data: Array.isArray(result.items) ? result.items : [],
        pagination: result.pagination,
      };
    },
    animal: (_: any, args: { id: number }, context: { userId: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      return prisma.animal.findUnique({ where: { id: Number(args.id) } });
    },
  },
  Mutation: {
    createAnimal: async (_: any, args: { input: any }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const input = args.input || {};
      return await prisma.animal.create({
        data: {
          name: input.name,
          species: input.species,
          habitat: input.habitat,
          diet: input.diet,
          conservation_status: input.conservation_status,
          category: input.category,
          createdBy: context.userId,
          modifiedBy: context.userId,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      });
    },
    updateAnimal: async (_: any, args: { input: any }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const input = args.input || {};
      return await prisma.animal.update({
        where: { id: Number(input.id) },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.species !== undefined ? { species: input.species } : {}),
          ...(input.habitat !== undefined ? { habitat: input.habitat } : {}),
          ...(input.diet !== undefined ? { diet: input.diet } : {}),
          ...(input.conservation_status !== undefined ? { conservation_status: input.conservation_status } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          modifiedBy: context.userId,
          modifiedAt: new Date(),
        },
      });
    },
    deleteAnimal: (_: any, args: { id: number }, context: { userId: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      return prisma.animal.delete({ where: { id: Number(args.id) } });
    },
  },
  // Field resolvers for audit relations
  Animal: {
    createdBy: async (animal: any) => {
      if (animal.creator) return animal.creator;
      if (!animal.createdBy) return null;
      return prisma.user.findUnique({ where: { id: animal.createdBy } });
    },
    modifiedBy: async (animal: any) => {
      if (animal.modifier) return animal.modifier;
      if (!animal.modifiedBy) return null;
      return prisma.user.findUnique({ where: { id: animal.modifiedBy } });
    },
  },
};
