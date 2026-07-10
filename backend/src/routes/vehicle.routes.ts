// Vehicle routes.
//
// ORDERING MATTERS: Express matches routes top-to-bottom, first match
// wins. GET /search MUST be registered before GET /:id -- otherwise a
// request to /api/vehicles/search would match the /:id route FIRST, with
// Express treating the literal string "search" as if it were an :id value,
// and our search endpoint would never be reached. This is a classic,
// easy-to-miss Express bug; we have an integration test specifically
// guarding against regressing this ordering.

import { Router } from 'express';
import { Role } from '@prisma/client';
import { VehicleController } from '@controllers/vehicle.controller';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/error.middleware';
import {
  createVehicleSchema,
  updateVehicleSchema,
  searchVehicleSchema,
  restockSchema,
} from '@validators/vehicle.validator';

const router = Router();
const vehicleController = new VehicleController();

// --- Public browsing routes ------------------------------------------
// GET /search BEFORE GET /:id -- see note above.
router.get(
  '/search',
  validateQuery(searchVehicleSchema),
  asyncHandler(vehicleController.search.bind(vehicleController)),
);
router.get('/', asyncHandler(vehicleController.list.bind(vehicleController)));
router.get('/:id', asyncHandler(vehicleController.getById.bind(vehicleController)));

// --- Admin-only inventory management -----------------------------------
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(createVehicleSchema),
  asyncHandler(vehicleController.create.bind(vehicleController)),
);
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(updateVehicleSchema),
  asyncHandler(vehicleController.update.bind(vehicleController)),
);
router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  asyncHandler(vehicleController.delete.bind(vehicleController)),
);

// --- Inventory transactions ----------------------------------------
// Purchase: any AUTHENTICATED user (you need an identity to buy something,
// but admin rights aren't required -- that's the whole customer base).
router.post(
  '/:id/purchase',
  authenticate,
  asyncHandler(vehicleController.purchase.bind(vehicleController)),
);

// Restock: ADMIN only, per spec.
router.post(
  '/:id/restock',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(restockSchema),
  asyncHandler(vehicleController.restock.bind(vehicleController)),
);

export default router;
