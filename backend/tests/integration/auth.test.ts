// Route-level integration test: we hit the REAL Express app via Supertest,
// so validation middleware, the controller, and AuthService's actual logic
// all run for real. Only the REPOSITORY (the actual Postgres call) is
// mocked, since this sandbox has no live database.
//
// This is a deliberate, honest layer distinction:
//   - tests/unit/services/auth.service.test.ts verifies business logic
//     with the repository mocked (fast, no HTTP).
//   - THIS file verifies the HTTP plumbing around that logic actually
//     wires up correctly (status codes, validation errors, JSON shape).
//   - True end-to-end tests against a REAL Postgres instance are a further
//     layer you should run in CI/locally -- see tests/integration/README.md.

import request from 'supertest';
import { createApp } from '../../src/app';
import { UserRepository } from '@repositories/user.repository';
import { Role } from '@prisma/client';

jest.mock('@repositories/user.repository');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('Auth routes', () => {
  const app = createApp();

  beforeEach(() => {
    MockedUserRepository.mockClear();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 and a token for a valid new registration', async () => {
      MockedUserRepository.prototype.findByEmail.mockResolvedValue(null);
      MockedUserRepository.prototype.create.mockImplementation(async (data) => ({
        id: 'new-id',
        email: data.email,
        password: data.password,
        name: data.name,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const response = await request(app).post('/api/auth/register').send({
        email: 'jane@example.com',
        password: 'SecurePass123!',
        name: 'Jane Doe',
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('jane@example.com');
      expect(response.body.user).not.toHaveProperty('password');
      expect(typeof response.body.token).toBe('string');
    });

    it('returns 400 with field-level details for an invalid payload', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.details).toHaveProperty('email');
      expect(response.body.details).toHaveProperty('password');
      expect(response.body.details).toHaveProperty('name');
    });

    it('returns 409 when the email is already registered', async () => {
      MockedUserRepository.prototype.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: 'jane@example.com',
        password: 'hash',
        name: 'Jane Doe',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).post('/api/auth/register').send({
        email: 'jane@example.com',
        password: 'SecurePass123!',
        name: 'Jane Doe',
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/already exists/i);
    });

    it('ignores an attacker-supplied role field and never grants ADMIN', async () => {
      MockedUserRepository.prototype.findByEmail.mockResolvedValue(null);
      MockedUserRepository.prototype.create.mockImplementation(async (data) => ({
        id: 'new-id',
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role ?? Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await request(app).post('/api/auth/register').send({
        email: 'attacker@example.com',
        password: 'SecurePass123!',
        name: 'Attacker',
        role: 'ADMIN',
      });

      const createArg = MockedUserRepository.prototype.create.mock.calls[0][0];
      expect(createArg.role).toBe(Role.USER);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and a token for correct credentials', async () => {
      const { hashPassword } = await import('@utils/password');
      const hash = await hashPassword('SecurePass123!');

      MockedUserRepository.prototype.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: 'jane@example.com',
        password: hash,
        name: 'Jane Doe',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jane@example.com', password: 'SecurePass123!' });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('jane@example.com');
      expect(typeof response.body.token).toBe('string');
    });

    it('returns 401 for wrong credentials', async () => {
      MockedUserRepository.prototype.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever123' });

      expect(response.status).toBe(401);
    });

    it('returns 400 for a malformed payload', async () => {
      const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
    });
  });
});
