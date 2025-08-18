import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestData() {
  // Clean and seed test data before each test suite
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    }
  });

  // Seed countries
  const countries = [
    { name: 'Australia', continent: 'oceania' },
    { name: 'Brazil', continent: 'south_america' },
    { name: 'China', continent: 'asia' },
    { name: 'France', continent: 'europe' },
    { name: 'Kenya', continent: 'africa' },
    { name: 'Test Country', continent: 'africa' },
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
    { name: 'Axolotl', category: 'amphibian' },
    { name: 'Bald Eagle', category: 'bird' },
    { name: 'Elephant', category: 'mammal' },
    { name: 'Komodo Dragon', category: 'reptile' },
    { name: 'Clownfish', category: 'fish' },
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

  return { testUserId: testUser.id };
}

export async function cleanupTestData() {
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.user.deleteMany({});
}
