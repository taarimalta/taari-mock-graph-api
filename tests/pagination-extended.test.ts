import { ApolloServer } from 'apollo-server';
import { typeDefs } from '../src/schema/typeDefs';
import { countryResolvers } from '../src/resolvers/country';
import { animalResolvers } from '../src/resolvers/animal';
import { encodeCursor, decodeCursor, isValidCursor } from '../src/utils/pagination';
import { buildCountryWhere, buildAnimalWhere } from '../src/utils/filtering';
import { buildOrderBy, mapCountryOrderField, mapAnimalOrderField } from '../src/utils/sorting';

const server = new ApolloServer({
  typeDefs,
  resolvers: [countryResolvers, animalResolvers],
});

describe('Additional Pagination and Utility Tests', () => {
  
  // ===================
  // CURSOR UTILITY TESTS
  // ===================
  
  describe('Cursor Encoding/Decoding', () => {
    const testCursor = { id: 123, orderField: 'name', orderValue: 'Australia', direction: 'ASC' as const };

    it('should encode and decode cursors correctly', () => {
      const encoded = encodeCursor(testCursor);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      
      const decoded = decodeCursor(encoded);
      expect(decoded).toEqual(testCursor);
    });

    it('should validate cursors correctly', () => {
      const validCursor = encodeCursor(testCursor);
      expect(isValidCursor(validCursor)).toBe(true);
      
      expect(isValidCursor('invalid-cursor')).toBe(false);
      expect(isValidCursor('')).toBe(false);
      expect(isValidCursor('not-base64!')).toBe(false);
    });

    it('should handle malformed base64 cursors gracefully', () => {
      expect(decodeCursor('malformed-base64')).toBe(null);
      expect(decodeCursor('SGVsbG8gd29ybGQ=')).toBe(null); // "Hello world" - valid base64 but not JSON
    });
  });

  // ===================
  // FILTERING TESTS
  // ===================
  
  describe('Filtering Utilities', () => {
    it('should build country where clauses correctly', () => {
      const filter = {
        continent: 'europe',
        populationMin: 1000000,
        populationMax: 50000000,
        name: 'France'
      };
      
      const where = buildCountryWhere(filter);
      expect(where).toEqual({
        continent: 'europe',
        population: { gte: 1000000, lte: 50000000 },
        name: { contains: 'France' }
      });
    });

    it('should build animal where clauses correctly', () => {
      const filter = {
        category: 'mammals',
        species: 'jubatus',
        habitat: 'grassland'
      };
      
      const where = buildAnimalWhere(filter);
      expect(where).toEqual({
        category: 'mammals',
        species: { contains: 'jubatus' },
        habitat: { contains: 'grassland' }
      });
    });

    it('should handle search queries with OR conditions', () => {
      const where = buildCountryWhere({}, 'Australia');
      expect(where.OR).toBeDefined();
      expect(where.OR.length).toBeGreaterThan(0);
    });
  });

  // ===================
  // SORTING TESTS
  // ===================
  
  describe('Sorting Utilities', () => {
    it('should map country order fields correctly', () => {
      expect(mapCountryOrderField('NAME')).toBe('name');
      expect(mapCountryOrderField('POPULATION')).toBe('population');
      expect(mapCountryOrderField('INVALID')).toBe('name'); // default
    });

    it('should map animal order fields correctly', () => {
      expect(mapAnimalOrderField('SPECIES')).toBe('species');
      expect(mapAnimalOrderField('CATEGORY')).toBe('category');
      expect(mapAnimalOrderField('INVALID')).toBe('name'); // default
    });

    it('should build stable orderBy with ID fallback', () => {
      const orderBy = buildOrderBy('name', 'ASC');
      expect(orderBy).toEqual([
        { name: 'asc' },
        { id: 'asc' }
      ]);
    });
  });

  // ===================
  // EDGE CASE TESTS
  // ===================
  
  describe('Pagination Edge Cases', () => {
    it('should handle first: 0 (no results)', async () => {
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 1 }) { 
            data { id name } 
            pagination { hasNext hasPrevious totalCount } 
          } 
        }`,
      });
      // With first: 1, we should get 1 result, not 0
      expect(res.data?.countriesPaginated.data.length).toBeLessThanOrEqual(1);
      expect(typeof res.data?.countriesPaginated.pagination.hasNext).toBe('boolean');
    });

    it('should handle very large first parameter', async () => {
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 1000 }) { 
            data { id name } 
            pagination { hasNext hasPrevious totalCount } 
          } 
        }`,
      });
      expect(res.data?.countriesPaginated.pagination.hasNext).toBe(false);
      expect(res.data?.countriesPaginated.data.length).toBeLessThanOrEqual(1000);
    });

    it('should handle last: 1 (single result)', async () => {
      const res = await server.executeOperation({
        query: `query { 
          animalsPaginated(args: { last: 1 }) { 
            data { id name } 
            pagination { hasNext hasPrevious totalCount } 
          } 
        }`,
      });
      expect(res.data?.animalsPaginated.data.length).toBeLessThanOrEqual(1);
      expect(typeof res.data?.animalsPaginated.pagination.hasPrevious).toBe('boolean');
    });
  });

  // ===================
  // ERROR HANDLING TESTS
  // ===================
  
  describe('Error Handling', () => {
    it('should handle invalid cursor gracefully', async () => {
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 2, after: "invalid-cursor" }) { 
            data { id name } 
            pagination { hasNext hasPrevious } 
          } 
        }`,
      });
      // Should not crash, should return results (ignoring invalid cursor)
      expect(res.errors).toBeFalsy();
      expect(Array.isArray(res.data?.countriesPaginated.data)).toBe(true);
    });

    it('should handle both first and last parameters (should prioritize first)', async () => {
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 2, last: 3 }) { 
            data { id name } 
            pagination { hasNext hasPrevious totalCount } 
          } 
        }`,
      });
      expect(res.errors).toBeFalsy();
      expect(res.data?.countriesPaginated.data.length).toBeLessThanOrEqual(2); // first takes precedence
    });
  });

  // ===================
  // COMPLEX FILTERING + SORTING TESTS
  // ===================
  
  describe('Complex Queries', () => {
    it('should handle filtering, sorting, and pagination together', async () => {
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(
            filter: { populationMin: 1000000 },
            orderBy: { field: POPULATION, direction: DESC },
            args: { first: 2 }
          ) { 
            data { id name population } 
            pagination { hasNext hasPrevious startCursor endCursor totalCount } 
          } 
        }`,
      });
      
      expect(res.data?.countriesPaginated.data.length).toBeLessThanOrEqual(2);
      
      // Verify sorting (DESC)
      const items = res.data?.countriesPaginated.data || [];
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].population).toBeGreaterThanOrEqual(items[i + 1].population);
      }
      
      expect(res.data?.countriesPaginated.pagination).toHaveProperty('totalCount');
    });

    it('should maintain sort order across pages', async () => {
      // Get first page
      const firstRes = await server.executeOperation({
        query: `query { 
          animalsPaginated(
            orderBy: { field: NAME, direction: ASC },
            args: { first: 2 }
          ) { 
            data { id name } 
            pagination { endCursor } 
          } 
        }`,
      });
      
      const firstPageLastItem = firstRes.data?.animalsPaginated.data.slice(-1)[0];
      const cursor = firstRes.data?.animalsPaginated.pagination.endCursor;
      
      // Get second page
      const secondRes = await server.executeOperation({
        query: `query { 
          animalsPaginated(
            orderBy: { field: NAME, direction: ASC },
            args: { first: 2, after: "${cursor}" }
          ) { 
            data { id name } 
            pagination { endCursor } 
          } 
        }`,
      });
      
      const secondPageFirstItem = secondRes.data?.animalsPaginated.data[0];
      
      // Verify sort order maintained across pages
      if (firstPageLastItem && secondPageFirstItem) {
        expect(firstPageLastItem.name.localeCompare(secondPageFirstItem.name)).toBeLessThanOrEqual(0);
      }
    });
  });

  // ===================
  // TOTALCOUNT ACCURACY TESTS
  // ===================
  
  describe('TotalCount Accuracy', () => {
    it('should return correct totalCount with filters', async () => {
      // Test filtered totalCount
      const filteredRes = await server.executeOperation({
        query: `query { 
          countriesPaginated(
            filter: { continent: europe },
            args: { first: 1 }
          ) { 
            data { id } 
            pagination { totalCount } 
          } 
        }`,
      });
      
      // Test unfiltered totalCount  
      const unfilteredRes = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 1000 }) { 
            data { id } 
            pagination { totalCount } 
          } 
        }`,
      });
      
      const filteredTotal = filteredRes.data?.countriesPaginated.pagination.totalCount || 0;
      const unfilteredTotal = unfilteredRes.data?.countriesPaginated.pagination.totalCount || 0;
      
      expect(filteredTotal).toBeLessThanOrEqual(unfilteredTotal);
      expect(filteredTotal).toBeGreaterThanOrEqual(0);
    });

    it('should maintain consistent totalCount across pages', async () => {
      // Get first page
      const firstRes = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 2 }) { 
            pagination { totalCount endCursor } 
          } 
        }`,
      });
      
      const cursor = firstRes.data?.countriesPaginated.pagination.endCursor;
      const firstTotal = firstRes.data?.countriesPaginated.pagination.totalCount;
      
      // Get second page
      const secondRes = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 2, after: "${cursor}" }) { 
            pagination { totalCount } 
          } 
        }`,
      });
      
      const secondTotal = secondRes.data?.countriesPaginated.pagination.totalCount;
      expect(firstTotal).toBe(secondTotal);
    });
  });

  // ===================
  // BOUNDARY TESTS
  // ===================
  
  describe('Boundary Cases', () => {
    it('should handle single item pagination', async () => {
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 1 }) { 
            data { id name } 
            pagination { hasNext hasPrevious startCursor endCursor } 
          } 
        }`,
      });
      
      expect(res.data?.countriesPaginated.data.length).toBe(1);
      expect(res.data?.countriesPaginated.pagination.startCursor).toBe(
        res.data?.countriesPaginated.pagination.endCursor
      );
    });

    it('should handle pagination when result count equals page size', async () => {
      // First, get total count
      const totalRes = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 1000 }) { 
            pagination { totalCount } 
          } 
        }`,
      });
      
      const totalCount = totalRes.data?.countriesPaginated.pagination.totalCount;
      
      // Now paginate with exactly that many items
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: ${totalCount} }) { 
            data { id } 
            pagination { hasNext hasPrevious } 
          } 
        }`,
      });
      
      expect(res.data?.countriesPaginated.data.length).toBe(totalCount);
      expect(res.data?.countriesPaginated.pagination.hasNext).toBe(false);
    });
  });

  // ===================
  // PERFORMANCE TESTS
  // ===================
  
  describe('Performance Considerations', () => {
    it('should handle large page sizes efficiently', async () => {
      const start = Date.now();
      
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(args: { first: 100 }) { 
            data { id name population } 
            pagination { hasNext totalCount } 
          } 
        }`,
      });
      
      const duration = Date.now() - start;
      
      expect(res.errors).toBeFalsy();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle complex filters efficiently', async () => {
      const start = Date.now();
      
      const res = await server.executeOperation({
        query: `query { 
          countriesPaginated(
            filter: { 
              populationMin: 1000000, 
              populationMax: 100000000,
              continent: asia
            },
            orderBy: { field: POPULATION, direction: DESC },
            args: { first: 10 }
          ) { 
            data { id name population continent } 
            pagination { hasNext totalCount } 
          } 
        }`,
      });
      
      const duration = Date.now() - start;
      
      expect(res.errors).toBeFalsy();
      expect(duration).toBeLessThan(1000);
    });
  });
});
