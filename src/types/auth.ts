/** Authentication domain types (provider-agnostic shape over Firebase User). */

/** Which sign-in providers a user account is linked to. */
export type AuthProviderId = "google.com" | "github.com" | "password";

/** A normalized view of the authenticated user, decoupled from the SDK type. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  /** Providers linked to this account (e.g. ["google.com"]). */
  providers: AuthProviderId[];
}

/**
 * High-level auth lifecycle state.
 * - `loading`        — waiting for the first onAuthStateChanged resolution
 * - `authenticated`  — a real Firebase user is signed in
 * - `guest`          — user explicitly chose to continue offline (no account)
 * - `signedOut`      — no user and not in guest mode → show the login screen
 */
export type AuthStatus = "loading" | "authenticated" | "guest" | "signedOut";
