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
    }
  }
}

export {};
