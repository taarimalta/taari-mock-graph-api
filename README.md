# taari Mock GraphQL API

A developer-friendly mock GraphQL API for rapid prototyping and testing, built with TypeScript, Apollo Server, Prisma, and SQLite.

## 🚀 Stack
- **Node.js** (TypeScript)
- **Apollo Server** (GraphQL)
- **Prisma ORM**
- **SQLite** (local file DB)

## ⚡ Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup the database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
3. **Start the dev server:**
   ```bash
   npm run dev
   # or to restart: npm run dev:restart
   ```
   The API will be available at [http://localhost:4000/graphql](http://localhost:4000/graphql)


## 🧩 Pagination, Sorting, and Filtering

### Paginated Queries


#### Pagination Examples
#### How to Specify the Next Page (Cursor-Based Pagination)

To fetch the next page of results, use the `after` argument in your query. Set its value to the `endCursor` returned from the previous page's response. This is the recommended best practice for cursor-based pagination in GraphQL (see Apollo, Contentful, graphql.org).

**Step-by-step guide:**
1. Run your initial query with a `first` argument to specify the page size.
2. The response will include a `pagination` object with an `endCursor` and a `hasNext` boolean.
3. To fetch the next page, use the same query but set the `after` argument to the value of `endCursor` from the previous response.
4. Repeat until `hasNext` is false.

**Example:**
```graphql
query {
  countriesPaginated(args: { first: 3 }) {
    data { id name population }
    pagination { hasNext endCursor }
  }
}
```
Suppose the response includes `"endCursor": "YXJyYXljb25uZWN0aW9uOjQ="` and `"hasNext": true.

To get the next page:
```graphql
query {
  countriesPaginated(args: { first: 3, after: "YXJyYXljb25uZWN0aW9uOjQ=" }) {
    data { id name population }
    pagination { hasNext endCursor }
  }
}
```
Continue this process until `hasNext` is false.

**Best Practices:**
- Always use the `endCursor` from the previous response for the `after` argument.
- Do not assume cursors are sequential or guess their values; always use the provided cursor.
- For backward pagination, use the `before` argument with the `startCursor` from the next page.
- Cursors should be treated as opaque values.

For more details, see:
- [Apollo GraphQL Cursor Pagination](https://www.apollographql.com/docs/react/pagination/cursor-based)
- [GraphQL.org Pagination](https://graphql.org/learn/pagination/)
- [Contentful Cursor Pagination Tutorial](https://www.contentful.com/blog/graphql-pagination-cursor-offset-tutorials/)


**Fetch first page (forward pagination):**
```graphql
query {
  countriesPaginated(args: { first: 3 }) {
    data { id name population }
    pagination { hasNext hasPrevious startCursor endCursor totalCount }
  }
}
```
Sample response:
```json
{
  "data": {
    "countriesPaginated": {
      "data": [
        { "id": "6", "name": "Australia", "population": 25687041 },
        { "id": "5", "name": "Brazil", "population": 212559417 },
        { "id": "2", "name": "China", "population": 1402112000 }
      ],
      "pagination": {
        "hasNext": true,
        "hasPrevious": false,
        "startCursor": "<base64>",
        "endCursor": "<base64>",
        "totalCount": 6
      }
    }
  }
}
```


**Fetch next page using `after` cursor:**
```graphql
query {
  countriesPaginated(args: { first: 3, after: "<END_CURSOR_FROM_PREVIOUS_PAGE>" }) {
    data { id name population }
    pagination { hasNext hasPrevious startCursor endCursor totalCount }
  }
}
```
Sample response:
```json
{
  "data": {
    "countriesPaginated": {
      "data": [
        { "id": "3", "name": "France", "population": 67081000 },
        { "id": "4", "name": "United States", "population": 331893745 },
        { "id": "1", "name": "Nigeria", "population": 206139589 }
      ],
      "pagination": {
        "hasNext": false,
        "hasPrevious": true,
        "startCursor": "<base64>",
        "endCursor": "<base64>",
        "totalCount": 6
      }
    }
  }
}
```


**Fetch previous page using `before` cursor (backward pagination):**
```graphql
query {
  countriesPaginated(args: { last: 3, before: "<START_CURSOR_FROM_NEXT_PAGE>" }) {
    data { id name population }
    pagination { hasNext hasPrevious startCursor endCursor totalCount }
  }
}
```
Sample response:
```json
{
  "data": {
    "countriesPaginated": {
      "data": [
        { "id": "6", "name": "Australia", "population": 25687041 },
        { "id": "5", "name": "Brazil", "population": 212559417 },
        { "id": "2", "name": "China", "population": 1402112000 }
      ],
      "pagination": {
        "hasNext": true,
        "hasPrevious": false,
        "startCursor": "<base64>",
        "endCursor": "<base64>",
        "totalCount": 6
      }
    }
  }
}
```


**Filtering and sorting with pagination:**
```graphql
query {
  countriesPaginated(
    filter: { continent: europe, populationMin: 1000000 },
    orderBy: { field: POPULATION, direction: DESC },
    args: { first: 5 }
  ) {
    data { id name population continent }
    pagination { hasNext hasPrevious startCursor endCursor totalCount }
  }
}
```
Sample response:
```json
{
  "data": {
    "countriesPaginated": {
      "data": [
        { "id": "3", "name": "France", "population": 67081000, "continent": "europe" }
      ],
      "pagination": {
        "hasNext": false,
        "hasPrevious": false,
        "startCursor": "<base64>",
        "endCursor": "<base64>",
        "totalCount": 1
      }
    }
  }
}
```


**Animal pagination example:**
```graphql
query {
  animalsPaginated(args: { first: 2 }) {
    data { id name species }
    pagination { hasNext hasPrevious startCursor endCursor totalCount }
  }
}
```
Sample response:
```json
{
  "data": {
    "animalsPaginated": {
      "data": [
        { "id": "1", "name": "Cheetah", "species": "Acinonyx jubatus" },
        { "id": "2", "name": "Bald Eagle", "species": "Haliaeetus leucocephalus" }
      ],
      "pagination": {
        "hasNext": true,
        "hasPrevious": false,
        "startCursor": "<base64>",
        "endCursor": "<base64>",
        "totalCount": 6
      }
    }
  }
}
```

#### Cursor Format
- Cursors are base64-encoded JSON objects: `{ id, orderField, orderValue, direction }`
- Use `startCursor` and `endCursor` for pagination navigation

#### Filtering and Sorting
- Use `filter` input for advanced filtering
- Use `orderBy` input for sorting by supported fields

See `http/country-pagination-examples.graphql` and `http/animal-pagination-examples.graphql` for more examples.

### Entities
- **Country**: `id`, `name`, `capital`, `population`, `area`, `currency`, `continent`
- **Animal**: `id`, `name`, `species`, `habitat`, `diet`, `conservation_status`, `category`

### Enums
- `Continent`: `africa`, `asia`, `europe`, `northamerica`, `southamerica`, `oceania`
- `AnimalCategory`: `mammals`, `birds`, `reptiles`, `amphibians`, `fish`, `insects`

### Example Mutation
```graphql
mutation {
  createCountry(name: "Testland", capital: "Test City", population: 123456, area: 6543.21, currency: "TST", continent: asia) {
    id
    name
    continent
  }
}
```

## 🧪 Testing the API

Use the provided shell scripts in the `http/` folder to quickly test all CRUD operations:

```bash
cd http
./country.sh   # Test all Country endpoints
./animal.sh    # Test all Animal endpoints
```

These scripts use `curl` and require `jq` for pretty-printing JSON. They will create, query, update, and delete sample records.

## 🧑‍💻 Testing with a GraphQL Client

You can also test the API interactively using a GraphQL client:

- **Altair** ([Download](https://altair.sirmuel.design/))
- **Postman** ([Download](https://www.postman.com/downloads/))
- **GraphiQL** ([Web](https://graphiql-online.com/))

**How to use:**
1. Install your preferred client.
2. Set the endpoint to: `http://localhost:4000/graphql`
3. Paste and run queries/mutations, for example:

```graphql
query {
  countries {
    id
    name
    continent
    capital
    population
    area
    currency
  }
}

mutation {
  createAnimal(
    name: "Cheetah",
    species: "Acinonyx jubatus",
    habitat: "Grasslands",
    diet: "Carnivore",
    conservation_status: "Vulnerable",
    category: mammals
  ) {
    id
    name
    category
  }
}
```

This is a great way to explore the schema, test edge cases, and visualize responses.

## ♻️ Reseeding the Database

To reset and reseed the database with initial data, run:

```bash
npm run db:seed
```

This will **delete all existing countries and animals** and repopulate the database with the default seed data. Useful for a clean slate during development or demos.

## 🛠 Development Notes
- The database is a local SQLite file (`prisma/dev.db`).
- Prisma models use `String` for enums due to SQLite limitations; GraphQL API still exposes enums.
- All code is in `src/` and is hot-reloaded in dev mode.
- You can edit the GraphQL schema in `src/schema/typeDefs.ts` and resolvers in `src/resolvers/`.

## 📂 Project Structure
```
mock-graph-api/
├── prisma/           # Prisma schema & migrations
├── src/              # TypeScript source (schema, resolvers, context)
├── http/             # Example GraphQL queries & test scripts
├── package.json      # Scripts & dependencies
└── README.md         # This file
```

---

Happy hacking! If you need more sample queries or want to extend the schema, just edit the files and restart the dev server.
