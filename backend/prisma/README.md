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
