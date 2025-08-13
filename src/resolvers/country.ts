import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const countryResolvers = {
  Query: {
    countries: (_: any, args: { search?: string, filter?: any }) => {
      // Deprecated: Use countriesPaginated
      const { buildCountryWhere } = require('../utils/filtering');
      const where = buildCountryWhere(args.filter, args.search);
      return prisma.country.findMany({ where });
    },
    countriesPaginated: async (_: any, args: {
      search?: string,
      filter?: any,
      orderBy?: any,
      args?: any
    }) => {
      try {
        const { buildCountryWhere } = require('../utils/filtering');
        const { mapCountryOrderField, buildOrderBy } = require('../utils/sorting');
        const { paginate } = require('../utils/pagination');

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
      } catch (err) {
        console.error('countriesPaginated error:', err);
        return { data: [], pagination: { hasNext: false, hasPrevious: false, startCursor: null, endCursor: null, totalCount: 0 } };
      }
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
