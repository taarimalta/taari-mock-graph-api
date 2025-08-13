import { ApolloServer } from 'apollo-server';
import { typeDefs } from '../src/schema/typeDefs';
import { countryResolvers } from '../src/resolvers/country';
import { animalResolvers } from '../src/resolvers/animal';

const server = new ApolloServer({
  typeDefs,
  resolvers: [countryResolvers, animalResolvers],
});

describe('Pagination API', () => {
  it('should paginate countries (first page)', async () => {
    const res = await server.executeOperation({
      query: `query { countriesPaginated(args: { first: 2 }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(res.data?.countriesPaginated.data.length).toBeLessThanOrEqual(2);
    expect(res.data?.countriesPaginated.pagination).toHaveProperty('hasNext');
    expect(res.data?.countriesPaginated.pagination).toHaveProperty('startCursor');
    expect(res.data?.countriesPaginated).toMatchSnapshot();
  });

  it('should paginate animals (first page)', async () => {
    const res = await server.executeOperation({
      query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(res.data?.animalsPaginated.data.length).toBeLessThanOrEqual(2);
    expect(res.data?.animalsPaginated.pagination).toHaveProperty('hasNext');
    expect(res.data?.animalsPaginated.pagination).toHaveProperty('startCursor');
    expect(res.data?.animalsPaginated).toMatchSnapshot();
  });

  it('should return empty array for empty result', async () => {
    const res = await server.executeOperation({
      query: `query { countriesPaginated(filter: { name: "ZZZZZZ" }, args: { first: 2 }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(res.data?.countriesPaginated.data).toEqual([]);
    expect(res.data?.countriesPaginated).toMatchSnapshot();
  });

  it('should navigate forward using after cursor for countries', async () => {
    // Get first page and extract endCursor
    const firstRes = await server.executeOperation({
      query: `query { countriesPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`,
    });
    const afterCursor = firstRes.data?.countriesPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    // Get next page using after cursor
    const nextRes = await server.executeOperation({
      query: `query { countriesPaginated(args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(nextRes.data?.countriesPaginated.data.length).toBeLessThanOrEqual(2);
    expect(nextRes.data?.countriesPaginated.pagination.hasPrevious).toBe(true);
    expect(nextRes.data?.countriesPaginated).toMatchSnapshot();
  });

  it('should navigate backward using before cursor for countries', async () => {
    // Get first page and extract endCursor
    const firstRes = await server.executeOperation({
      query: `query { countriesPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`,
    });
    const afterCursor = firstRes.data?.countriesPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    // Get next page using after cursor
    const nextRes = await server.executeOperation({
      query: `query { countriesPaginated(args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { endCursor } } }`,
    });
    const beforeCursor = nextRes.data?.countriesPaginated.pagination.endCursor;
    expect(beforeCursor).toBeTruthy();

    // Get previous page using before cursor (backward pagination)
    const prevRes = await server.executeOperation({
      query: `query { countriesPaginated(args: { last: 2, before: "${beforeCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(prevRes.data?.countriesPaginated.data.length).toBeLessThanOrEqual(2);
    expect(prevRes.data?.countriesPaginated.pagination.hasNext).toBe(true);
    expect(prevRes.data?.countriesPaginated).toMatchSnapshot();
  });

  it('should navigate forward using after cursor for animals', async () => {
    const firstRes = await server.executeOperation({
      query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`,
    });
    const afterCursor = firstRes.data?.animalsPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    const nextRes = await server.executeOperation({
      query: `query { animalsPaginated(args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(nextRes.data?.animalsPaginated.data.length).toBeLessThanOrEqual(2);
    expect(nextRes.data?.animalsPaginated.pagination.hasPrevious).toBe(true);
    expect(nextRes.data?.animalsPaginated).toMatchSnapshot();
  });

  it('should navigate backward using before cursor for animals', async () => {
    const firstRes = await server.executeOperation({
      query: `query { animalsPaginated(args: { first: 2 }) { data { id name } pagination { endCursor } } }`,
    });
    const afterCursor = firstRes.data?.animalsPaginated.pagination.endCursor;
    expect(afterCursor).toBeTruthy();

    const nextRes = await server.executeOperation({
      query: `query { animalsPaginated(args: { first: 2, after: "${afterCursor}" }) { data { id name } pagination { endCursor } } }`,
    });
    const beforeCursor = nextRes.data?.animalsPaginated.pagination.endCursor;
    expect(beforeCursor).toBeTruthy();

    const prevRes = await server.executeOperation({
      query: `query { animalsPaginated(args: { last: 2, before: "${beforeCursor}" }) { data { id name } pagination { hasNext hasPrevious startCursor endCursor totalCount } } }`,
    });
    expect(prevRes.data?.animalsPaginated.data.length).toBeLessThanOrEqual(2);
    expect(prevRes.data?.animalsPaginated.pagination.hasNext).toBe(true);
    expect(prevRes.data?.animalsPaginated).toMatchSnapshot();
  });
});
