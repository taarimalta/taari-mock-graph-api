import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const countryResolvers = {
  Query: {
    countries: (_: any, args: { search?: string, filter?: any }) => {
      const where: any = {};
      if (args.filter) {
        if (args.filter.continent) where.continent = args.filter.continent;
        if (args.filter.populationMin || args.filter.populationMax) {
          where.population = {};
          if (args.filter.populationMin) where.population.gte = args.filter.populationMin;
          if (args.filter.populationMax) where.population.lte = args.filter.populationMax;
        }
        if (args.filter.areaMin || args.filter.areaMax) {
          where.area = {};
          if (args.filter.areaMin) where.area.gte = args.filter.areaMin;
          if (args.filter.areaMax) where.area.lte = args.filter.areaMax;
        }
        if (args.filter.name) where.name = { contains: args.filter.name, mode: 'insensitive' };
        if (args.filter.capital) where.capital = { contains: args.filter.capital, mode: 'insensitive' };
        if (args.filter.currency) where.currency = { contains: args.filter.currency, mode: 'insensitive' };
      }
      if (args.search) {
        where.OR = [
          { name: { contains: args.search, mode: 'insensitive' } },
          { capital: { contains: args.search, mode: 'insensitive' } },
          { currency: { contains: args.search, mode: 'insensitive' } },
          { continent: { contains: args.search, mode: 'insensitive' } }
        ];
      }
      return prisma.country.findMany({ where });
    },
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
