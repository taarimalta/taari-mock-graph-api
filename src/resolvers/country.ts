import { PrismaClient } from '@prisma/client';
import { buildCountryWhere } from '../utils/filtering';
import { mapCountryOrderField, buildOrderBy } from '../utils/sorting';
import { paginate } from '../utils/pagination';
const prisma = new PrismaClient();

export const countryResolvers = {
  Query: {
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
  include: { creator: true, modifier: true },
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
    createCountry: async (_: any, args: { input: any }, context: any) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header must be a valid user ID number');
      }
      const input = args.input || {};
      return await prisma.country.create({
        data: {
          name: input.name,
          capital: input.capital,
          population: input.population,
          area: input.area,
          currency: input.currency,
          continent: input.continent,
          createdBy: userId,
          modifiedBy: userId,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      });
    },
    updateCountry: async (_: any, args: { input: any }, context: any) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header must be a valid user ID number');
      }
      const input = args.input || {};
      return await prisma.country.update({
        where: { id: Number(input.id) },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.capital !== undefined ? { capital: input.capital } : {}),
          ...(input.population !== undefined ? { population: input.population } : {}),
          ...(input.area !== undefined ? { area: input.area } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.continent !== undefined ? { continent: input.continent } : {}),
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
  // Field resolvers to return full User objects for audit fields
  Country: {
    createdBy: async (country: any) => {
      if (country.creator) return country.creator;
      if (!country.createdBy) return null;
      return prisma.user.findUnique({ where: { id: country.createdBy } });
    },
    modifiedBy: async (country: any) => {
      if (country.modifier) return country.modifier;
      if (!country.modifiedBy) return null;
      return prisma.user.findUnique({ where: { id: country.modifiedBy } });
    },
  },
};
