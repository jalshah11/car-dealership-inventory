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
    this.name = 'AppError';

    // Restores correct prototype chain when compiling to ES2020/CommonJS,
    // so `err instanceof AppError` works reliably.
    Object.setPrototypeOf(this, AppError.prototype);
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
