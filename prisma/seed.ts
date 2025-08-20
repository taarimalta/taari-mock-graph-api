import { PrismaClient } from '@prisma/client';
import logger from '../src/logger';
const prisma = new PrismaClient();

async function main() {
  // Sanity check: ensure required audit columns exist on User before we mutate data.
  const cols: { name: string }[] = await prisma.$queryRawUnsafe(`PRAGMA table_info('User');`);
  const colNames = cols.map(c => c.name);
  const required = ['createdBy', 'modifiedBy'];
  const missing = required.filter(r => !colNames.includes(r));
  if (missing.length) {
    logger.error(`Seed aborted: required User columns missing: ${missing.join(', ')}.\nRun migrations (npm run db:migrate) to apply schema before seeding.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  // Delete all data (order matters for foreign keys, if any)
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.user.deleteMany({});

  // Reset SQLite auto-increment counters (optional, for clean IDs)
  await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name = "Animal" OR name = "Country" OR name = "User";');

  // Seed users
  const now = new Date();
  const users = [
    { username: 'alice', email: 'alice@example.com', firstName: 'Alice', lastName: 'Anderson' },
    { username: 'bob', email: 'bob@example.com', firstName: 'Bob', lastName: 'Brown' }
  ];
  const createdUsers: { id: number }[] = [];
  for (const user of users) {
    const created = await prisma.user.create({ data: { ...user, createdAt: now, modifiedAt: now } });
    createdUsers.push(created);
  }
  const seedUserId = createdUsers[0].id;

  // Update created users to set createdBy/modifiedBy to the seedUserId (self-referential)
  for (const u of createdUsers) {
    await prisma.user.update({ where: { id: u.id }, data: { createdBy: seedUserId, modifiedBy: seedUserId } });
  }

  // Seed countries (one for each continent)
  const countrySeed = [
    {
      name: 'Nigeria', capital: 'Abuja', population: 206139589, area: 923768, currency: 'NGN', continent: 'africa',
    },
    {
      name: 'China', capital: 'Beijing', population: 1402112000, area: 9596961, currency: 'CNY', continent: 'asia',
    },
    {
      name: 'France', capital: 'Paris', population: 67081000, area: 551695, currency: 'EUR', continent: 'europe',
    },
    {
      name: 'United States', capital: 'Washington, D.C.', population: 331893745, area: 9833517, currency: 'USD', continent: 'northamerica',
    },
    {
      name: 'Brazil', capital: 'Brasília', population: 212559417, area: 8515767, currency: 'BRL', continent: 'southamerica',
    },
    {
      name: 'Australia', capital: 'Canberra', population: 25687041, area: 7692024, currency: 'AUD', continent: 'oceania',
    },
  ];
  for (const country of countrySeed) {
    await prisma.country.create({
      data: {
        ...country,
        createdAt: now,
        modifiedAt: now,
        createdBy: seedUserId,
        modifiedBy: seedUserId,
      },
    });
  }

  // Seed animals (many, with diverse and overlapping data for robust search/filter testing)
  const animals = [
    // Mammals
    { name: 'African Elephant', species: 'Loxodonta africana', habitat: 'Savannah', diet: 'Herbivore', conservation_status: 'Vulnerable', category: 'mammals' },
    { name: 'Wildcat', species: 'Felis silvestris', habitat: 'Forest', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'mammals' },
    { name: 'Bobcat', species: 'Lynx rufus', habitat: 'Woodlands', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'mammals' },
    { name: 'Cheetah', species: 'Acinonyx jubatus', habitat: 'Grasslands', diet: 'Carnivore', conservation_status: 'Vulnerable', category: 'mammals' },
    { name: 'Lion', species: 'Panthera leo', habitat: 'Savannah', diet: 'Carnivore', conservation_status: 'Vulnerable', category: 'mammals' },
    { name: 'Catfish', species: 'Siluriformes', habitat: 'Rivers', diet: 'Omnivore', conservation_status: 'Least Concern', category: 'fish' },
    { name: 'Jaguar', species: 'Panthera onca', habitat: 'Rainforest', diet: 'Carnivore', conservation_status: 'Near Threatened', category: 'mammals' },
    { name: 'House Cat', species: 'Felis catus', habitat: 'Domestic', diet: 'Carnivore', conservation_status: 'Domesticated', category: 'mammals' },
    { name: 'Bat', species: 'Chiroptera', habitat: 'Caves', diet: 'Insectivore', conservation_status: 'Least Concern', category: 'mammals' },
    // Birds
    { name: 'Bald Eagle', species: 'Haliaeetus leucocephalus', habitat: 'Forests, near water', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'birds' },
    { name: 'Peregrine Falcon', species: 'Falco peregrinus', habitat: 'Cliffs', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'birds' },
    { name: 'Emperor Penguin', species: 'Aptenodytes forsteri', habitat: 'Antarctic', diet: 'Carnivore', conservation_status: 'Near Threatened', category: 'birds' },
    { name: 'Ostrich', species: 'Struthio camelus', habitat: 'Savannah', diet: 'Omnivore', conservation_status: 'Least Concern', category: 'birds' },
    { name: 'Parrot', species: 'Psittaciformes', habitat: 'Rainforest', diet: 'Herbivore', conservation_status: 'Least Concern', category: 'birds' },
    // Reptiles
    { name: 'Komodo Dragon', species: 'Varanus komodoensis', habitat: 'Tropical savanna forests', diet: 'Carnivore', conservation_status: 'Endangered', category: 'reptiles' },
    { name: 'Green Iguana', species: 'Iguana iguana', habitat: 'Rainforest', diet: 'Herbivore', conservation_status: 'Least Concern', category: 'reptiles' },
    { name: 'King Cobra', species: 'Ophiophagus hannah', habitat: 'Forest', diet: 'Carnivore', conservation_status: 'Vulnerable', category: 'reptiles' },
    { name: 'Gila Monster', species: 'Heloderma suspectum', habitat: 'Desert', diet: 'Carnivore', conservation_status: 'Near Threatened', category: 'reptiles' },
    // Amphibians
    { name: 'Axolotl', species: 'Ambystoma mexicanum', habitat: 'Freshwater lakes', diet: 'Carnivore', conservation_status: 'Critically Endangered', category: 'amphibians' },
    { name: 'Poison Dart Frog', species: 'Dendrobatidae', habitat: 'Rainforest', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'amphibians' },
    { name: 'Tiger Salamander', species: 'Ambystoma tigrinum', habitat: 'Woodlands', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'amphibians' },
    { name: 'Toad', species: 'Bufonidae', habitat: 'Wetlands', diet: 'Insectivore', conservation_status: 'Least Concern', category: 'amphibians' },
    // Fish
    { name: 'Great White Shark', species: 'Carcharodon carcharias', habitat: 'Coastal waters', diet: 'Carnivore', conservation_status: 'Vulnerable', category: 'fish' },
    { name: 'Clownfish', species: 'Amphiprioninae', habitat: 'Coral reefs', diet: 'Omnivore', conservation_status: 'Least Concern', category: 'fish' },
    { name: 'Salmon', species: 'Salmo salar', habitat: 'Rivers', diet: 'Omnivore', conservation_status: 'Least Concern', category: 'fish' },
    { name: 'Catfish', species: 'Siluriformes', habitat: 'Rivers', diet: 'Omnivore', conservation_status: 'Least Concern', category: 'fish' },
    // Insects
    { name: 'Monarch Butterfly', species: 'Danaus plexippus', habitat: 'Meadows, fields', diet: 'Herbivore', conservation_status: 'Endangered', category: 'insects' },
    { name: 'Dragonfly', species: 'Anisoptera', habitat: 'Wetlands', diet: 'Carnivore', conservation_status: 'Least Concern', category: 'insects' },
    { name: 'Honey Bee', species: 'Apis mellifera', habitat: 'Meadows', diet: 'Herbivore', conservation_status: 'Least Concern', category: 'insects' },
    { name: 'Firefly', species: 'Lampyridae', habitat: 'Forests', diet: 'Omnivore', conservation_status: 'Least Concern', category: 'insects' },
    { name: 'Tiger Moth', species: 'Arctiinae', habitat: 'Forests', diet: 'Herbivore', conservation_status: 'Least Concern', category: 'insects' },
  ];
  for (const animal of animals) {
    await prisma.animal.create({
      data: {
        ...animal,
        createdAt: now,
        modifiedAt: now,
        createdBy: seedUserId,
        modifiedBy: seedUserId,
      },
    });
  }
}

main()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
