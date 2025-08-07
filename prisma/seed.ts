import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete all data (order matters for foreign keys, if any)
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});

  // Reset SQLite auto-increment counters (optional, for clean IDs)
  await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name = "Animal" OR name = "Country";');

  // Seed countries (one for each continent)
  await prisma.country.create({
    data: {
      name: 'Nigeria',
      capital: 'Abuja',
      population: 206139589,
      area: 923768,
      currency: 'NGN',
      continent: 'africa',
    },
  });
  await prisma.country.create({
    data: {
      name: 'China',
      capital: 'Beijing',
      population: 1402112000,
      area: 9596961,
      currency: 'CNY',
      continent: 'asia',
    },
  });
  await prisma.country.create({
    data: {
      name: 'France',
      capital: 'Paris',
      population: 67081000,
      area: 551695,
      currency: 'EUR',
      continent: 'europe',
    },
  });
  await prisma.country.create({
    data: {
      name: 'United States',
      capital: 'Washington, D.C.',
      population: 331893745,
      area: 9833517,
      currency: 'USD',
      continent: 'northamerica',
    },
  });
  await prisma.country.create({
    data: {
      name: 'Brazil',
      capital: 'Brasília',
      population: 212559417,
      area: 8515767,
      currency: 'BRL',
      continent: 'southamerica',
    },
  });
  await prisma.country.create({
    data: {
      name: 'Australia',
      capital: 'Canberra',
      population: 25687041,
      area: 7692024,
      currency: 'AUD',
      continent: 'oceania',
    },
  });

  // Seed animals (one for each category)
  await prisma.animal.create({
    data: {
      name: 'African Elephant',
      species: 'Loxodonta africana',
      habitat: 'Savannah',
      diet: 'Herbivore',
      conservation_status: 'Vulnerable',
      category: 'mammals',
    },
  });
  await prisma.animal.create({
    data: {
      name: 'Bald Eagle',
      species: 'Haliaeetus leucocephalus',
      habitat: 'Forests, near water',
      diet: 'Carnivore',
      conservation_status: 'Least Concern',
      category: 'birds',
    },
  });
  await prisma.animal.create({
    data: {
      name: 'Komodo Dragon',
      species: 'Varanus komodoensis',
      habitat: 'Tropical savanna forests',
      diet: 'Carnivore',
      conservation_status: 'Endangered',
      category: 'reptiles',
    },
  });
  await prisma.animal.create({
    data: {
      name: 'Axolotl',
      species: 'Ambystoma mexicanum',
      habitat: 'Freshwater lakes',
      diet: 'Carnivore',
      conservation_status: 'Critically Endangered',
      category: 'amphibians',
    },
  });
  await prisma.animal.create({
    data: {
      name: 'Great White Shark',
      species: 'Carcharodon carcharias',
      habitat: 'Coastal waters',
      diet: 'Carnivore',
      conservation_status: 'Vulnerable',
      category: 'fish',
    },
  });
  await prisma.animal.create({
    data: {
      name: 'Monarch Butterfly',
      species: 'Danaus plexippus',
      habitat: 'Meadows, fields',
      diet: 'Herbivore',
      conservation_status: 'Endangered',
      category: 'insects',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
