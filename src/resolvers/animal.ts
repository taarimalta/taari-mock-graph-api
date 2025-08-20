import { PrismaClient } from '@prisma/client';
import { buildAnimalWhere } from '../utils/filtering';
import { mapAnimalOrderField, buildOrderBy } from '../utils/sorting';
import { paginate } from '../utils/pagination';
const prisma = new PrismaClient();

export const animalResolvers = {
  Query: {
    animalsPaginated: async (_: any, args: {
      search?: string,
      filter?: any,
      orderBy?: any,
      args?: any
    }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where = buildAnimalWhere(args.filter, args.search);
      const orderField = args.orderBy?.field || 'NAME';
      const direction = args.orderBy?.direction || 'ASC';
      const orderBy = buildOrderBy(mapAnimalOrderField(orderField), direction);
      const pageArgs = args.args || { first: 20 };

      const result = await paginate({
        model: prisma.animal,
        where,
        orderBy,
  first: pageArgs.first,
  after: pageArgs.after,
  last: pageArgs.last,
  before: pageArgs.before,
  include: { creator: true, modifier: true },
      });
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
