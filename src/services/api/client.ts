"use client";

/**
 * Authenticated fetch client for the NEXUS API.
 *
 * Attaches the current Firebase ID token as a Bearer credential on every
 * request (the server verifies it before any protected handler runs). Throws an
 * `ApiRequestError` carrying the server's message/status on non-2xx responses.
 */
import { getFirebase } from "@/services/firebase";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

/** Get a fresh Firebase ID token, or null when no user is signed in. */
async function getIdToken(): Promise<string | null> {
  const user = getFirebase()?.auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Perform an authenticated JSON request. `body` is JSON-serialized automatically.
 * Returns the parsed JSON (typed by the caller), or `undefined` for empty bodies.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const token = await getIdToken();
  if (!token) {
    throw new ApiRequestError(401, "unauthenticated", "Not signed in.");
  }

  const res = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code = "error";
    try {
      const data = await res.json();
      message = data?.error?.message ?? message;
      code = data?.error?.code ?? code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiRequestError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
