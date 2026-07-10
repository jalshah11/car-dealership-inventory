# Testing Strategy

This project follows a standard **testing pyramid**:

## `tests/unit/`
Fast, isolated tests with no I/O.
- **Utils** (`password.ts`, `jwt.ts`): tested directly, no mocking needed.
- **Validators** (Zod schemas): tested directly against sample payloads.
- **Services** (e.g. `AuthService`): the actual business logic. Tested with
  the **repository mocked** (`jest.mock('@repositories/user.repository')`),
  so these tests run in milliseconds and never touch a database. This is
  where most of our test *count* should live, because this is where the
  business rules are.

## `tests/integration/`
Exercise the real Express `app` via Supertest -- real routing, real
validation middleware, real controller, real service logic. Two flavors:

1. **Repository mocked** (what we have now, e.g. `auth.test.ts`): verifies
   the full HTTP pipeline (status codes, JSON shape, validation error
   format) without needing a live database. This is what runs in this
   sandbox and in fast CI jobs.
2. **Real database** (not yet set up here): the same style of test, but
   against an actual disposable Postgres instance (e.g. via Docker or a
   test schema), verifying the repository layer's Prisma queries really
   work. Repositories are intentionally thin wrappers around Prisma, so
   they're better verified this way than with mocks -- mocking Prisma would
   only prove we called a mock correctly, not that the query is valid.

## What we deliberately do NOT do
We don't unit-test repositories with a mocked `PrismaClient`. A thin
pass-through method like `findByEmail(email) { return prisma.user.findUnique(...) }`
gains almost nothing from a mock-based test -- the interesting behavior
(does this query actually return the right row) can only be verified
against a real database.

## Running tests
```bash
npm test              # all tests, single run
npm run test:watch    # watch mode, re-runs on file change (use this while doing TDD)
npm run test:coverage # generates a coverage report in coverage/
```
