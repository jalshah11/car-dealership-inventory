// A custom error class that carries an HTTP status code alongside a
// message.
//
// WHY THIS EXISTS:
// Our SERVICE layer (business logic) should never import Express or know
// about req/res -- that would violate the layering we set up in app.ts.
// But services DO need to communicate "this failed, and here's roughly
// what HTTP status that maps to" up to the controller. AppError is the
// framework-agnostic vocabulary for that: services throw AppError, and a
// single error-handling MIDDLEWARE (built next) is the only place that
// knows how to turn it into an actual HTTP response.

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // this.constructor.name resolves to whichever subclass was actually
    // instantiated (e.g. "NotFoundError", "ConflictError") rather than
    // always "AppError" -- useful in logs to see exactly what kind of
    // error occurred without inspecting the message string.
    this.name = this.constructor.name;

    // NOTE: we deliberately do NOT call Object.setPrototypeOf(this, ...)
    // here. That pattern exists to fix `instanceof` checks when
    // TypeScript downlevels `class` syntax to ES5 (which doesn't support
    // extending built-ins like Error correctly). Our tsconfig targets
    // ES2020, where native class extension works correctly out of the
    // box -- adding setPrototypeOf here would instead BREAK it, by
    // resetting every subclass instance's prototype back to AppError's
    // own prototype, making `instanceof NotFoundError` etc. always false.
    // (We know this because it happened -- see the vehicle.service tests
    // that caught it.)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class OutOfStockError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
