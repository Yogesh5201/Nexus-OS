import "server-only";

/**
 * `withAuth` — the security boundary for every protected API route.
 *
 * It verifies the Firebase ID token on EVERY request before the handler runs,
 * ensures the database schema/indexes exist, and funnels all thrown errors
 * through `fail()` for consistent JSON responses. Handlers receive a trusted
 * `AuthContext` (the authenticated `uid`) plus the route context (`params`).
 */
import type { DecodedIdToken } from "firebase-admin/auth";
import { verifyIdToken } from "@/server/auth/admin";
import { ensureSchema } from "@/server/db/indexes";
import { isMongoConfigured } from "@/server/db/mongo";
import { ApiError, UnauthorizedError } from "./errors";
import { fail } from "./respond";

/** Trusted identity derived from a verified ID token. */
export interface AuthContext {
  uid: string;
  email: string | null;
  token: DecodedIdToken;
}

/** Next.js route context (dynamic segment params). */
export interface RouteContext {
  params: Record<string, string | string[]>;
}

type AuthedHandler = (
  req: Request,
  auth: AuthContext,
  ctx: RouteContext
) => Promise<Response> | Response;

/** Pull and validate the `Authorization: Bearer <token>` header. */
function extractBearer(req: Request): string {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing bearer token.");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new UnauthorizedError("Empty bearer token.");
  return token;
}

/** Wrap a route handler with auth verification, schema bootstrap & error handling. */
export function withAuth(handler: AuthedHandler) {
  return async (req: Request, ctx: RouteContext): Promise<Response> => {
    try {
      // 1) Authenticate first — unauthenticated callers always get 401.
      const token = extractBearer(req);
      const decoded = await verifyIdToken(token);

      // 2) Then require the database and ensure schema/indexes (memoized).
      if (!isMongoConfigured) {
        throw new ApiError(503, "db_unconfigured", "Database is not configured.");
      }
      await ensureSchema();

      const auth: AuthContext = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        token: decoded,
      };
      return await handler(req, auth, ctx ?? { params: {} });
    } catch (err) {
      return fail(err);
    }
  };
}

/** Parse a JSON request body, throwing a clean 400 on malformed input. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "bad_request", "Request body must be valid JSON.");
  }
}
