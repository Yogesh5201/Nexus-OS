import "server-only";

/**
 * Uniform JSON responses for API routes. Success → `json(data)`; failures go
 * through `fail(err)`, which serializes `ApiError`s and masks unexpected errors
 * as a generic 500 so internal details never leak to the client.
 */
import { ApiError } from "./errors";

/** A successful JSON response. */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Map any thrown value to a consistent JSON error response. */
export function fail(err: unknown): Response {
  if (err instanceof ApiError) {
    return new Response(
      JSON.stringify({ error: { message: err.message, code: err.code } }),
      {
        status: err.status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  // Unexpected — log server-side, return a safe generic message.
  console.error("[api] unhandled error:", err);
  return new Response(
    JSON.stringify({ error: { message: "Internal server error", code: "internal" } }),
    { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}
