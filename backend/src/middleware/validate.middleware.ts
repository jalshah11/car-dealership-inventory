// Generic request-body validation middleware, parameterized by a Zod
// schema.
//
// WHY A FACTORY FUNCTION (not one middleware per route written by hand)?
// Every route that accepts a body needs the same three steps: parse the
// body against a schema, and either (a) replace req.body with the
// PARSED/SANITIZED version (so downstream code gets exactly the shape the
// schema defines -- e.g. unknown fields like a spoofed `role` are already
// stripped) or (b) short-circuit with a 400 and the validation errors. This
// factory lets us write `validateBody(registerSchema)` per route instead of
// repeating that logic everywhere.

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        // .flatten() gives a friendly { fieldErrors: { email: [...] } }
        // shape rather than Zod's raw issue array -- easier for a frontend
        // to map onto form fields.
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

// A validated-query counterpart to validateBody -- but NOT simply
// `req.query = result.data`.
//
// WHY NOT: in Express 5 (unlike Express 4), `req.query` is defined as a
// GETTER ONLY (no setter) on the request prototype. Assigning to it isn't
// a TypeError -- Node's non-strict-mode semantics mean the assignment is
// silently swallowed, and req.query keeps its original, un-coerced value.
// That's a genuinely nasty bug shape: no error, no crash, just quietly
// wrong data (e.g. minPrice staying the STRING "20000" instead of the
// NUMBER 20000 our search logic expects). We sidestep it entirely by
// attaching the validated/coerced result to its own property instead,
// exactly the same pattern we already use for req.user in
// auth.middleware.ts (see src/types/express.d.ts for the augmentation).
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
}
