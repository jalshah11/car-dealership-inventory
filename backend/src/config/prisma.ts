// Prisma Client singleton.
//
// WHY A SINGLETON:
// Each PrismaClient instance manages its own connection pool to Postgres.
// If we did `new PrismaClient()` inside every repository file, we'd open a
// separate connection pool per file -- quickly exhausting Postgres's max
// connections, especially in a serverless or hot-reload dev environment.
// By exporting one shared instance, every repository reuses the same pool.

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
