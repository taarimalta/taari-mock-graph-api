import { PrismaClient } from '@prisma/client';
import logger from '../src/logger';

export async function seedTestData(prisma: PrismaClient) {
  // Sanity check: ensure required audit columns exist on User before we mutate data.
  const cols: { name: string }[] = await prisma.$queryRawUnsafe(`PRAGMA table_info('User');`);
  const colNames = cols.map(c => c.name);
  const required = ['createdBy', 'modifiedBy'];
  const missing = required.filter(r => !colNames.includes(r));
  if (missing.length) {
    throw new Error(`Seed aborted: required User columns missing: ${missing.join(', ')}. Run migrations (npm run db:migrate) to apply schema before seeding.`);
  }
  // Delete all data (order matters for foreign keys, if any)
  await prisma.userDomainAccess.deleteMany({});
  await prisma.animal.deleteMany({});
  await prisma.country.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.user.deleteMany({});

  // Reset SQLite auto-increment counters (optional, for clean IDs)
  await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name = "Animal" OR name = "Country" OR name = "User" OR name = "Domain" OR name = "UserDomainAccess";');

  // Seed users
  const now = new Date();
  // We'll assign all users to the root domain (domainRoot)
  const users = [
    { username: 'alice', email: 'alice@example.com', firstName: 'Alice', lastName: 'Anderson' },
    { username: 'bob', email: 'bob@example.com', firstName: 'Bob', lastName: 'Brown' },
    { username: 'carol', email: 'carol@example.com', firstName: 'Carol', lastName: 'Clark' },
    { username: 'dave', email: 'dave@example.com', firstName: 'Dave', lastName: 'Davis' },
    { username: 'eve', email: 'eve@example.com', firstName: 'Eve', lastName: 'Evans' },
    { username: 'frank', email: 'frank@example.com', firstName: 'Frank', lastName: 'Foster' },
    { username: 'grace', email: 'grace@example.com', firstName: 'Grace', lastName: 'Green' },
    { username: 'heidi', email: 'heidi@example.com', firstName: 'Heidi', lastName: 'Hall' },
    { username: 'ivan', email: 'ivan@example.com', firstName: 'Ivan', lastName: 'Iverson' },
    { username: 'judy', email: 'judy@example.com', firstName: 'Judy', lastName: 'Jones' }
  ];
  const createdUsers: { id: number }[] = [];
  // Seed domains (4-level organization hierarchy)
  const createdDomains: { id: number, name: string, level: number }[] = [];
  // Top-level organizations (level 1)
  const orgA = await prisma.domain.create({ data: { name: 'OrgA', createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgA.id, name: orgA.name, level: 1 });
  const orgB = await prisma.domain.create({ data: { name: 'OrgB', createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgB.id, name: orgB.name, level: 1 });
  // Level 2: Regions
  const orgARegion1 = await prisma.domain.create({ data: { name: 'OrgA - Americas', parentId: orgA.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgARegion1.id, name: orgARegion1.name, level: 2 });
  const orgARegion2 = await prisma.domain.create({ data: { name: 'OrgA - Europe', parentId: orgA.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgARegion2.id, name: orgARegion2.name, level: 2 });
  const orgBRegion1 = await prisma.domain.create({ data: { name: 'OrgB - Asia', parentId: orgB.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgBRegion1.id, name: orgBRegion1.name, level: 2 });
  const orgBRegion2 = await prisma.domain.create({ data: { name: 'OrgB - Africa', parentId: orgB.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgBRegion2.id, name: orgBRegion2.name, level: 2 });
  // Level 3: Departments
  const orgADept1 = await prisma.domain.create({ data: { name: 'OrgA - Americas - HR', parentId: orgARegion1.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgADept1.id, name: orgADept1.name, level: 3 });
  const orgADept2 = await prisma.domain.create({ data: { name: 'OrgA - Americas - Engineering', parentId: orgARegion1.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgADept2.id, name: orgADept2.name, level: 3 });
  const orgBDept1 = await prisma.domain.create({ data: { name: 'OrgB - Asia - HR', parentId: orgBRegion1.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgBDept1.id, name: orgBDept1.name, level: 3 });
  const orgBDept2 = await prisma.domain.create({ data: { name: 'OrgB - Asia - Engineering', parentId: orgBRegion1.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgBDept2.id, name: orgBDept2.name, level: 3 });
  // Level 4: Teams
  const orgADept1Team1 = await prisma.domain.create({ data: { name: 'OrgA - Americas - HR - Team Alpha', parentId: orgADept1.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgADept1Team1.id, name: orgADept1Team1.name, level: 4 });
  const orgADept2Team1 = await prisma.domain.create({ data: { name: 'OrgA - Americas - Engineering - Team Beta', parentId: orgADept2.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgADept2Team1.id, name: orgADept2Team1.name, level: 4 });
  const orgBDept1Team1 = await prisma.domain.create({ data: { name: 'OrgB - Asia - HR - Team Gamma', parentId: orgBDept1.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgBDept1Team1.id, name: orgBDept1Team1.name, level: 4 });
  const orgBDept2Team1 = await prisma.domain.create({ data: { name: 'OrgB - Asia - Engineering - Team Delta', parentId: orgBDept2.id, createdAt: now, modifiedAt: now, createdBy: null, modifiedBy: null } });
  createdDomains.push({ id: orgBDept2Team1.id, name: orgBDept2Team1.name, level: 4 });
  // Assign users to different orgs/levels
  // Assign each user to a different domain for variety
  const userDomainMap = [
    orgA.id,                // alice: OrgA (root)
    orgB.id,                // bob: OrgB (root)
    orgARegion1.id,         // carol: OrgA - Americas (region)
    orgARegion2.id,         // dave: OrgA - Europe (region)
    orgBRegion1.id,         // eve: OrgB - Asia (region)
    orgBRegion2.id,         // frank: OrgB - Africa (region)
    orgADept1.id,           // grace: OrgA - Americas - HR (department)
    orgADept2Team1.id,      // heidi: OrgA - Americas - Engineering - Team Beta (team)
    orgBDept1Team1.id,      // ivan: OrgB - Asia - HR - Team Gamma (team)
    orgBDept2Team1.id       // judy: OrgB - Asia - Engineering - Team Delta (team)
  ];
  for (let i = 0; i < users.length; i++) {
    const domainId = userDomainMap[i % userDomainMap.length];
    const created = await prisma.user.create({ data: { ...users[i], createdAt: now, modifiedAt: now, domainId } });
    createdUsers.push(created);
  }
  const seedUserId = createdUsers[0].id;

  // Update created users to set createdBy/modifiedBy to their own id (self-referential)
  for (const u of createdUsers) {
    await prisma.user.update({ where: { id: u.id }, data: { createdBy: u.id, modifiedBy: u.id } });
  }

  // Assign varied domain access to each user
  // alice: OrgA (root) - broadest access (all domains under OrgA)
  for (const d of createdDomains.filter(d => d.name.startsWith('OrgA'))) {
    await prisma.userDomainAccess.create({ data: { userId: createdUsers[0].id, domainId: d.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[0].id, modifiedBy: createdUsers[0].id } });
  }
  // bob: OrgB (root) - broadest access (all domains under OrgB)
  for (const d of createdDomains.filter(d => d.name.startsWith('OrgB'))) {
    await prisma.userDomainAccess.create({ data: { userId: createdUsers[1].id, domainId: d.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[1].id, modifiedBy: createdUsers[1].id } });
  }
  // carol: OrgA - Americas (region) - access to Americas region and its departments/teams
  for (const d of createdDomains.filter(d => d.name.startsWith('OrgA - Americas'))) {
    await prisma.userDomainAccess.create({ data: { userId: createdUsers[2].id, domainId: d.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[2].id, modifiedBy: createdUsers[2].id } });
  }
  // dave: OrgA - Europe (region) - only Europe region
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[3].id, domainId: orgARegion2.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[3].id, modifiedBy: createdUsers[3].id } });
  // eve: OrgB - Asia (region) - access to Asia region and its departments/teams
  for (const d of createdDomains.filter(d => d.name.startsWith('OrgB - Asia'))) {
    await prisma.userDomainAccess.create({ data: { userId: createdUsers[4].id, domainId: d.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[4].id, modifiedBy: createdUsers[4].id } });
  }
  // frank: OrgB - Africa (region) - only Africa region
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[5].id, domainId: orgBRegion2.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[5].id, modifiedBy: createdUsers[5].id } });
  // grace: OrgA - Americas - HR (department) - only HR department
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[6].id, domainId: orgADept1.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[6].id, modifiedBy: createdUsers[6].id } });
  // heidi: OrgA - Americas - Engineering - Team Beta (team) - only Team Beta
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[7].id, domainId: orgADept2Team1.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[7].id, modifiedBy: createdUsers[7].id } });
  // ivan: OrgB - Asia - HR - Team Gamma (team) - only Team Gamma
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[8].id, domainId: orgBDept1Team1.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[8].id, modifiedBy: createdUsers[8].id } });
  // judy: OrgB - Asia - Engineering - Team Delta (team) - only Team Delta, plus OrgB root for variety
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[9].id, domainId: orgBDept2Team1.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[9].id, modifiedBy: createdUsers[9].id } });
  await prisma.userDomainAccess.create({ data: { userId: createdUsers[9].id, domainId: orgB.id, createdAt: now, modifiedAt: now, createdBy: createdUsers[9].id, modifiedBy: createdUsers[9].id } });

  // Seed countries (one for each continent)
  // Assign countries to different orgs/subdomains/levels for variety
  const countrySeed = [
    {
      name: 'Nigeria', capital: 'Abuja', population: 206139589, area: 923768, currency: 'NGN', continent: 'africa', domainId: orgBRegion2.id,
    },
    {
      name: 'China', capital: 'Beijing', population: 1402112000, area: 9596961, currency: 'CNY', continent: 'asia', domainId: orgBDept2Team1.id,
    },
    {
      name: 'France', capital: 'Paris', population: 67081000, area: 551695, currency: 'EUR', continent: 'europe', domainId: orgARegion2.id,
    },
    {
      name: 'United States', capital: 'Washington, D.C.', population: 331893745, area: 9833517, currency: 'USD', continent: 'northamerica', domainId: orgADept2Team1.id,
    },
    {
      name: 'Brazil', capital: 'Brasília', population: 212559417, area: 8515767, currency: 'BRL', continent: 'southamerica', domainId: orgADept1Team1.id,
    },
    {
      name: 'Australia', capital: 'Canberra', population: 25687041, area: 7692024, currency: 'AUD', continent: 'oceania', domainId: orgA.id,
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
        domainId: country.domainId,
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
  // Insert 10 copies of each animal (first copy keeps original name, duplicates get a numeric suffix)
  // Assign animals to different orgs/subdomains/levels for variety
  const animalDomainIds = [orgADept1Team1.id, orgADept2Team1.id, orgBDept1Team1.id, orgBDept2Team1.id, orgARegion1.id, orgBRegion1.id, orgA.id, orgB.id];
  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    const domainId = animalDomainIds[i % animalDomainIds.length];
    for (let copy = 0; copy < 10; copy++) {
      const name = copy === 0 ? animal.name : `${animal.name} ${copy + 1}`;
      await prisma.animal.create({
        data: {
          ...animal,
          name,
          createdAt: now,
          modifiedAt: now,
          createdBy: seedUserId,
          modifiedBy: seedUserId,
          domainId,
        },
      });
    }
  }
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedTestData(prisma)
    .catch((e) => {
      logger.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
