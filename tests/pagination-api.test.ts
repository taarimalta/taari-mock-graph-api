import { ApolloServer } from '@apollo/server';
import { createContext } from '../src/context';
import { typeDefs } from '../src/schema/typeDefs';
import { countryResolvers } from '../src/resolvers/country';
import { animalResolvers } from '../src/resolvers/animal';

const server: any = new ApolloServer({
  typeDefs,
  resolvers: [countryResolvers, animalResolvers],
});

const exec = async (op: any, ctx?: any) => {
  if (ctx?.req?.headers) {
    const contextValue = createContext(ctx.req.headers);
    const res = await server.executeOperation(op, { contextValue });
    const anyRes: any = res as any;
    if (anyRes?.body?.kind === 'single') return anyRes.body.singleResult;
    return anyRes as any;
  }
  const res = await server.executeOperation(op, ctx);
  const anyRes: any = res as any;
  if (anyRes?.body?.kind === 'single') return anyRes.body.singleResult;
  return anyRes as any;
};

describe('Country mutation header enforcement', () => {

describe('Animal mutation header enforcement', () => {
  it('should throw error if x-user-id header is missing for createAnimal', async () => {
    const res = await exec({
      query: `mutation { createAnimal(input: { name: "Testimal", category: mammals }) { id name } }`,
    });
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
  });
  describe('Animal query and delete header enforcement', () => {
    it('should throw error if x-user-id header is missing for animals query', async () => {
      const res = await exec({
        query: `query { animals { id name } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for animals query', async () => {
      const res = await exec(
        { query: `query { animals { id name } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for animalsPaginated query', async () => {
      const res = await exec({
        query: `query { animalsPaginated(args: { first: 1 }) { data { id name } } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for animalsPaginated query', async () => {
      const res = await exec(
        { query: `query { animalsPaginated(args: { first: 1 }) { data { id name } } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for animal query', async () => {
      const res = await exec({
        query: `query { animal(id: 1) { id name } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for animal query', async () => {
      const res = await exec(
        { query: `query { animal(id: 1) { id name } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is missing for deleteAnimal mutation', async () => {
      const res = await exec({
        query: `mutation { deleteAnimal(id: 1) { id name } }`,
      });
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
    it('should throw error if x-user-id header is not a valid number for deleteAnimal mutation', async () => {
      const res = await exec(
        { query: `mutation { deleteAnimal(id: 1) { id name } }` },
        { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
      );
      expect(res.errors).toBeDefined();
      expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
    });
  });

  it('should throw error if x-user-id header is not a valid number for createAnimal', async () => {
    const res = await exec(
      { query: `mutation { createAnimal(input: { name: "Testimal", category: mammals }) { id name } }` },
      { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
    );
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
  });

  it('should throw error if x-user-id header is missing for updateAnimal', async () => {
    const res = await exec({
      query: `mutation { updateAnimal(input: { id: 1, name: "Testimal" }) { id name } }`,
    });
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
  });

  it('should throw error if x-user-id header is not a valid number for updateAnimal', async () => {
    const res = await exec(
      { query: `mutation { updateAnimal(input: { id: 1, name: "Testimal" }) { id name } }` },
      { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
    );
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header is required and must be a valid user ID number/);
  });
});
  it('should throw error if x-user-id header is not a valid number for createCountry', async () => {
    const res = await exec(
      { query: `mutation { createCountry(input: { name: "Testland", continent: africa }) { id name } }` },
      { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
    );
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
  });

  it('should throw error if x-user-id header is missing for updateCountry', async () => {
    const res = await exec({
      query: `mutation { updateCountry(input: { id: 1, name: "Testland" }) { id name } }`,
    });
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
  });

  it('should throw error if x-user-id header is not a valid number for updateCountry', async () => {
    const res = await exec(
      { query: `mutation { updateCountry(input: { id: 1, name: "Testland" }) { id name } }` },
      { req: { headers: { 'x-user-id': 'notanumber' } }, res: {} } as any
    );
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0].message).toMatch(/x-user-id header must be a valid user ID number/);
  });
});

describe('Pagination API', () => {
  it('should paginate countries (first page)', async () => {
    const res = await exec(
      { query: `query { countriesPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const names = res.data?.countriesPaginated.data.map((c: any) => c.name);
    expect(names).toEqual(['Australia', 'Brazil']);
    expect(res.data?.countriesPaginated.pagination).toHaveProperty('hasNext');
    expect(res.data?.countriesPaginated.pagination).toHaveProperty('startCursor');
  });

  it('should paginate animals (first page)', async () => {
    const res = await exec(
      { query: `query { animalsPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const names = res.data?.animalsPaginated.data.map((a: any) => a.name);
    expect(names).toEqual(['Axolotl', 'Bald Eagle']);
    expect(res.data?.animalsPaginated.pagination).toHaveProperty('hasNext');
    expect(res.data?.animalsPaginated.pagination).toHaveProperty('startCursor');
  });

  it('should return empty array for empty result', async () => {
    const res = await exec(
      { query: `query { countriesPaginated(filter: { name: "ZZZZZZ" }, orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    expect(res.data?.countriesPaginated.data).toEqual([]);
  });

  it('should navigate forward using after cursor for countries', async () => {
    // Get first page and extract endCursor
    const firstRes = await exec(
      { query: `query { countriesPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { endCursor } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const afterCursor = firstRes.data?.countriesPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    // Get next page using after cursor
    const nextRes = await exec(
      { query: `query { countriesPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const names = nextRes.data?.countriesPaginated.data.map((c: any) => c.name);
    expect(names).toEqual(['China', 'France']);
    expect(nextRes.data?.countriesPaginated.pagination.hasPrevious).toBe(true);
  });

  it('should navigate backward using before cursor for countries', async () => {
    // Get first page and extract endCursor
    const firstRes = await exec(
      { query: `query { countriesPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { endCursor } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const afterCursor = firstRes.data?.countriesPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    // Get next page using after cursor
    const nextRes = await exec(
      { query: `query { countriesPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { endCursor } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const beforeCursor = nextRes.data?.countriesPaginated.pagination.endCursor;
    expect(beforeCursor).toBeTruthy();

    // Get previous page using before cursor (backward pagination)
    const prevRes = await exec(
      { query: `query { countriesPaginated(orderBy: { field: NAME, direction: ASC }, args: { last: 2, before: "${beforeCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const names = prevRes.data?.countriesPaginated.data.map((c: any) => c.name);
    expect(names).toEqual(['Test Country', 'Kenya']);
    expect(prevRes.data?.countriesPaginated.pagination.hasNext).toBe(true);
  });

  it('should navigate forward using after cursor for animals', async () => {
    const firstRes = await exec(
      { query: `query { animalsPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { endCursor } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const afterCursor = firstRes.data?.animalsPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    const nextRes = await exec(
      { query: `query { animalsPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const names = nextRes.data?.animalsPaginated.data.map((a: any) => a.name);
    expect(names).toEqual(['Clownfish', 'Elephant']);
    expect(nextRes.data?.animalsPaginated.pagination.hasPrevious).toBe(true);
  });

  it('should navigate backward using before cursor for animals', async () => {
    const firstRes = await exec(
      { query: `query { animalsPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2 }) { data { id name } pagination { endCursor } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const afterCursor = firstRes.data?.animalsPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    const nextRes = await exec(
      { query: `query { animalsPaginated(orderBy: { field: NAME, direction: ASC }, args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { endCursor } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const beforeCursor = nextRes.data?.animalsPaginated.pagination.endCursor;
    expect(beforeCursor).toBeTruthy();

    const prevRes = await exec(
      { query: `query { animalsPaginated(orderBy: { field: NAME, direction: ASC }, args: { last: 2, before: "${beforeCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }` },
      { req: { headers: { 'x-user-id': '1' } }, res: {} } as any
    );
    const names = prevRes.data?.animalsPaginated.data.map((a: any) => a.name);
    expect(names).toEqual(['Komodo Dragon']);
    expect(prevRes.data?.animalsPaginated.pagination.hasNext).toBe(true);
  });
});
