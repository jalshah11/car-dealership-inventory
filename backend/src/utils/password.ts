// Password hashing utilities, wrapping bcrypt.
//
// WHY BCRYPT (not SHA-256/MD5/etc.)?
// General-purpose hash functions like SHA-256 are designed to be FAST --
// great for checksums, terrible for passwords, because it means an attacker
// with a stolen password-hash database can try billions of guesses per
// second (a "brute force" or "dictionary" attack). bcrypt is deliberately
// SLOW and configurable (via the "cost factor" / salt rounds below), and it
// automatically generates and embeds a random salt into every hash, so two
// users with the same password get completely different hashes.

import bcrypt from 'bcrypt';

// Cost factor: each +1 roughly DOUBLES the time to compute a hash. 10 is
// bcrypt's own recommended minimum for production in 2026 hardware terms;
// higher (12+) is more secure but slows down login/registration requests.
// This is a security/latency trade-off you should be able to explain.
const SALT_ROUNDS = 10;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function comparePassword(plainTextPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hash);
}
