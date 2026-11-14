/**
 * Firebase Authentication service.
 *
 * A thin, typed wrapper over the Firebase Auth SDK. All real authentication in
 * NEXUS goes through this module — there is no mock/dev fallback. Every function
 * resolves Firebase lazily via `getFirebase()` and throws a friendly Error
 * (see `authErrorMessage`) when Firebase is not configured or a call fails.
 */
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged as fbOnAuthStateChanged,
  type User,
  type Auth,
  type Unsubscribe,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebase, isFirebaseConfigured } from "./firebase";
import type { AuthProviderId, AuthUser } from "@/types/auth";

/** Thrown when an auth action is attempted but Firebase isn't configured. */
export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Firebase is not configured. Add your Firebase keys to .env.local to enable sign-in."
    );
    this.name = "FirebaseNotConfiguredError";
  }
}

/** Get the Auth instance or throw a clear, user-facing error. */
function requireAuth(): Auth {
  const fb = getFirebase();
  if (!fb) throw new FirebaseNotConfiguredError();
  return fb.auth;
}

/** Map a Firebase `User` to our normalized, SDK-agnostic shape. */
export function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providers: user.providerData.map((p) => p.providerId as AuthProviderId),
  };
}

/**
 * Configure session persistence before a sign-in call.
 * - Remember me  → `browserLocalPersistence` (survives browser restarts)
 * - Otherwise    → `browserSessionPersistence` (cleared when the tab closes)
 */
async function applyPersistence(auth: Auth, remember: boolean): Promise<void> {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}

/** Subscribe to auth state changes. Returns a no-op unsubscribe if unconfigured. */
export function onAuthStateChanged(
  cb: (user: AuthUser | null) => void
): Unsubscribe {
  const fb = getFirebase();
  if (!fb) {
    cb(null);
    return () => {};
  }
  return fbOnAuthStateChanged(fb.auth, (user) =>
    cb(user ? toAuthUser(user) : null)
  );
}

/** Sign in with a Google popup. */
export async function signInWithGoogle(remember = true): Promise<AuthUser> {
  const auth = requireAuth();
  await applyPersistence(auth, remember);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);
  return toAuthUser(user);
}

/** Sign in with a GitHub popup. */
export async function signInWithGithub(remember = true): Promise<AuthUser> {
  const auth = requireAuth();
  await applyPersistence(auth, remember);
  const provider = new GithubAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  return toAuthUser(user);
}

/** Sign in with email + password. */
export async function signInWithEmail(
  email: string,
  password: string,
  remember = true
): Promise<AuthUser> {
  const auth = requireAuth();
  await applyPersistence(auth, remember);
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(user);
}

/** Create a new email + password account, optionally setting a display name. */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
  remember = true
): Promise<AuthUser> {
  const auth = requireAuth();
  await applyPersistence(auth, remember);
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await fbUpdateProfile(user, { displayName: displayName.trim() });
  }
  return toAuthUser(user);
}

/** Send a password-reset email. */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = requireAuth();
  await sendPasswordResetEmail(auth, email);
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured) return;
  const auth = requireAuth();
  await fbSignOut(auth);
}

/** Update the current user's display name and/or photo URL. */
export async function updateProfile(updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<AuthUser> {
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to update your profile.");
  await fbUpdateProfile(user, updates);
  await user.reload();
  return toAuthUser(auth.currentUser ?? user);
}

/**
 * Upload a new avatar image to Firebase Storage and set it as the user's
 * photo. Returns the updated user (with the new `photoURL`).
 */
export async function uploadAvatar(file: File): Promise<AuthUser> {
  const fb = getFirebase();
  if (!fb) throw new FirebaseNotConfiguredError();
  const user = fb.auth.currentUser;
  if (!user) throw new Error("You must be signed in to update your avatar.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const storageRef = ref(fb.storage, `avatars/${user.uid}/profile.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const photoURL = await getDownloadURL(storageRef);
  return updateProfile({ photoURL });
}

/** Translate a Firebase error code into a concise, human-friendly message. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseNotConfiguredError) return error.message;

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in window was closed before completing.";
    case "auth/cancelled-popup-request":
      return "Another sign-in attempt is already in progress.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups and retry.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled for this project.";
    default:
      if (error instanceof Error && error.message) return error.message;
      return "Something went wrong. Please try again.";
  }
}
