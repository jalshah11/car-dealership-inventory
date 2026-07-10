// Runs once before the test framework is installed, for every test file.
//
// WHY: our src/config/env.ts throws if required env vars are missing. Tests
// run in their own process/environment and don't automatically load .env,
// so without this file, simply importing app.ts in a test would crash with
// "Missing required environment variable: DATABASE_URL" -- even for tests
// that never touch the database. Setting safe dummy values here keeps unit
// tests fast and isolated; integration tests that need a REAL database will
// override DATABASE_URL via a separate .env.test file later.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/car_dealership_test?schema=public';
