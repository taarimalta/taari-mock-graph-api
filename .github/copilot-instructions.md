Purpose
-------
This file provides targeted, repository-specific guidance for AI coding agents working on the taari-mock-graph-api project. Focus on immediately actionable facts: architecture, key files, conventions, developer workflows, and concrete examples.
# Copilot instructions — taari-mock-graph-api (concise)

Quick facts
-----------
- TypeScript (Node >=22), Apollo Server + Express (`src/index.ts`), Prisma + SQLite (`prisma/dev.db`).
- Dev: `npm run dev` (hot reload via `tsx`). Tests: `npm test` (Jest).

Architecture (short)
--------------------
- HTTP -> Express middleware -> Apollo Server. Middleware validates `x-user-id` for most POSTs and builds Context (`src/context.ts`).
- Resolvers in `src/resolvers/*` call `context.prisma` and helpers in `src/utils/`.

Key conventions & gotchas
-----------------------
- Auth header: `x-user-id` required for mutations (GET and introspection allowed without it). See middleware in `src/index.ts`.
- Pagination: cursors are base64-encoded JSON ({ id, orderFields, orderValues, direction }) and are handled in `src/utils/pagination.ts` via WHERE conditions (not Prisma's cursor). Preserve cursor shape when changing pagination.
- Ordering: `buildOrderBy()` (in `src/utils/sorting.ts`) always appends `id` as tiebreaker — keep this for stable sort.
- Batching: `src/utils/batchLoaders.ts` provides microtask-batched loaders; prefer `context.loadUser(id)` / `context.loadDomain(id)` to avoid N+1.
- Prefer `context.prisma` over creating new PrismaClient instances inside resolvers.

Concrete examples
-----------------
- Required header: `x-user-id: 1`
- Paginated query:
  query { countriesPaginated(args:{ first:3 }) { data { id name } pagination { endCursor hasNext } } }
- Cursor decoded payload: { id, orderFields, orderValues, direction } (base64 JSON)

Where to edit
-------------
- Schema: `src/schema/typeDefs.ts`
- Business logic: `src/resolvers/*`
- Helpers: `src/utils/{pagination,filtering,sorting,batchLoaders}.ts`
- Context & header parsing: `src/context.ts`, middleware in `src/index.ts`

Common tasks / commands
----------------------
- Install: `npm install`
- Prisma generate: `npm run db:generate`
- Migrate: `npm run db:migrate`
- Reseed (destructive): `npm run db:seed`
- Dev server: `npm run dev`
- Tests: `npm test`

If you want a longer version with file examples and test-run checklists, say which area to expand.
- Paginated query example (GraphQL):
