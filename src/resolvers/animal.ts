import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const animalResolvers = {
  Query: {
    animals: (_: any, args: { search?: string, filter?: any }) => {
      const where: any = {};
      if (args.filter) {
        if (args.filter.category) where.category = args.filter.category;
        if (args.filter.species) where.species = { contains: args.filter.species };
        if (args.filter.habitat) where.habitat = { contains: args.filter.habitat };
        if (args.filter.diet) where.diet = { contains: args.filter.diet };
        if (args.filter.conservation_status) where.conservation_status = { contains: args.filter.conservation_status };
        if (args.filter.name) where.name = { contains: args.filter.name };
      }
      if (args.search) {
        where.OR = [
          { name: { contains: args.search } },
          { species: { contains: args.search } },
          { habitat: { contains: args.search } },
          { diet: { contains: args.search } },
          { conservation_status: { contains: args.search } },
          { category: { contains: args.search } }
        ];
      }
      return prisma.animal.findMany({ where });
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
