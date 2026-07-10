// Global type augmentation: adds an optional `user` property to Express's
// Request type, populated by our `authenticate` middleware. Declaring this
// globally (rather than a custom AuthenticatedRequest type used only in
// some places) means every controller/middleware gets `req.user` typed
// correctly without extra casts, everywhere, consistently.

import { JwtPayload } from '@utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
      // Populated by validateQuery() middleware. Kept SEPARATE from
      // req.query (rather than trying to overwrite it) because Express 5
      // makes req.query a getter-only property -- see
      // src/middleware/validate.middleware.ts for the full explanation.
      // Typed `unknown` here since the actual shape varies per-route
      // (search filters vs. some future query-based endpoint); each
      // controller casts it to its own specific Input type after the
      // corresponding validateQuery(schema) has already guaranteed its shape.
      validatedQuery?: unknown;
    }
  }
}

export {};
