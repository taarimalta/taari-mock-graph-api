import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const animalResolvers = {
  Query: {
    animals: () => prisma.animal.findMany(),
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
