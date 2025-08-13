// src/utils/filtering.ts
// Utility functions for building Prisma where clauses from GraphQL filters

export function buildCountryWhere(filter: any, search?: string): any {
  const where: any = {};
  if (filter) {
    if (filter.continent) where.continent = filter.continent;
    if (filter.populationMin) where.population = { ...where.population, gte: filter.populationMin };
    if (filter.populationMax) where.population = { ...where.population, lte: filter.populationMax };
    if (filter.areaMin) where.area = { ...where.area, gte: filter.areaMin };
    if (filter.areaMax) where.area = { ...where.area, lte: filter.areaMax };
    if (filter.name) where.name = { contains: filter.name };
    if (filter.capital) where.capital = { contains: filter.capital };
    if (filter.currency) where.currency = { contains: filter.currency };
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { capital: { contains: search } },
      { currency: { contains: search } },
      { continent: { equals: search } },
    ];
  }
  return where;
}

export function buildAnimalWhere(filter: any, search?: string): any {
  const where: any = {};
  if (filter) {
    if (filter.category) where.category = filter.category;
    if (filter.species) where.species = { contains: filter.species };
    if (filter.habitat) where.habitat = { contains: filter.habitat };
    if (filter.diet) where.diet = { contains: filter.diet };
    if (filter.conservation_status) where.conservation_status = { contains: filter.conservation_status };
    if (filter.name) where.name = { contains: filter.name };
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { species: { contains: search } },
      { habitat: { contains: search } },
      { diet: { contains: search } },
      { conservation_status: { contains: search } },
      { category: { equals: search } },
    ];
  }
  return where;
}
