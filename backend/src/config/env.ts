// Centralized environment configuration.
//
// WHY THIS FILE EXISTS:
// If every file reached into `process.env.JWT_SECRET` directly, a typo in
// the variable name would silently produce `undefined` at runtime instead
// of failing fast at startup. By reading and validating all env vars in ONE
// place, we get a single source of truth, autocomplete/type-safety
// everywhere else in the app, and a loud, immediate crash if something
// required is missing -- which is much easier to debug than a mysterious
// 500 error three requests later.

import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    // Fail fast: better to crash on startup with a clear message than to
    // limp along and fail unpredictably later (e.g. signing JWTs with
    // "undefined" as the secret).
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
} as const;

export const isTest = env.nodeEnv === 'test';
export const isProduction = env.nodeEnv === 'production';
