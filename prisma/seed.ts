import { PrismaClient } from '@prisma/client';
import logger from '../src/logger';
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
    await prisma.animal.create({ data: animal });
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
