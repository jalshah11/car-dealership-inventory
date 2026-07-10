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
