// Zod schemas for vehicle-related request bodies and search query params.

import { z } from 'zod';

// Shared field-level rules, reused across create/update so the validation
// RULES (e.g. "price must be positive") live in exactly one place, even
// though create requires all fields and update makes them all optional.
const make = z.string().min(1, 'Make is required');
const model = z.string().min(1, 'Model is required');
const category = z.string().min(1, 'Category is required');
const price = z.number().positive('Price must be a positive number');
const quantity = z.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative');

export const createVehicleSchema = z.object({
  make,
  model,
  category,
  price,
  // Optional at creation -- a dealer might list a vehicle before it
  // physically arrives on the lot. Defaults to 0 (out of stock) rather
  // than silently assuming 1, which would be a guess we have no basis for.
  quantity: quantity.default(0),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// .partial() makes every field optional -- exactly what a PATCH-style
// update needs ("only send the fields you want to change"), while still
// running each PRESENT field through the same validation rules (a price of
// -1 is still rejected, it's just not REQUIRED to be present at all).
export const updateVehicleSchema = z
  .object({ make, model, category, price, quantity })
  .partial();

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

// Search runs off req.query, where EVERYTHING arrives as a string (or
// string[]) no matter what the client conceptually sent -- Express doesn't
// parse query strings into typed values. z.coerce.number() explicitly
// converts "20000" -> 20000, and fails validation if the string isn't
// numeric at all (e.g. "abc").
export const searchVehicleSchema = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export type SearchVehicleInput = z.infer<typeof searchVehicleSchema>;

export const restockSchema = z.object({
  amount: z.number().int('Amount must be a whole number').positive('Amount must be greater than 0'),
});

export type RestockInput = z.infer<typeof restockSchema>;
