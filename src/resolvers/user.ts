import { PrismaClient } from '@prisma/client';
import { isValidEmail, isNonEmptyString } from '../utils/validation';
import { paginate } from '../utils/pagination';
const prisma = new PrismaClient();

export const userResolvers = {
  Query: {
    usersPaginated: async (_: any, args: any, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const where: any = {};
      if (args.search) {
        where.OR = [
          { username: { contains: args.search, mode: 'insensitive' } },
          { email: { contains: args.search, mode: 'insensitive' } },
          { firstName: { contains: args.search, mode: 'insensitive' } },
          { lastName: { contains: args.search, mode: 'insensitive' } },
        ];
      }
      if (args.filter) {
        if (args.filter.username) where.username = { contains: args.filter.username, mode: 'insensitive' };
        if (args.filter.email) where.email = { contains: args.filter.email, mode: 'insensitive' };
        if (args.filter.firstName) where.firstName = { contains: args.filter.firstName, mode: 'insensitive' };
        if (args.filter.lastName) where.lastName = { contains: args.filter.lastName, mode: 'insensitive' };
      }
      const orderField = args.orderBy?.field || 'username';
      const direction = args.orderBy?.direction || 'ASC';
      const orderBy = [ { [orderField]: direction.toLowerCase() }, { id: direction.toLowerCase() } ];
      const pageArgs = args.args || { first: 20 };

      const result = await paginate({
        model: prisma.user,
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
    user: (_: any, args: { id: number }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      return prisma.user.findUnique({ where: { id: Number(args.id) } });
    },
  },
  Mutation: {
    createUser: async (_: any, args: { input: any }, context: { userId?: number }) => {
      // Allow creation without x-user-id (e.g., onboarding) - still validate inputs
      const input = args.input || {};
      if (!isNonEmptyString(input.username)) throw new Error('username is required');
      if (!isNonEmptyString(input.email) || !isValidEmail(input.email)) throw new Error('a valid email is required');

      // Enforce unique username/email at application level to provide clearer errors
      const existing = await prisma.user.findFirst({ where: { OR: [{ username: input.username }, { email: input.email }] } });
      if (existing) throw new Error('username or email already in use');

      const now = new Date();
      const createData: any = { username: input.username, email: input.email, firstName: input.firstName, lastName: input.lastName, createdAt: now, modifiedAt: now };
      if (context?.userId && Number.isFinite(context.userId) && context.userId > 0) {
        createData.createdBy = context.userId;
        createData.modifiedBy = context.userId;
      }
      return prisma.user.create({ data: createData });
    },
    updateUser: async (_: any, args: { input: any }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const input = args.input || {};
      if (!input.id) throw new Error('id is required');
      const id = Number(input.id);
      const current = await prisma.user.findUnique({ where: { id } });
      if (!current) return null;

      const updateData: any = {};
      if (input.username !== undefined) {
        if (!isNonEmptyString(input.username)) throw new Error('username must be a non-empty string');
        updateData.username = input.username;
      }
      if (input.email !== undefined) {
        if (!isNonEmptyString(input.email) || !isValidEmail(input.email)) throw new Error('a valid email is required');
        updateData.email = input.email;
      }
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;

      updateData.modifiedAt = new Date();
      if (context?.userId && Number.isFinite(context.userId) && context.userId > 0) {
        updateData.modifiedBy = context.userId;
      }

      try {
        return await prisma.user.update({ where: { id }, data: updateData });
      } catch (e: any) {
        // Handle unique constraint errors from Prisma
        if (e?.code === 'P2002') {
          throw new Error('username or email already in use');
        }
        throw e;
      }
    },
    deleteUser: async (_: any, args: { id: number }, context: { userId?: number }) => {
      if (!context.userId || !Number.isFinite(context.userId) || context.userId <= 0) {
        throw new Error('x-user-id header is required and must be a valid user ID number');
      }
      const id = Number(args.id);
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) return null;
      return prisma.user.delete({ where: { id } });
    },
  },
  // Field resolvers for User audit relations
  User: {
    createdBy: async (user: any) => {
      if (user.creator) return user.creator;
      if (!user.createdBy) return null;
      return prisma.user.findUnique({ where: { id: user.createdBy } });
    },
    modifiedBy: async (user: any) => {
      if (user.modifier) return user.modifier;
      if (!user.modifiedBy) return null;
      return prisma.user.findUnique({ where: { id: user.modifiedBy } });
    },
  },
};
