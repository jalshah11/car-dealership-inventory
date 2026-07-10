// VehicleService: business logic for vehicle inventory. No Express, no
// Prisma -- only VehicleRepository and domain errors. Authorization (who is
// ALLOWED to call these methods) is deliberately NOT this file's job; that
// lives in route-level middleware (authenticate/authorize), keeping "can
// this data exist in this state" (service) separate from "is this caller
// permitted to ask for it" (routing/middleware).

import { VehicleRepository, VehicleSearchFilters } from '@repositories/vehicle.repository';
import { CreateVehicleInput, UpdateVehicleInput } from '@validators/vehicle.validator';
import { NotFoundError, OutOfStockError } from '@utils/app-error';
import { Vehicle } from '@prisma/client';

export class VehicleService {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    return this.vehicleRepository.create(input);
  }

  async listVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.findAll();
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
    return vehicle;
  }

  async updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    // We check existence FIRST, deliberately, rather than letting Prisma's
    // update() throw its own "record not found" error. This keeps 404
    // handling consistent and framework-agnostic across every method in
    // this service, rather than parsing Prisma-specific error codes.
    await this.getVehicleById(id);
    return this.vehicleRepository.update(id, input);
  }

  async deleteVehicle(id: string): Promise<void> {
    await this.getVehicleById(id);
    await this.vehicleRepository.delete(id);
  }

  async searchVehicles(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    return this.vehicleRepository.search(filters);
  }

  async purchaseVehicle(id: string): Promise<Vehicle> {
    // Attempt the atomic, race-condition-safe decrement first (see
    // VehicleRepository for why). It tells us whether it succeeded (1) or
    // not (0) -- but a count of 0 is ambiguous on its own: it could mean
    // "no vehicle with this id exists" OR "it exists but quantity is
    // already 0". We resolve that ambiguity with a follow-up lookup, ONLY
    // in the failure path (no extra query on the common, successful case).
    const updatedCount = await this.vehicleRepository.decrementQuantityIfAvailable(id);

    if (updatedCount === 0) {
      const vehicle = await this.vehicleRepository.findById(id);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
      throw new OutOfStockError('This vehicle is out of stock');
    }

    // Success path: fetch the fresh row so the response reflects the
    // post-decrement quantity (updateMany doesn't return the updated row
    // itself, only a count).
    return this.getVehicleById(id);
  }

  async restockVehicle(id: string, amount: number): Promise<Vehicle> {
    await this.getVehicleById(id);
    return this.vehicleRepository.incrementQuantity(id, amount);
  }
}
