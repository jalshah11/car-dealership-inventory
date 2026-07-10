// DTO (Data Transfer Object) shaping for User.
//
// WHY THIS EXISTS:
// The `User` type from Prisma includes the bcrypt password HASH -- correct
// for what's stored in the database, but that field must never leave this
// backend, not even hashed (leaking a hash still gives an attacker
// something to brute-force offline). Every place that sends a user back to
// a client (register, login, "get current user" later) should funnel
// through this one function, so "don't leak the password" is enforced in
// exactly one place instead of remembered ad-hoc in every controller.

import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
