// Zod schemas for auth-related request bodies.
//
// WHY VALIDATE AT THE EDGE?
// Every request body from the outside world is untrusted, no matter what
// the frontend's HTML form claims to enforce -- a client could be curl,
// Postman, or a malicious script bypassing the UI entirely. Validating here,
// BEFORE the request reaches our service/business logic, means services can
// safely assume their input is well-formed and never need defensive
// `if (!email) throw ...` checks scattered through business logic.
//
// SECURITY NOTE: `registerSchema` deliberately has NO `role` field. Zod's
// default behavior strips unknown keys during parsing, so even if a client
// sends `{ ..., role: "ADMIN" }`, the parsed/validated output simply won't
// contain a `role` property -- privilege escalation via registration is
// structurally impossible, not just something we "remembered" to check.

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
