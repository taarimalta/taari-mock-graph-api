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

## 🧩 API Overview

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
