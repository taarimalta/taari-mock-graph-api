# Copilot instructions — taari-mock-graph-api

## Stack & Quick Start
**TypeScript + Apollo Server + Express + Prisma + SQLite**
- Start dev: `npm run dev` (hot reload via `tsx`)
- Tests: `npm test` (Jest with `--runInBand`)
- DB setup: `npm run db:generate && npm run db:migrate`
- Reset data: `npm run db:seed` (destructive)

## Authentication & Security Model
**Critical:** All mutations require `x-user-id` header (GET and introspection exempt)
```bash
curl -H "x-user-id: 1" -H "Content-Type: application/json" \
  -d '{"query":"mutation { updateCountry(...) }"}' \
  http://localhost:4000/graphql
```
- **Frontend integration:** Headers populated from localStorage values for user switching
- **x-user-id:** Current logged-in user (single ID from localStorage)
- **x-view-domains:** Comma-separated domains currently selected for viewing (e.g. "1,2,5")
- **x-create-domain:** Single domain where new data gets assigned
- Middleware in `src/index.ts` validates header → injects `req.userId`
- Context (`src/context.ts`) normalizes headers, parses domain permissions

## Domain-Based Access Control
**Multi-tenant security** via hierarchical domains (see `src/utils/domainAccess.ts`):
- Users have explicit access to domains via `UserDomainAccess` table
- Access includes all descendant domains (recursive tree traversal)
- **Frontend workflow:** Admin→Domains shows accessible domains; user selects subset for viewing
- Queries filter by `effectiveDomains = await getEffectiveViewDomains(prisma, userId, requestedDomains)`
- Mutations validate via `await validateCreateDomain(prisma, userId, requestedDomain)`
- **Header mapping:** `x-view-domains` (selected) ⊆ accessible domains, `x-create-domain` ∈ accessible domains
- Test domain security in `tests/domain/domain-security.integration.test.ts`

## Pagination Architecture
**Custom cursor-based** (not Prisma's built-in cursors):
- Cursor = base64 JSON: `{ id, orderFields, orderValues, direction }`
- `src/utils/pagination.ts` builds WHERE conditions for compound sorting
- Always append `id` as tiebreaker in `buildOrderBy()` for stable pagination
- Pattern: `countriesPaginated(args: { first: 3, after: "cursor" })`

## Resolver Patterns
**Standard structure** in `src/resolvers/*.ts`:
1. Extract `userId` from context, validate required
2. Get domain permissions: `getEffectiveViewDomains(prisma, userId, requestedDomains)`
3. Build WHERE clause: `buildCountryWhere(filter, search)` + domain filter
4. Apply sorting: `buildOrderBy(mapCountryOrderField(orderBy.field), direction)`
5. Paginate: `await paginate({ model: prisma.country, where, orderBy, ... })`

## Anti-Patterns & Performance
- **Don't:** Create new `PrismaClient()` in resolvers → use `context.prisma`
- **Don't:** Direct DB queries in N+1 loops → use `context.loadUser(id)` / `context.loadDomain(id)`
- **Batch loading:** `src/utils/batchLoaders.ts` provides microtask-batched loaders
- **Cursor stability:** Preserve `{ id, orderFields, orderValues, direction }` shape

## Test Patterns
**Integration tests** dominant pattern:
- Global setup: `tests/global/setup.ts` seeds consistent test data
- Auth testing: Set `x-user-id` header, verify domain access restrictions
- Run isolated: `jest --runInBand` (SQLite doesn't handle concurrent well)
- Example: `tests/country/country-header-enforcement.test.ts`

## File Organization
- **Schema:** `src/schema/typeDefs.ts` (single large file)
- **Business logic:** `src/resolvers/{country,animal,user,domain}.ts`
- **Utilities:** `src/utils/{pagination,filtering,sorting,domainAccess,batchLoaders}.ts`
- **Context:** `src/context.ts` + middleware in `src/index.ts`
