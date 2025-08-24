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
    }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      // Domain-based access filtering with user selection
      const { getEffectiveViewDomains } = require('../utils/domainAccess');
      const requestedDomains = context.viewDomains;
      const effectiveDomains = await getEffectiveViewDomains(prisma, userId, requestedDomains);
      if (!effectiveDomains || effectiveDomains.length === 0) {
        return { data: [], pagination: { endCursor: null, hasNext: false } };
      }
      const where = {
        ...buildCountryWhere(args.filter, args.search),
        OR: [
          { domainId: { in: effectiveDomains } }
        ]
      };
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
  country: async (_: any, args: { id: number }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const country = await prisma.country.findUnique({ where: { id: Number(args.id) } });
      if (!country) return null;
  // Do not allow access if domainId is null
  if (country.domainId == null) return null;
      const { isUserDomainAccessible } = require('../utils/domainAccess');
      const accessible = await isUserDomainAccessible(prisma, userId, country.domainId);
      return accessible ? country : null;
    },
  },
  Mutation: {
  createCountry: async (_: any, args: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
  // Use console.log for debug output in tests
      const { ApolloError } = require('apollo-server-errors');
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new ApolloError('x-user-id header must be a valid user ID number', 'BAD_USER_INPUT');
      }
      const input = args.input || {};
      // Use x-create-domain header if present, else input.domainId
      const requestedDomain = context.createDomain ?? input.domainId;
  console.log(`[createCountry] userId=${userId}, requestedDomain=${requestedDomain}`);
  console.log(`[createCountry] userId=${userId}, requestedDomain=${requestedDomain}`);
      const { getUserAccessibleDomains } = require('../utils/domainAccess');
      const accessibleDomains = await getUserAccessibleDomains(prisma, userId);
  console.log(`[createCountry] accessibleDomains=${JSON.stringify(accessibleDomains)}`);
  console.log(`[createCountry] accessibleDomains=${JSON.stringify(accessibleDomains)}`);
      const { validateCreateDomain } = require('../utils/domainAccess');
      let domainId;
      try {
        domainId = await validateCreateDomain(prisma, userId, requestedDomain);
  console.log(`[createCountry] validated domainId=${domainId}`);
  console.log(`[createCountry] validated domainId=${domainId}`);
        const result = await prisma.country.create({
          data: {
            name: input.name,
            capital: input.capital,
            population: input.population,
            area: input.area,
            currency: input.currency,
            continent: input.continent,
            domainId,
            createdBy: userId,
            modifiedBy: userId,
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        });
  console.log(`[createCountry] country created: ${JSON.stringify(result)}`);
  console.log(`[createCountry] country created: ${JSON.stringify(result)}`);
        return result;
      } catch (err) {
  console.log(`[createCountry] error creating country: ${err}`);
  console.log(`[createCountry] error creating country: ${err}`);
        const message = typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err);
        throw new ApolloError(message, 'FORBIDDEN');
      }
    },
  updateCountry: async (_: any, args: { input: any }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
      const userId = context.userId;
      if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
        throw new Error('x-user-id header must be a valid user ID number');
      }
      const input = args.input || {};
      const country = await context.prisma.country.findUnique({ where: { id: Number(input.id) } });
      if (!country) throw new Error('Country not found');
      const { isUserDomainAccessible, validateCreateDomain } = require('../utils/domainAccess');
      let domainId = country.domainId;
      // If x-create-domain is present, validate access and assign
      if (context.createDomain) {
        await validateCreateDomain(context.prisma, userId, context.createDomain);
        domainId = context.createDomain;
      }
      const hasAccess = await isUserDomainAccessible(context.prisma, userId, domainId);
      if (!hasAccess) throw new Error('Access denied: You do not have permission to update this country');
      return await context.prisma.country.update({
        where: { id: Number(input.id) },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.capital !== undefined ? { capital: input.capital } : {}),
          ...(input.population !== undefined ? { population: input.population } : {}),
          ...(input.area !== undefined ? { area: input.area } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.continent !== undefined ? { continent: input.continent } : {}),
          domainId,
          modifiedBy: userId,
          modifiedAt: new Date(),
        },
      });
    },
  deleteCountry: (_: any, args: { id: number }, context: { userId?: number; viewDomains?: number[]; createDomain?: number; prisma?: any; loadUser?: any; loadDomain?: any }) => {
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
