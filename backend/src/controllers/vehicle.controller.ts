// VehicleController: thin HTTP translation layer over VehicleService. Same
// philosophy as AuthController -- no business logic, just request parsing
// and response shaping.

import { Request, Response } from 'express';
import { VehicleService } from '@services/vehicle.service';
import { VehicleRepository } from '@repositories/vehicle.repository';
import { SearchVehicleInput, RestockInput } from '@validators/vehicle.validator';
import { BadRequestError } from '@utils/app-error';

// Composition root, same pattern as AuthController.
const vehicleService = new VehicleService(new VehicleRepository());

// Express 5 types req.params values as `string | string[]` generically, to
// account for repeating-segment patterns like `/:id+`. None of OUR routes
// use that syntax -- every `:id` here matches exactly one path segment --
// so at runtime this is always a plain string. Rather than silently
// casting (which would hide a real bug if a route pattern ever DID change
// to something that produces an array), we assert it explicitly and throw
// a clear error in the one case it wouldn't hold.
function requireIdParam(req: Request): string {
  const { id } = req.params;
  if (typeof id !== 'string') {
    throw new BadRequestError('Invalid route parameter: id');
  }
  return id;
}

export class VehicleController {
  async create(req: Request, res: Response): Promise<void> {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  }

  async list(_req: Request, res: Response): Promise<void> {
    const vehicles = await vehicleService.listVehicles();
    res.status(200).json(vehicles);
  }

  async search(req: Request, res: Response): Promise<void> {
    // req.validatedQuery was populated by validateQuery(searchVehicleSchema)
    // -- already coerced (strings -> numbers) and validated by the time we
    // get here, so no further parsing needed. See validate.middleware.ts
    // for why this ISN'T just req.query in Express 5.
    const filters = req.validatedQuery as SearchVehicleInput;
    const vehicles = await vehicleService.searchVehicles(filters);
    res.status(200).json(vehicles);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const vehicle = await vehicleService.getVehicleById(requireIdParam(req));
    res.status(200).json(vehicle);
  }

  async update(req: Request, res: Response): Promise<void> {
    const vehicle = await vehicleService.updateVehicle(requireIdParam(req), req.body);
    res.status(200).json(vehicle);
  }

  async delete(req: Request, res: Response): Promise<void> {
    await vehicleService.deleteVehicle(requireIdParam(req));
    // 204 No Content: the request succeeded and there's deliberately no
    // response body to return -- the resource is gone, there's nothing
    // left to describe.
    res.status(204).send();
  }

  async purchase(req: Request, res: Response): Promise<void> {
    const vehicle = await vehicleService.purchaseVehicle(requireIdParam(req));
    res.status(200).json(vehicle);
  }

  async restock(req: Request, res: Response): Promise<void> {
    const { amount } = req.body as RestockInput;
    const vehicle = await vehicleService.restockVehicle(requireIdParam(req), amount);
    res.status(200).json(vehicle);
  }
}
