// Authentication and authorization middleware.
//
// authenticate: verifies the JWT on incoming requests and attaches the
// decoded payload to req.user for downstream handlers.
//
// authorize(...roles): a middleware FACTORY that returns a middleware
// checking req.user.role against an allow-list. This is Role-Based Access
// Control (RBAC) -- the simplest useful form of it, where each route
// declares which roles may access it (e.g. `authorize(Role.ADMIN)` on the
// restock endpoint).

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@utils/app-error';
import { Role } from '@prisma/client';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // We require the exact "Bearer <token>" format (the standard for HTTP
  // Authorization headers carrying a token) rather than accepting the raw
  // token alone -- this keeps us compatible with how every HTTP client
  // library and API testing tool expects to send bearer tokens.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    // We intentionally don't distinguish "expired" from "invalid" in the
    // response -- same user-enumeration-style reasoning as login: don't
    // give an attacker probing your API extra information about why their
    // forged token failed.
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If req.user is missing, `authenticate` either wasn't run before this
    // middleware (a wiring bug on our part) or somehow let a request
    // through without setting it. Either way, treat it as unauthenticated
    // rather than crashing on `req.user.role` of undefined.
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
