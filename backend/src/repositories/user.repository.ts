// User repository -- the ONLY place in the app that talks to Prisma for
// User data. Services must go through here rather than importing `prisma`
// directly, so that (a) business logic stays testable via a mocked
// repository interface, and (b) if we ever swap ORMs, only this file
// changes.
//
// NOTE ON TESTING STRATEGY: unlike services (which have real business logic
// and are unit-tested with a mocked repository), this repository is
// intentionally a thin, nearly line-for-line wrapper around Prisma calls.
// Thin repositories like this are conventionally verified via INTEGRATION
// tests against a real (test) database rather than unit tests with mocks --
// mocking Prisma here would just be testing that we called a mock
// correctly, not that the query actually works. See
// tests/integration/README.md for how to run those against a real Postgres
// instance.

import { prisma } from '@config/prisma';
import { Prisma, User } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }
}
