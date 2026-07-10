// Centralized error-handling middleware -- the ONLY place in the app that
// converts a thrown error into an HTTP response.
//
// WHY CENTRALIZE THIS?
// Without it, every controller would need its own try/catch mapping
// AppError -> status code, and would inevitably do it slightly
// inconsistently. Instead, controllers can simply `throw` (or, since we're
// using async handlers, reject a promise) and trust this single middleware
// to catch it. Express recognizes this as an ERROR-HANDLING middleware
// specifically because it has 4 parameters (err, req, res, next) -- that
// signature is how Express distinguishes it from regular middleware.

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/app-error';
import { isProduction } from '@config/env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // An error we did NOT anticipate (a bug, a database connection failure,
  // etc.). We log the full details server-side for debugging, but we
  // deliberately do NOT leak the raw error message/stack trace to the
  // client in production -- that can expose internal implementation
  // details (file paths, library versions, query structure) useful to an
  // attacker. In development, showing the real message speeds up debugging.
  // eslint-disable-next-line no-console
  console.error('Unexpected error:', err);

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
  });
}

// Wraps an async route handler so that a rejected promise is automatically
// forwarded to next(err) -- and therefore to errorHandler above.
//
// WHY THIS EXISTS: Express's built-in error handling only automatically
// catches SYNCHRONOUS throws. If an `async` route handler throws (e.g. our
// AuthService rejecting with a ConflictError), that becomes an unhandled
// promise rejection UNLESS we explicitly catch it and call next(err).
// Repeating try/catch in every controller method is exactly the kind of
// boilerplate this wrapper eliminates.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
