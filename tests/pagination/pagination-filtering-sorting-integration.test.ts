  describe('Domain-based access filtering', () => {
    let prisma: any;
    beforeAll(() => { prisma = new (require('@prisma/client').PrismaClient)(); });
    afterAll(async () => { await prisma.$disconnect(); });

    beforeEach(async () => {
      await prisma.animal.deleteMany({});
      await prisma.country.deleteMany({});
      await prisma.domain.deleteMany({});
    });

    it('should only return countries in user accessible domains or with domainId null', async () => {
      // Setup: create required domains first
      await prisma.domain.createMany({ data: [
        { id: 1, name: 'TestDomain1' },
        { id: 2, name: 'TestDomain2' }
      ] });
      // Setup: create countries in different domains
      await prisma.country.createMany({ data: [
        { name: 'DomainCountry1', continent: 'europe', domainId: 1 },
        { name: 'DomainCountry2', continent: 'asia', domainId: 2 },
        { name: 'NoDomainCountry', continent: 'africa', domainId: null },
      ] });
      // User 1 has access to domain 1 only
      const accessibleDomains = [1];
      const countries = await prisma.country.findMany({
        where: {
          OR: [
            { domainId: { in: accessibleDomains } },
            { domainId: null }
          ]
        }
      });
  expect(countries.map((c: any) => c.name)).toEqual(expect.arrayContaining(['DomainCountry1', 'NoDomainCountry']));
  expect(countries.map((c: any) => c.name)).not.toContain('DomainCountry2');
    });

  it('should only return animals in user accessible domains or with domainId null', async () => {
      // Setup: create required domains first
      await prisma.domain.createMany({ data: [
        { id: 1, name: 'TestDomain1' },
        { id: 2, name: 'TestDomain2' }
      ] });
      await prisma.animal.createMany({ data: [
        { name: 'DomainAnimal1', category: 'mammals', domainId: 1 },
        { name: 'DomainAnimal2', category: 'mammals', domainId: 2 },
        { name: 'NoDomainAnimal', category: 'mammals', domainId: null },
      ] });
      // User 1 has access to domain 1 only
      const accessibleDomains = [1];
      const animals = await prisma.animal.findMany({
        where: {
          OR: [
            { domainId: { in: accessibleDomains } },
            { domainId: null }
          ]
        }
      });
  expect(animals.map((a: any) => a.name)).toEqual(expect.arrayContaining(['DomainAnimal1', 'NoDomainAnimal']));
  expect(animals.map((a: any) => a.name)).not.toContain('DomainAnimal2');
    });
  });
import { PrismaClient } from '@prisma/client';
import { paginate } from '../../src/utils/pagination';
import { buildCountryWhere, buildAnimalWhere } from '../../src/utils/filtering';
import { buildOrderBy, mapCountryOrderField } from '../../src/utils/sorting';

const prisma = new PrismaClient();

describe('Database Integration Tests', () => {
  
  beforeAll(async () => {
    // Ensure we have some test data
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===================
  // PAGINATION INTEGRATION TESTS
  // ===================
  
  describe('Database Pagination Integration', () => {
    it('should paginate countries directly from database', async () => {
      const result = await paginate({
        model: prisma.country,
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        first: 3,
      });

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeLessThanOrEqual(3);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
      expect(typeof result.pagination.hasNext).toBe('boolean');
      expect(typeof result.pagination.hasPrevious).toBe('boolean');
    });

    it('should paginate animals with filters', async () => {
      const where = buildAnimalWhere({ category: 'mammals' });
      const result = await paginate({
        model: prisma.animal,
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        first: 2,
      });

      expect(result.items).toBeDefined();
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
      
      // Verify all returned items match the filter
      result.items.forEach(animal => {
        expect(animal.category).toBe('mammals');
      });
    });

    it('should handle cursor-based navigation', async () => {
      // Get first page
      const firstPage = await paginate({
        model: prisma.country,
        where: {},
        orderBy: [{ population: 'desc' }, { id: 'asc' }],
        first: 2,
      });

      expect(firstPage.items.length).toBeLessThanOrEqual(2);
      
      if (firstPage.pagination.endCursor && firstPage.pagination.hasNext) {
        // Get second page using cursor
        const secondPage = await paginate({
          model: prisma.country,
          where: {},
          orderBy: [{ population: 'desc' }, { id: 'asc' }],
          first: 2,
          after: firstPage.pagination.endCursor,
        });

        expect(secondPage.items.length).toBeLessThanOrEqual(2);
        expect(secondPage.pagination.hasPrevious).toBe(true);
        
        // Verify pages are not identical and overlap is less than page size
        const firstIds = firstPage.items.map(item => item.id);
        const secondIds = secondPage.items.map(item => item.id);
        const overlap = firstIds.filter(id => secondIds.includes(id));
        expect(firstIds).not.toEqual(secondIds);
        expect(overlap.length).toBeLessThan(firstPage.items.length);
      }
    });

    it('should maintain sort order across pages', async () => {
      const pages: any[] = [];
      let cursor: string | null = null;
      let hasNext = true;
      
      // Collect first few pages
      while (hasNext && pages.length < 3) {
        const page = await paginate({
          model: prisma.country,
          where: {},
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          first: 2,
          ...(cursor && { after: cursor }),
        });
        
        pages.push(page);
        cursor = page.pagination.endCursor;
        hasNext = page.pagination.hasNext;
      }

      // Verify sort order across all pages
      const allItems = pages.flatMap(page => page.items);
      for (let i = 0; i < allItems.length - 1; i++) {
        expect(allItems[i].name.localeCompare(allItems[i + 1].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should handle backward pagination correctly', async () => {
      // Get first page
      const firstPage = await paginate({
        model: prisma.animal,
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        first: 2,
      });

      if (firstPage.pagination.hasNext && firstPage.pagination.endCursor) {
        // Get next page
        const nextPage = await paginate({
          model: prisma.animal,
          where: {},
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          first: 2,
          after: firstPage.pagination.endCursor,
        });

        if (nextPage.items.length > 0 && nextPage.pagination.endCursor) {
          // Test backward pagination by going back from a later cursor
          const backPage = await paginate({
            model: prisma.animal,
            where: {},
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            last: 2,
            before: nextPage.pagination.endCursor,
          });

          // The back page should have items and proper pagination flags
          expect(backPage.items.length).toBeGreaterThan(0);
          expect(backPage.pagination.hasNext).toBe(true);
        }
      }
    });
  });

  // ===================
  // FILTER INTEGRATION TESTS
  // ===================
  
  describe('Filter Integration', () => {
    it('should filter countries by continent', async () => {
      const where = buildCountryWhere({ continent: 'europe' });
      const countries = await prisma.country.findMany({ where });
      
      countries.forEach(country => {
        expect(country.continent).toBe('europe');
      });
    });

    it('should filter countries by population range', async () => {
      const where = buildCountryWhere({ 
        populationMin: 10000000, 
        populationMax: 100000000 
      });
      const countries = await prisma.country.findMany({ where });
      
      countries.forEach(country => {
        expect(country.population).toBeGreaterThanOrEqual(10000000);
        expect(country.population).toBeLessThanOrEqual(100000000);
      });
    });

    it('should filter animals by multiple criteria', async () => {
      const where = buildAnimalWhere({
        category: 'mammals',
        species: 'jubatus' // Use part of species name that exists
      });
      const animals = await prisma.animal.findMany({ where });
      
      animals.forEach(animal => {
        expect(animal.category).toBe('mammals');
        expect(animal.species?.toLowerCase()).toContain('jubatus');
      });
    });

    it('should handle search with OR conditions', async () => {
      const where = buildCountryWhere({}, 'United');
      const countries = await prisma.country.findMany({ where });
      
      // Should find countries with "United" in name, capital, currency, or continent
      countries.forEach(country => {
        const hasMatch = [
          country.name,
          country.capital,
          country.currency,
          country.continent
        ].some(field => field?.toLowerCase().includes('united'.toLowerCase()));
        
        expect(hasMatch).toBe(true);
      });
    });
  });

  // ===================
  // SORTING INTEGRATION TESTS
  // ===================
  
  describe('Sorting Integration', () => {
    it('should sort countries by population descending', async () => {
      const orderBy = buildOrderBy('population', 'DESC');
      const countries = await prisma.country.findMany({ 
        orderBy,
        take: 5
      });
      
      for (let i = 0; i < countries.length - 1; i++) {
        expect(countries[i].population || 0).toBeGreaterThanOrEqual(countries[i + 1].population || 0);
      }
    });

    it('should sort animals by name ascending with stable sorting', async () => {
      const orderBy = buildOrderBy('name', 'ASC');
      const animals = await prisma.animal.findMany({ 
        orderBy,
        take: 10
      });
      
      for (let i = 0; i < animals.length - 1; i++) {
        const comparison = animals[i].name.localeCompare(animals[i + 1].name);
        if (comparison === 0) {
          // If names are equal, should be sorted by ID (stable sort)
          expect(animals[i].id).toBeLessThan(animals[i + 1].id);
        } else {
          expect(comparison).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should handle field mapping correctly', async () => {
      // Seed at least one country with population
      await prisma.country.create({
        data: {
          name: 'SortTestCountry',
          continent: 'europe',
          population: 123456,
        }
      });
      const mappedField = mapCountryOrderField('POPULATION');
      expect(mappedField).toBe('population');
      
      const orderBy = buildOrderBy(mappedField, 'ASC');
      const countries = await prisma.country.findMany({ 
        orderBy,
        take: 3
      });
      
      expect(countries.length).toBeGreaterThan(0);
      for (let i = 0; i < countries.length - 1; i++) {
        expect(countries[i].population || 0).toBeLessThanOrEqual(countries[i + 1].population || 0);
      }
    });
  });

  // ===================
  // DATA CONSISTENCY TESTS
  // ===================
  
  describe('Data Consistency', () => {
    it('should maintain data integrity during pagination', async () => {
      // Get total count
      const totalCount = await prisma.country.count();
      
      // Paginate through all data
      let allItems: any[] = [];
      let cursor: string | null = null;
      let hasNext = true;
      
      while (hasNext) {
        const page = await paginate({
          model: prisma.country,
          where: {},
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          first: 2,
          ...(cursor && { after: cursor }),
        });
        
        allItems.push(...page.items);
        cursor = page.pagination.endCursor;
        hasNext = page.pagination.hasNext;
        
        // Safety check to prevent infinite loops
        if (allItems.length > totalCount + 10) {
          break;
        }
      }
      
      // Should have collected all unique items
      const ids = allItems.map(item => item.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(totalCount);
    });

    it('should handle concurrent pagination requests consistently', async () => {
      // Simulate multiple concurrent pagination requests
      const promises = [
        paginate({
          model: prisma.animal,
          where: {},
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          first: 3,
        }),
        paginate({
          model: prisma.animal,
          where: buildAnimalWhere({ category: 'birds' }),
          orderBy: [{ species: 'asc' }, { id: 'asc' }],
          first: 2,
        }),
        paginate({
          model: prisma.country,
          where: buildCountryWhere({ populationMin: 1000000 }),
          orderBy: [{ population: 'desc' }, { id: 'asc' }],
          first: 5,
        }),
      ];

      const results = await Promise.all(promises);
      
      // All requests should complete successfully
      results.forEach(result => {
        expect(result.items).toBeDefined();
        expect(result.pagination).toBeDefined();
        expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
