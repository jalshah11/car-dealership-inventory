// Route-level integration tests for vehicles: real Express app, real
// routing, real validation middleware, real authenticate/authorize
// middleware, real VehicleService logic. Only VehicleRepository (the
// actual Postgres call) is mocked -- same layering philosophy as
// tests/integration/auth.test.ts. See tests/README.md.
//
// AUTHORIZATION MODEL (matches the kata spec's "Vehicles (Protected)"
// section literally): every vehicle endpoint requires a logged-in user.
// Only DELETE and restock are additionally restricted to ADMIN -- create,
// update, browsing, and search are open to any authenticated user, not
// just admins. This was a deliberate correction from an earlier version of
// this file, which had (incorrectly, relative to the written spec) made
// browsing/search public and create/update admin-only.
//
// We use REAL, validly-signed JWTs (via signToken) rather than mocking
// authenticate/authorize -- that lets these tests prove the actual RBAC
// wiring works, not just that a mock was configured to allow it.

import request from 'supertest';
import { createApp } from '../../src/app';
import { VehicleRepository } from '@repositories/vehicle.repository';
import { signToken } from '@utils/jwt';
import { Role } from '@prisma/client';

jest.mock('@repositories/vehicle.repository');

const MockedVehicleRepository = VehicleRepository as jest.MockedClass<typeof VehicleRepository>;

function sampleVehicle(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 28500,
    quantity: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const adminToken = `Bearer ${signToken({ userId: 'admin-1', role: Role.ADMIN })}`;
const userToken = `Bearer ${signToken({ userId: 'user-1', role: Role.USER })}`;

describe('Vehicle routes', () => {
  const app = createApp();

  beforeEach(() => {
    MockedVehicleRepository.mockClear();
  });

  describe('POST /api/vehicles', () => {
    const payload = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 5 };

    it('creates a vehicle when called by an admin', async () => {
      MockedVehicleRepository.prototype.create.mockResolvedValue(sampleVehicle(payload) as never);

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', adminToken)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.make).toBe('Honda');
    });

    it('creates a vehicle when called by a regular (non-admin) user -- spec only restricts delete/restock to admin', async () => {
      MockedVehicleRepository.prototype.create.mockResolvedValue(sampleVehicle(payload) as never);

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', userToken)
        .send(payload);

      expect(response.status).toBe(201);
    });

    it('returns 401 with no token at all', async () => {
      const response = await request(app).post('/api/vehicles').send(payload);
      expect(response.status).toBe(401);
    });

    it('returns 400 for an invalid payload (missing make)', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', adminToken)
        .send({ model: 'Civic', category: 'Sedan', price: 24000 });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty('make');
    });
  });

  describe('GET /api/vehicles', () => {
    it('returns 200 and a list for an authenticated user', async () => {
      MockedVehicleRepository.prototype.findAll.mockResolvedValue([sampleVehicle()] as never);

      const response = await request(app).get('/api/vehicles').set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('returns 401 with no token', async () => {
      const response = await request(app).get('/api/vehicles');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vehicles/search', () => {
    it('is reachable and distinct from GET /:id (routing order regression guard)', async () => {
      MockedVehicleRepository.prototype.search.mockResolvedValue([sampleVehicle()] as never);

      const response = await request(app)
        .get('/api/vehicles/search?make=Toyota')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      // If /:id had swallowed this request, findById (not search) would
      // have been called, and with id="search" -- this assertion
      // specifically proves search() was invoked, not findById().
      expect(MockedVehicleRepository.prototype.search).toHaveBeenCalledWith({ make: 'Toyota' });
      expect(MockedVehicleRepository.prototype.findById).not.toHaveBeenCalled();
    });

    it('coerces and applies minPrice/maxPrice from query strings', async () => {
      MockedVehicleRepository.prototype.search.mockResolvedValue([] as never);

      await request(app)
        .get('/api/vehicles/search?minPrice=10000&maxPrice=50000')
        .set('Authorization', userToken);

      expect(MockedVehicleRepository.prototype.search).toHaveBeenCalledWith({
        minPrice: 10000,
        maxPrice: 50000,
      });
    });

    it('returns 400 for a non-numeric minPrice', async () => {
      const response = await request(app)
        .get('/api/vehicles/search?minPrice=abc')
        .set('Authorization', userToken);
      expect(response.status).toBe(400);
    });

    it('returns 401 with no token', async () => {
      const response = await request(app).get('/api/vehicles/search');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('returns 200 and the vehicle when found, for an authenticated user', async () => {
      MockedVehicleRepository.prototype.findById.mockResolvedValue(sampleVehicle() as never);

      const response = await request(app)
        .get('/api/vehicles/vehicle-1')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('vehicle-1');
    });

    it('returns 404 when not found', async () => {
      MockedVehicleRepository.prototype.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/vehicles/missing-id')
        .set('Authorization', userToken);

      expect(response.status).toBe(404);
    });

    it('returns 401 with no token', async () => {
      const response = await request(app).get('/api/vehicles/vehicle-1');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('updates the vehicle when called by an admin', async () => {
      MockedVehicleRepository.prototype.findById.mockResolvedValue(sampleVehicle() as never);
      MockedVehicleRepository.prototype.update.mockResolvedValue(
        sampleVehicle({ price: 30000 }) as never,
      );

      const response = await request(app)
        .put('/api/vehicles/vehicle-1')
        .set('Authorization', adminToken)
        .send({ price: 30000 });

      expect(response.status).toBe(200);
      expect(response.body.price).toBe(30000);
    });

    it('updates the vehicle when called by a regular (non-admin) user', async () => {
      MockedVehicleRepository.prototype.findById.mockResolvedValue(sampleVehicle() as never);
      MockedVehicleRepository.prototype.update.mockResolvedValue(
        sampleVehicle({ price: 30000 }) as never,
      );

      const response = await request(app)
        .put('/api/vehicles/vehicle-1')
        .set('Authorization', userToken)
        .send({ price: 30000 });

      expect(response.status).toBe(200);
    });

    it('returns 401 with no token', async () => {
      const response = await request(app).put('/api/vehicles/vehicle-1').send({ price: 30000 });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('returns 204 when called by an admin', async () => {
      MockedVehicleRepository.prototype.findById.mockResolvedValue(sampleVehicle() as never);
      MockedVehicleRepository.prototype.delete.mockResolvedValue(sampleVehicle() as never);

      const response = await request(app)
        .delete('/api/vehicles/vehicle-1')
        .set('Authorization', adminToken);

      expect(response.status).toBe(204);
    });

    it('returns 403 for a non-admin user -- spec explicitly says Admin only', async () => {
      const response = await request(app)
        .delete('/api/vehicles/vehicle-1')
        .set('Authorization', userToken);

      expect(response.status).toBe(403);
    });

    it('returns 401 with no token', async () => {
      const response = await request(app).delete('/api/vehicles/vehicle-1');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/vehicles/:id/purchase', () => {
    it('returns 200 and decremented quantity for a logged-in user', async () => {
      MockedVehicleRepository.prototype.decrementQuantityIfAvailable.mockResolvedValue(1);
      MockedVehicleRepository.prototype.findById.mockResolvedValue(
        sampleVehicle({ quantity: 2 }) as never,
      );

      const response = await request(app)
        .post('/api/vehicles/vehicle-1/purchase')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(2);
    });

    it('returns 401 with no token', async () => {
      const response = await request(app).post('/api/vehicles/vehicle-1/purchase');
      expect(response.status).toBe(401);
    });

    it('returns 409 when the vehicle is out of stock', async () => {
      MockedVehicleRepository.prototype.decrementQuantityIfAvailable.mockResolvedValue(0);
      MockedVehicleRepository.prototype.findById.mockResolvedValue(
        sampleVehicle({ quantity: 0 }) as never,
      );

      const response = await request(app)
        .post('/api/vehicles/vehicle-1/purchase')
        .set('Authorization', userToken);

      expect(response.status).toBe(409);
    });

    it('regular (non-admin) users are allowed to purchase', async () => {
      MockedVehicleRepository.prototype.decrementQuantityIfAvailable.mockResolvedValue(1);
      MockedVehicleRepository.prototype.findById.mockResolvedValue(
        sampleVehicle({ quantity: 1 }) as never,
      );

      const response = await request(app)
        .post('/api/vehicles/vehicle-1/purchase')
        .set('Authorization', userToken);

      expect(response.status).not.toBe(403);
    });
  });

  describe('POST /api/vehicles/:id/restock', () => {
    it('returns 200 and increased quantity for an admin', async () => {
      MockedVehicleRepository.prototype.findById.mockResolvedValue(
        sampleVehicle({ quantity: 3 }) as never,
      );
      MockedVehicleRepository.prototype.incrementQuantity.mockResolvedValue(
        sampleVehicle({ quantity: 13 }) as never,
      );

      const response = await request(app)
        .post('/api/vehicles/vehicle-1/restock')
        .set('Authorization', adminToken)
        .send({ amount: 10 });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(13);
    });

    it('returns 403 for a non-admin user -- spec explicitly says Admin only', async () => {
      const response = await request(app)
        .post('/api/vehicles/vehicle-1/restock')
        .set('Authorization', userToken)
        .send({ amount: 10 });

      expect(response.status).toBe(403);
    });

    it('returns 400 for a non-positive amount', async () => {
      const response = await request(app)
        .post('/api/vehicles/vehicle-1/restock')
        .set('Authorization', adminToken)
        .send({ amount: -5 });

      expect(response.status).toBe(400);
    });
  });
});
