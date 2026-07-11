// Vehicle routes.
//
// AUTHORIZATION MODEL: matches the kata spec's "Vehicles (Protected)"
// section literally -- every route below requires a logged-in user
// (authenticate). Only DELETE and restock are additionally gated to
// ADMIN (authorize(Role.ADMIN)), exactly as the spec calls out
// "(Admin only)" for those two and only those two. Browsing, search,
// create, and update are open to any authenticated user.
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

// --- Browsing (any authenticated user) ---------------------------------
// GET /search BEFORE GET /:id -- see note above.
router.get(
  '/search',
  authenticate,
  validateQuery(searchVehicleSchema),
  asyncHandler(vehicleController.search.bind(vehicleController)),
);
router.get('/', authenticate, asyncHandler(vehicleController.list.bind(vehicleController)));
router.get('/:id', authenticate, asyncHandler(vehicleController.getById.bind(vehicleController)));

// --- Create/update (any authenticated user, per spec) -------------------
router.post(
  '/',
  authenticate,
  validateBody(createVehicleSchema),
  asyncHandler(vehicleController.create.bind(vehicleController)),
);
router.put(
  '/:id',
  authenticate,
  validateBody(updateVehicleSchema),
  asyncHandler(vehicleController.update.bind(vehicleController)),
);

// --- Delete: ADMIN only, per spec ---------------------------------------
router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  asyncHandler(vehicleController.delete.bind(vehicleController)),
);

// --- Inventory transactions ----------------------------------------
// Purchase: any authenticated user (you need an identity to buy something,
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
