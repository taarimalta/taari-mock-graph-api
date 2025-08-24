import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
describe('Audit fields for Country and Animal (integration)', () => {
  let testUserId: number;
  let countryId: number;
  let animalId: number;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        username: 'audit_integration',
        email: 'audit_integration@example.com',
        firstName: 'Audit',
        lastName: 'Integration',
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.animal.deleteMany({ where: { createdBy: testUserId } });
    await prisma.country.deleteMany({ where: { createdBy: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('should set audit fields on country creation', async () => {
    const now = new Date();
    const country = await prisma.country.create({
      data: {
        name: 'Auditland Integration',
        capital: 'Audit City',
        population: 12345,
        area: 678.9,
        currency: 'AUD',
        continent: 'europe',
        createdAt: now,
        modifiedAt: now,
        createdBy: testUserId,
        modifiedBy: testUserId,
      },
    });
    countryId = country.id;
    expect(country.createdAt).toBeInstanceOf(Date);
    expect(country.modifiedAt).toBeInstanceOf(Date);
    expect(country.createdBy).toBe(testUserId);
    expect(country.modifiedBy).toBe(testUserId);
  });

  it('should update audit fields on country update', async () => {
    const before = await prisma.country.findUnique({ where: { id: countryId } });
    const updated = await prisma.country.update({
      where: { id: countryId },
      data: {
        name: 'Auditland Integration Updated',
        modifiedAt: new Date(),
        modifiedBy: testUserId,
      },
    });
    expect(updated.createdAt.getTime()).toBe(before!.createdAt.getTime());
    expect(updated.createdBy).toBe(before!.createdBy);
    expect(updated.modifiedAt).not.toBeNull();
    expect(before!.modifiedAt).not.toBeNull();
    expect(updated.modifiedAt!.getTime()).toBeGreaterThanOrEqual(before!.modifiedAt!.getTime());
    expect(updated.modifiedBy).toBe(testUserId);
  });

  it('should set audit fields on animal creation', async () => {
    const now = new Date();
    const animal = await prisma.animal.create({
      data: {
        name: 'Audit Cat Integration',
        species: 'Audit Felis',
        habitat: 'Audit Habitat',
        diet: 'Audit Diet',
        conservation_status: 'Audit Status',
        category: 'mammals',
        createdAt: now,
        modifiedAt: now,
        createdBy: testUserId,
        modifiedBy: testUserId,
      },
    });
    animalId = animal.id;
    expect(animal.createdAt).toBeInstanceOf(Date);
    expect(animal.modifiedAt).toBeInstanceOf(Date);
    expect(animal.createdBy).toBe(testUserId);
    expect(animal.modifiedBy).toBe(testUserId);
  });

  it('should update audit fields on animal update', async () => {
    const before = await prisma.animal.findUnique({ where: { id: animalId } });
    const updated = await prisma.animal.update({
      where: { id: animalId },
      data: {
        name: 'Audit Cat Integration Updated',
        modifiedAt: new Date(),
        modifiedBy: testUserId,
      },
    });
    expect(updated.createdAt.getTime()).toBe(before!.createdAt.getTime());
    expect(updated.createdBy).toBe(before!.createdBy);
    expect(updated.modifiedAt).not.toBeNull();
    expect(before!.modifiedAt).not.toBeNull();
    expect(updated.modifiedAt!.getTime()).toBeGreaterThanOrEqual(before!.modifiedAt!.getTime());
    expect(updated.modifiedBy).toBe(testUserId);
  });
});
