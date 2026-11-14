import "server-only";

/**
 * Typed API errors. Each carries an HTTP `status` and a short machine-readable
 * `code`; `respond.ts` maps them to a consistent JSON error body. Anything that
 * isn't an `ApiError` is treated as an unexpected 500 (details hidden).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request") {
    super(400, "bad_request", message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "You don't have access to this resource") {
    super(403, "forbidden", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, "not_found", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(409, "conflict", message);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed") {
    super(422, "validation_error", message);
  }
}
