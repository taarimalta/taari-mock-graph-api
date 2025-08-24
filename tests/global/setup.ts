import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = 'file:./prisma/dev.db';
const prisma = new PrismaClient();
export { prisma };

export async function setupTestData() {
  // Clean and seed test data before each test suite
  await prisma.userDomainAccess.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test users
  const testUser = await prisma.user.create({
    data: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    }
  });
  const testUser2 = await prisma.user.create({
    data: {
      id: 2,
      username: 'testuser2',
      email: 'test2@example.com',
      firstName: 'Test2',
      lastName: 'User2',
    }
  });

  // Create domains with IDs 1, 2, and 99
  const globalDomain = await prisma.domain.create({ data: { id: 1, name: 'Global', createdBy: testUser.id, modifiedBy: testUser.id } });
  const regionDomain = await prisma.domain.create({ data: { id: 2, name: 'Region', parentId: globalDomain.id, createdBy: testUser.id, modifiedBy: testUser.id } });
  const forbiddenDomain = await prisma.domain.create({ data: { id: 99, name: 'Forbidden', createdBy: testUser.id, modifiedBy: testUser.id } });
  await prisma.userDomainAccess.create({ data: { userId: testUser.id, domainId: globalDomain.id, createdBy: testUser.id, modifiedBy: testUser.id } });
  await prisma.userDomainAccess.create({ data: { userId: testUser.id, domainId: regionDomain.id, createdBy: testUser.id, modifiedBy: testUser.id } });
  // User 2 does NOT get access to domain 99
  await prisma.userDomainAccess.create({ data: { userId: testUser2.id, domainId: globalDomain.id, createdBy: testUser2.id, modifiedBy: testUser2.id } });
  await prisma.userDomainAccess.create({ data: { userId: testUser2.id, domainId: regionDomain.id, createdBy: testUser2.id, modifiedBy: testUser2.id } });
  console.log(`[setupTestData] testUser.id=${testUser.id}, testUser2.id=${testUser2.id}, globalDomain.id=${globalDomain.id}, regionDomain.id=${regionDomain.id}, forbiddenDomain.id=${forbiddenDomain.id}`);

  // Seed countries
  const countries = [
    { id: 1, name: 'Australia', continent: 'oceania', domainId: 1 },
    { id: 2, name: 'Brazil', continent: 'south_america', domainId: 2 },
    { id: 3, name: 'France', continent: 'europe', domainId: 1 },
    { id: 4, name: 'Kenya', continent: 'africa', domainId: 2 },
    { id: 5, name: 'Japan', continent: 'asia', domainId: 1 },
    { id: 6, name: 'Forbidden Country', continent: 'europe', domainId: 99 }, // for negative test
  ];
  for (const country of countries) {
    await prisma.country.create({
      data: {
        ...country,
        createdBy: testUser.id,
        modifiedBy: testUser.id,
      }
    });
  }

  // Seed animals
  const animals = [
    { id: 1, name: 'Axolotl', category: 'amphibian', domainId: 1 },
    { id: 2, name: 'Bald Eagle', category: 'bird', domainId: 2 },
    { id: 3, name: 'Elephant', category: 'mammal', domainId: 1 },
    { id: 4, name: 'Komodo Dragon', category: 'reptile', domainId: 2 },
    { id: 5, name: 'Clownfish', category: 'fish', domainId: 1 },
    { id: 6, name: 'Forbidden Animal', category: 'mammal', domainId: 99 }, // for negative test
  ];
  for (const animal of animals) {
    await prisma.animal.create({
      data: {
        ...animal,
        createdBy: testUser.id,
        modifiedBy: testUser.id,
      }
    });
  }

  await prisma.$disconnect();
  return { testUserId: testUser.id };
}

export async function cleanupTestData() {
  await prisma.userDomainAccess.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
}
