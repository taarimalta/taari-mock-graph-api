import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const countryResolvers = {
  Query: {
    countries: () => prisma.country.findMany(),
    country: (_: any, args: { id: number }) =>
      prisma.country.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    createCountry: (
      _: any,
      args: {
        name: string;
        capital?: string;
        population?: number;
        area?: number;
        currency?: string;
        continent: string;
      }
    ) =>
      prisma.country.create({
        data: {
          name: args.name,
          capital: args.capital,
          population: args.population,
          area: args.area,
          currency: args.currency,
          continent: args.continent,
        },
      }),
    updateCountry: (
      _: any,
      args: {
        id: number;
        name?: string;
        capital?: string;
        population?: number;
        area?: number;
        currency?: string;
        continent?: string;
      }
    ) =>
      prisma.country.update({
        where: { id: Number(args.id) },
        data: {
          ...(args.name !== undefined ? { name: args.name } : {}),
          ...(args.capital !== undefined ? { capital: args.capital } : {}),
          ...(args.population !== undefined ? { population: args.population } : {}),
          ...(args.area !== undefined ? { area: args.area } : {}),
          ...(args.currency !== undefined ? { currency: args.currency } : {}),
          ...(args.continent !== undefined ? { continent: args.continent } : {}),
        },
      }),
    deleteCountry: (_: any, args: { id: number }) =>
      prisma.country.delete({ where: { id: Number(args.id) } }),
  },
};
