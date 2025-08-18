import { PrismaClient } from '@prisma/client';
import { buildCountryWhere } from '../utils/filtering';
import { mapCountryOrderField, buildOrderBy } from '../utils/sorting';
import { paginate } from '../utils/pagination';
const prisma = new PrismaClient();

export const countryResolvers = {
  Query: {
    countries: (_: any, args: { search?: string, filter?: any }, context: any) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where = buildCountryWhere(args.filter, args.search);
      return prisma.country.findMany({ where });
    },
    countriesPaginated: async (_: any, args: {
      search?: string,
      filter?: any,
      orderBy?: any,
      args?: any
    }, context: any) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where = buildCountryWhere(args.filter, args.search);
      const orderField = args.orderBy?.field || 'NAME';
      const direction = args.orderBy?.direction || 'ASC';
      const orderBy = buildOrderBy(mapCountryOrderField(orderField), direction);
      const pageArgs = args.args || { first: 20 };

      const result = await paginate({
        model: prisma.country,
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
    country: (_: any, args: { id: number }, context: any) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      return prisma.country.findUnique({ where: { id: Number(args.id) } });
    },
  },
  Mutation: {
    createCountry: async (
      _: any,
      args: {
        name: string;
        capital?: string;
        population?: number;
        area?: number;
        currency?: string;
        continent: string;
      },
      context: any
    ) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header must be a valid user ID number');
      }
      return await prisma.country.create({
        data: {
          name: args.name,
          capital: args.capital,
          population: args.population,
          area: args.area,
          currency: args.currency,
          continent: args.continent,
          createdBy: userId,
          modifiedBy: userId,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      });
    },
    updateCountry: async (
      _: any,
      args: {
        id: number;
        name?: string;
        capital?: string;
        population?: number;
        area?: number;
        currency?: string;
        continent?: string;
      },
      context: any
    ) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header must be a valid user ID number');
      }
      return await prisma.country.update({
        where: { id: Number(args.id) },
        data: {
          ...(args.name !== undefined ? { name: args.name } : {}),
          ...(args.capital !== undefined ? { capital: args.capital } : {}),
          ...(args.population !== undefined ? { population: args.population } : {}),
          ...(args.area !== undefined ? { area: args.area } : {}),
          ...(args.currency !== undefined ? { currency: args.currency } : {}),
          ...(args.continent !== undefined ? { continent: args.continent } : {}),
          modifiedBy: userId,
          modifiedAt: new Date(),
        },
      });
    },
    deleteCountry: (_: any, args: { id: number }, context: any) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header must be a valid user ID number');
      }
      return prisma.country.delete({ where: { id: Number(args.id) } });
    },
  },
};
