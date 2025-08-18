import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  headers: Record<string, string | undefined>;
}

export const createContext = (headers: Record<string, string | undefined>): Context => {
  return { prisma, headers };
};
