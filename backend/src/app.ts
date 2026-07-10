// The Express APPLICATION -- routes, middleware, everything except the
// actual network listener.
//
// WHY SEPARATE app.ts FROM server.ts?
// This is one of the most important patterns for TESTABILITY. Supertest can
// make fake HTTP requests directly against an Express `app` object WITHOUT
// it needing to be bound to a real port. If `app.listen()` lived in this
// file, importing `app` for a test would also start a real server every
// time we ran a test file -- causing port collisions and slow tests.
// By keeping `app.listen()` in a separate server.ts, our test files can
// `import { app } from './app'` and get a fully-configured app they can
// hit with supertest, with zero network overhead.

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '@routes/auth.routes';
import vehicleRoutes from '@routes/vehicle.routes';
import { errorHandler } from '@middleware/error.middleware';

export function createApp(): Express {
  const app = express();

  // --- Global middleware -----------------------------------------------
  // helmet(): sets a collection of security-related HTTP headers
  // (e.g. disabling X-Powered-By, setting sensible Content-Security-Policy
  // defaults). Free security wins with a single line.
  app.use(helmet());

  // cors(): allows our future React frontend (running on a different
  // origin/port during development, e.g. localhost:5173) to call this API.
  // Without it, browsers block cross-origin requests by default.
  app.use(cors());

  // express.json(): parses incoming JSON request bodies into `req.body`.
  // Without this, `req.body` would be undefined for POST/PUT requests.
  app.use(express.json());

  // --- Health check route -------------------------------------------
  // This is our FIRST endpoint, and deliberately the simplest possible one.
  // It exists so we can (a) prove the whole toolchain -- TypeScript, Express,
  // Jest, Supertest -- works end to end BEFORE we build anything complex on
  // top of it, and (b) give load balancers/uptime monitors something to
  // ping in production.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // --- Feature routes -----------------------------------------------
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);

  // --- 404 handler --------------------------------------------------
  // Must be registered AFTER all real routes -- Express matches routes in
  // registration order, so this only catches requests nothing else handled.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // --- Centralized error handler -----------------------------------
  // Must be registered LAST, and Express identifies it as an error handler
  // specifically because it takes 4 arguments (err, req, res, next).
  app.use(errorHandler);

  return app;
}
