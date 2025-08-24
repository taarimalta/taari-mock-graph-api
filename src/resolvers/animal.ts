import { PrismaClient } from '@prisma/client';
import type { Context } from '../context';
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
  }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      // Domain-based access filtering with user selection
      const { getEffectiveViewDomains } = require('../utils/domainAccess');
      const requestedDomains = context.viewDomains;
      const effectiveDomains = await getEffectiveViewDomains(prisma, context.userId, requestedDomains);
      if (!effectiveDomains || effectiveDomains.length === 0) {
  return { data: [], pagination: { endCursor: null, startCursor: null, hasNext: false, hasPrevious: false, totalCount: 0 } };
      }
      const where = {
        ...buildAnimalWhere(args.filter, args.search),
        OR: [
          { domainId: { in: effectiveDomains } }
        ]
      };
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
  animal: async (_: any, args: { id: number }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
  if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const animal = await prisma.animal.findUnique({ where: { id: Number(args.id) } });
      if (!animal) return null;
      // Do not allow access if domainId is null
      if (animal.domainId == null) return null;
      const { isUserDomainAccessible } = require('../utils/domainAccess');
      const accessible = await isUserDomainAccessible(prisma, context.userId, animal.domainId);
      return accessible ? animal : null;
    },
  },
  Mutation: {
  createAnimal: async (_: any, args: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const input = args.input || {};
      // Use x-create-domain header if present, else input.domainId
      const requestedDomain = context.createDomain ?? input.domainId;
      const { validateCreateDomain } = require('../utils/domainAccess');
      const domainId = await validateCreateDomain(prisma, context.userId, requestedDomain);
      return await prisma.animal.create({
        data: {
          name: input.name,
          species: input.species,
          habitat: input.habitat,
          diet: input.diet,
          conservation_status: input.conservation_status,
          category: input.category,
          domainId,
          createdBy: context.userId,
          modifiedBy: context.userId,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      });
    },
  updateAnimal: async (_: any, args: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const input = args.input || {};
      const animal = await context.prisma.animal.findUnique({ where: { id: Number(input.id) } });
      if (!animal) throw new Error('Animal not found');
      const { isUserDomainAccessible, validateCreateDomain } = require('../utils/domainAccess');
      let domainId = animal.domainId;
      // If x-create-domain is present, validate access and assign
      if (context.createDomain) {
        await validateCreateDomain(context.prisma, context.userId, context.createDomain);
        domainId = context.createDomain;
      }
      const hasAccess = await isUserDomainAccessible(context.prisma, context.userId, domainId);
      if (!hasAccess) throw new Error('Access denied: You do not have permission to update this animal');
      return await context.prisma.animal.update({
        where: { id: Number(input.id) },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.species !== undefined ? { species: input.species } : {}),
          ...(input.habitat !== undefined ? { habitat: input.habitat } : {}),
          ...(input.diet !== undefined ? { diet: input.diet } : {}),
          ...(input.conservation_status !== undefined ? { conservation_status: input.conservation_status } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          domainId,
          modifiedBy: context.userId,
          modifiedAt: new Date(),
        },
      });
    },
  deleteAnimal: (_: any, args: { id: number }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      // context type extended for future domain assignment
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
