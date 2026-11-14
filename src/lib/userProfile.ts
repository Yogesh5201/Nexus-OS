/**
 * User-profile helpers — the single source of truth for how the signed-in
 * user's identity is presented across the OS.
 *
 * Display-name fallback order (see useUserProfile for the guest branch):
 *   1. Firebase displayName
 *   2. email username (text before "@", capitalized)
 *   3. "Guest"
 *
 * The avatar initial is always the first letter of the resolved display name,
 * so "Yogesh Kumar" -> "Y", "yogesh123@gmail.com" -> "Y", "Guest" -> "G".
 */

import type { AuthUser } from "@/types/auth";

/** Turn an email into a friendly username: "yogesh123@gmail.com" -> "Yogesh123". */
export function usernameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/**
 * Resolve the display name for an authenticated user object, applying the
 * fallback order. Returns "Guest" when there is no usable identity.
 */
export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "Guest";
  const name = user.displayName?.trim();
  if (name) return name;
  if (user.email) {
    const username = usernameFromEmail(user.email);
    if (username) return username;
  }
  return "Guest";
}

/** First letter of a resolved display name, uppercased. Defaults to "G". */
export function getUserInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || "G";
}

/**
 * Time-of-day greeting, driven by the local hour:
 *   05:00–11:59 → Good Morning
 *   12:00–16:59 → Good Afternoon
 *   17:00–20:59 → Good Evening
 *   otherwise   → Good Night
 */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}
