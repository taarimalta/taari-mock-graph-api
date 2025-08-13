import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const animalResolvers = {
  Query: {
    animals: (_: any, args: { search?: string, filter?: any }) => {
      // Deprecated: Use animalsPaginated
      const { buildAnimalWhere } = require('../utils/filtering');
      const where = buildAnimalWhere(args.filter, args.search);
      return prisma.animal.findMany({ where });
    },
    animalsPaginated: async (_: any, args: {
      search?: string,
      filter?: any,
      orderBy?: any,
      args?: any
    }) => {
      const { buildAnimalWhere } = require('../utils/filtering');
      const { mapAnimalOrderField, buildOrderBy } = require('../utils/sorting');
      const { paginate } = require('../utils/pagination');

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
      });
      return {
        data: Array.isArray(result.items) ? result.items : [],
        pagination: result.pagination,
      };
    },
    animal: (_: any, args: { id: number }) =>
      prisma.animal.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    createAnimal: (
      _: any,
      args: {
        name: string;
        species?: string;
        habitat?: string;
        diet?: string;
        conservation_status?: string;
        category: string;
      }
    ) =>
      prisma.animal.create({
        data: {
          name: args.name,
          species: args.species,
          habitat: args.habitat,
          diet: args.diet,
          conservation_status: args.conservation_status,
          category: args.category,
        },
      }),
    updateAnimal: (
      _: any,
      args: {
        id: number;
        name?: string;
        species?: string;
        habitat?: string;
        diet?: string;
        conservation_status?: string;
        category?: string;
      }
    ) =>
      prisma.animal.update({
        where: { id: Number(args.id) },
        data: {
          ...(args.name !== undefined ? { name: args.name } : {}),
          ...(args.species !== undefined ? { species: args.species } : {}),
          ...(args.habitat !== undefined ? { habitat: args.habitat } : {}),
          ...(args.diet !== undefined ? { diet: args.diet } : {}),
          ...(args.conservation_status !== undefined ? { conservation_status: args.conservation_status } : {}),
          ...(args.category !== undefined ? { category: args.category } : {}),
        },
      }),
    deleteAnimal: (_: any, args: { id: number }) =>
      prisma.animal.delete({ where: { id: Number(args.id) } }),
  },
};
