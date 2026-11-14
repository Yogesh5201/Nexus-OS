import "server-only";

/**
 * Tiny hand-written validators for request payloads. The project deliberately
 * avoids schema libraries (zod etc.), so these mirror that style: each throws a
 * `ValidationError` (HTTP 422) with a field-specific message on bad input and
 * otherwise returns the cleaned, typed value.
 */
import { ValidationError } from "./http/errors";

/** Ensure the body parsed to a plain object. */
export function asObject(value: unknown, label = "body"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

/** Ensure the body parsed to an array. */
export function asArray(value: unknown, label = "body"): unknown[] {
  if (!Array.isArray(value)) throw new ValidationError(`${label} must be an array.`);
  return value;
}

/** Required non-empty string, trimmed and length-capped. */
export function requireString(value: unknown, field: string, max = 10_000): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${field} is required.`);
  }
  if (value.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters.`);
  }
  return value;
}

/** Optional string; returns the fallback when absent/null. */
export function optionalString(
  value: unknown,
  field: string,
  fallback = "",
  max = 10_000
): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string.`);
  if (value.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters.`);
  }
  return value;
}

/** Optional string that may be explicitly null (e.g. photoURL). */
export function nullableString(
  value: unknown,
  field: string,
  max = 10_000
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string.`);
  if (value.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters.`);
  }
  return value;
}

/** Value must be one of `allowed`. */
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

/** Finite number, optionally clamped to a range. */
export function requireNumber(
  value: unknown,
  field: string,
  { min, max }: { min?: number; max?: number } = {}
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a number.`);
  }
  if (min !== undefined && value < min) {
    throw new ValidationError(`${field} must be ≥ ${min}.`);
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${field} must be ≤ ${max}.`);
  }
  return value;
}

/** Boolean with a fallback when absent. */
export function optionalBoolean(value: unknown, field: string, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw new ValidationError(`${field} must be a boolean.`);
  return value;
}
