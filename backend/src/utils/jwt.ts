// JWT signing/verification utilities.
//
// WHY JWT?
// JWTs let our API stay STATELESS: after login, the server doesn't need to
// keep a session store in memory or a database table of "active sessions".
// The token itself carries the claims (who the user is, their role) and is
// cryptographically signed -- the server can verify it hasn't been tampered
// with just by checking the signature, without a database lookup on every
// request. This is a major reason JWTs are popular for REST APIs, though
// it comes with a trade-off we'll discuss later: you can't easily
// "revoke" a single JWT before it naturally expires (no server-side record
// to delete), which is why we keep expiry short (JWT_EXPIRES_IN) rather
// than issuing tokens that live forever.

import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '@config/env';

export interface JwtPayload {
  userId: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  // We intentionally sign ONLY userId + role into the token -- never the
  // password hash, and generally as little PII as possible, since JWT
  // payloads are base64-encoded (readable by anyone with the token), not
  // encrypted.
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  // jwt.verify throws (JsonWebTokenError, TokenExpiredError, etc.) if the
  // signature is invalid, the token is malformed, or it has expired. We
  // deliberately let that exception propagate -- our auth MIDDLEWARE
  // (built next) is responsible for catching it and turning it into a 401.
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
