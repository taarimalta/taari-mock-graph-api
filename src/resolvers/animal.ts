import { PrismaClient } from '@prisma/client';
import { buildAnimalWhere } from '../utils/filtering';
import { mapAnimalOrderField, buildOrderBy } from '../utils/sorting';
import { paginate } from '../utils/pagination';
const prisma = new PrismaClient();

export const animalResolvers = {
  Query: {
    animals: (_: any, args: { search?: string, filter?: any }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where = buildAnimalWhere(args.filter, args.search);
      return prisma.animal.findMany({ where });
    },
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
    createAnimal: async (
      _: any,
      args: {
        name: string;
        species?: string;
        habitat?: string;
        diet?: string;
        conservation_status?: string;
        category: string;
      },
      context: { userId?: number }
    ) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      return await prisma.animal.create({
        data: {
          name: args.name,
          species: args.species,
          habitat: args.habitat,
          diet: args.diet,
          conservation_status: args.conservation_status,
          category: args.category,
          createdBy: context.userId,
          modifiedBy: context.userId,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      });
    },
    updateAnimal: async (
      _: any,
      args: {
        id: number;
        name?: string;
        species?: string;
        habitat?: string;
        diet?: string;
        conservation_status?: string;
        category?: string;
      },
      context: { userId?: number }
    ) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      return await prisma.animal.update({
        where: { id: Number(args.id) },
        data: {
          ...(args.name !== undefined ? { name: args.name } : {}),
          ...(args.species !== undefined ? { species: args.species } : {}),
          ...(args.habitat !== undefined ? { habitat: args.habitat } : {}),
          ...(args.diet !== undefined ? { diet: args.diet } : {}),
          ...(args.conservation_status !== undefined ? { conservation_status: args.conservation_status } : {}),
          ...(args.category !== undefined ? { category: args.category } : {}),
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
