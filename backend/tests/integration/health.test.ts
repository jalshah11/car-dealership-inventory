// Integration test: we exercise the REAL Express app through Supertest,
// making an actual (in-memory) HTTP request rather than calling the route
// handler function directly. This tests the full request/response cycle --
// middleware, routing, status codes, JSON serialization -- exactly as a
// real client would experience it.

import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/health', () => {
  const app = createApp();

  it('returns 200 and a status of "ok"', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('Unknown routes', () => {
  const app = createApp();

  it('returns 404 for a route that does not exist', async () => {
    const response = await request(app).get('/api/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not Found' });
  });
});
