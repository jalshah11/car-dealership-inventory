# Prisma Setup Notes

`schema.prisma` is fully written (User + Vehicle models, see comments in the
file for design rationale).

## One-time setup you must run yourself

`npx prisma generate` downloads a query-engine binary matching your OS from
`binaries.prisma.sh`. In this development sandbox that domain is not
reachable, so `PrismaClient` doesn't yet exist as a concrete class here —
`src/config/prisma.ts` will show a type error (`no exported member
'PrismaClient'`) until you run this yourself in an environment with normal
internet access:

```bash
npm run prisma:generate   # npx prisma generate
```

Once you have a real Postgres instance (local Docker container, or a hosted
one), also run:

```bash
npm run prisma:migrate    # npx prisma migrate dev --name init
```

This creates the actual `users` and `vehicles` tables from the schema and
generates a migration file we'll commit to Git (migration history is part of
what makes a project "interview-ready" — it shows how your schema evolved).

## Why `prisma` and `@prisma/client` are pinned to an exact version (6.19.3)

Prisma 7 shipped as a major, ESM-only rewrite that removes the old Rust
query engine and **requires an explicit driver adapter** to instantiate
`PrismaClient` at all -- `new PrismaClient()` alone no longer works for any
database. Adopting it properly means converting this project to ESM,
changing the TypeScript module system, installing `@prisma/adapter-pg`,
replacing the schema's datasource URL with a new `prisma.config.ts`, and
reworking Jest's ESM support -- a large, unrelated migration.

`package.json` originally used caret ranges (`^7.8.0`), so a plain
`npm install` silently pulled in v7 the moment it was published, breaking
everything that assumed v6's CommonJS, no-adapter API (which is what our
entire codebase -- and the dev-sandbox Prisma shim in this repo's
`node_modules/.prisma`, gitignored -- was built against).

We deliberately pin to an **exact** version (`"6.19.3"`, no `^`/`~`) rather
than a caret range, specifically so `npm install` can never again silently
jump to a new major version without it being a deliberate, tested choice.
If you want to adopt Prisma 7 later, that's a worthwhile project on its own
-- just budget time for the ESM/driver-adapter migration rather than
expecting `npm install` + `prisma generate` to keep working unchanged.
