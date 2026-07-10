// Vehicle repository -- the only place that talks to Prisma for vehicle
// data. Same rationale as UserRepository: thin, mostly line-for-line
// wrappers, verified via integration tests against a real database rather
// than unit tests with a mocked PrismaClient.

import { prisma } from '@config/prisma';
import { Prisma, Vehicle } from '@prisma/client';

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class VehicleRepository {
  async findAll(): Promise<Vehicle[]> {
    return prisma.vehicle.findMany();
  }

  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({ where: { id } });
  }

  async create(data: Prisma.VehicleCreateInput): Promise<Vehicle> {
    return prisma.vehicle.create({ data });
  }

  async update(id: string, data: Prisma.VehicleUpdateInput): Promise<Vehicle> {
    return prisma.vehicle.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Vehicle> {
    return prisma.vehicle.delete({ where: { id } });
  }

  async search(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    // Build the WHERE clause incrementally, only including a condition for
    // each filter the caller actually provided. This is what lets the
    // endpoint support "any combination" of filters simultaneously without
    // a combinatorial explosion of hand-written query variants.
    const where: Prisma.VehicleWhereInput = {};

    if (filters.make) {
      where.make = { contains: filters.make, mode: 'insensitive' };
    }
    if (filters.model) {
      where.model = { contains: filters.model, mode: 'insensitive' };
    }
    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      };
    }

    return prisma.vehicle.findMany({ where });
  }

  // ATOMIC decrement, guarded by quantity > 0 in the WHERE clause itself.
  //
  // WHY updateMany INSTEAD OF findUnique-then-update?
  // A naive approach -- read the vehicle, check `quantity > 0` in
  // application code, then update -- has a race condition: two concurrent
  // purchase requests can both read quantity=1, both see "> 0, OK to
  // proceed", and both decrement, landing at quantity=-1. By putting the
  // `quantity > 0` condition INSIDE the same atomic database operation as
  // the decrement, Postgres guarantees only one of two simultaneous
  // requests can succeed against the last unit of stock -- the second
  // request's WHERE clause simply won't match anymore (count: 0), because
  // it re-evaluates quantity at the moment it runs, not at the moment we
  // read it in application code.
  //
  // Returns the count of rows updated (0 or 1). The SERVICE layer decides
  // what a count of 0 means (not found vs. out of stock) by doing a
  // separate findById if needed -- the repository just reports what the
  // database did.
  async decrementQuantityIfAvailable(id: string): Promise<number> {
    const result = await prisma.vehicle.updateMany({
      where: { id, quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });
    return result.count;
  }

  async incrementQuantity(id: string, amount: number): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: { quantity: { increment: amount } },
    });
  }
}
