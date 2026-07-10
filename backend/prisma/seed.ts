// Database seed script -- populates a fresh database with data you need to
// actually exercise every endpoint locally: an ADMIN account (nothing in
// the public API can create one, by design -- see auth.service.ts), a
// regular USER account, and a spread of vehicles across makes/categories/
// price points so the search endpoint has something interesting to filter.
//
// WHY A SEPARATE SCRIPT, NOT PART OF THE APP ITSELF?
// Seeding is a DEVELOPMENT-time concern -- it should never run against a
// production database (imagine accidentally wiping real inventory because a
// seed script ran on deploy). Keeping it as a standalone script you invoke
// deliberately (`npm run db:seed`) means it only ever runs when a human
// explicitly chooses to run it.
//
// This talks to Prisma DIRECTLY rather than going through our
// service/repository layers. That's a deliberate exception to our usual
// layering: this script IS the "trusted internal operator" our services
// protect against untrusted API callers -- e.g. it assigns role: ADMIN
// directly, something AuthService.register() will never do for a public
// request.

import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '@utils/password';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // --- Users --------------------------------------------------------
  // upsert (update-or-insert) makes this script safe to re-run: running it
  // twice won't create duplicate users or fail on a unique-constraint
  // violation, it'll just leave the existing rows as they were.
  const adminPassword = await hashPassword('AdminPass123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dealership.com' },
    update: {},
    create: {
      email: 'admin@dealership.com',
      password: adminPassword,
      name: 'Dealership Admin',
      role: Role.ADMIN,
    },
  });

  const customerPassword = await hashPassword('CustomerPass123!');
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Jane Customer',
      role: Role.USER,
    },
  });

  console.log(`  Users: admin=${admin.email}, customer=${customer.email}`);

  // --- Vehicles -------------------------------------------------------
  // Deliberately spread across makes, categories, and price points so
  // GET /api/vehicles/search has something meaningful to filter -- e.g.
  // "make=Toyota", "category=SUV", "minPrice=30000&maxPrice=50000" should
  // all return a DIFFERENT, non-empty subset of these.
  //
  // We wipe and reinsert vehicles on every run (rather than upserting)
  // because, unlike users, vehicles have no natural unique business key to
  // upsert against -- "another Toyota Camry" is a perfectly valid distinct
  // listing in real inventory. Deleting first keeps this script
  // deterministic and safe to re-run for a LOCAL DEV database, which is
  // the only place it should ever run.
  await prisma.vehicle.deleteMany({});

  const vehicles = [
    { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28500, quantity: 5 },
    { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 32000, quantity: 3 },
    { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 7 },
    { make: 'Honda', model: 'CR-V', category: 'SUV', price: 31500, quantity: 4 },
    { make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 2 },
    { make: 'Ford', model: 'Mustang', category: 'Coupe', price: 42000, quantity: 0 }, // out of stock, for testing
    { make: 'Tesla', model: 'Model 3', category: 'Sedan', price: 41000, quantity: 6 },
    { make: 'Chevrolet', model: 'Silverado', category: 'Truck', price: 47000, quantity: 3 },
  ];

  await prisma.vehicle.createMany({ data: vehicles });

  console.log(`  Vehicles: created ${vehicles.length} (including 1 intentionally out-of-stock)`);
  console.log('Seeding complete.');
  console.log('');
  console.log('Login credentials for manual testing:');
  console.log('  Admin:    admin@dealership.com    / AdminPass123!');
  console.log('  Customer: customer@example.com    / CustomerPass123!');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
