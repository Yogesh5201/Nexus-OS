import "server-only";

/**
 * Firebase Admin — server-side ID-token verification.
 *
 * The browser sends the Firebase ID token (from `currentUser.getIdToken()`) in
 * the `Authorization: Bearer <token>` header. This module initializes the Admin
 * SDK once (from a service account in env vars) and verifies tokens so protected
 * API routes can trust the caller's `uid`. Credentials never reach the client.
 */
import {
  initializeApp,
  getApps,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { UnauthorizedError } from "@/server/http/errors";

/** True when all Admin service-account env vars are present. */
export const isAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0];
    return cachedApp;
  }
  if (!isAdminConfigured) {
    throw new UnauthorizedError(
      "Server auth is not configured (missing Firebase Admin credentials)."
    );
  }
  cachedApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Env vars store newlines escaped as "\n"; restore them for the PEM.
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  return cachedApp;
}

/** Verify a Firebase ID token, returning its decoded claims (incl. `uid`). */
export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  try {
    return await getAuth(getAdminApp()).verifyIdToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired authentication token.");
  }
}
