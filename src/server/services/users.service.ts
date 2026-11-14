import "server-only";

/**
 * Users service — keeps the `users` collection in sync with verified token
 * claims and exposes the caller's profile. Business logic only; persistence is
 * delegated to `usersRepository`.
 */
import type { DecodedIdToken } from "firebase-admin/auth";
import { usersRepository } from "@/server/repositories/users.repository";
import type { UserDoc } from "@/server/schemas/users.schema";
import { asObject, nullableString } from "@/server/validation";
import type { UserProfileDTO } from "@/types/api";

function toDTO(doc: UserDoc): UserProfileDTO {
  return {
    uid: doc._id,
    email: doc.email,
    displayName: doc.displayName,
    photoURL: doc.photoURL,
    emailVerified: doc.emailVerified,
    providers: doc.providers,
  };
}

export const usersService = {
  /**
   * Return the caller's profile, provisioning/refreshing it from the verified
   * token on each call so the `users` collection always reflects the account.
   */
  async getOrSync(token: DecodedIdToken): Promise<UserProfileDTO> {
    const now = Date.now();
    const existing = await usersRepository.get(token.uid);
    const providers = (token.firebase?.identities
      ? Object.keys(token.firebase.identities)
      : []) as string[];

    const merged: Omit<UserDoc, "_id"> = {
      email: token.email ?? existing?.email ?? null,
      displayName: token.name ?? existing?.displayName ?? null,
      photoURL: token.picture ?? existing?.photoURL ?? null,
      emailVerified: Boolean(token.email_verified ?? existing?.emailVerified),
      providers: providers.length ? providers : existing?.providers ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await usersRepository.upsert(token.uid, merged);
    return toDTO({ _id: token.uid, ...merged });
  },

  /** Update mutable profile fields (mirrors the client's Firebase profile). */
  async update(uid: string, body: unknown): Promise<UserProfileDTO> {
    const input = asObject(body);
    const patch: Partial<UserDoc> = { updatedAt: Date.now() };
    if ("displayName" in input)
      patch.displayName = nullableString(input.displayName, "displayName", 200);
    if ("photoURL" in input)
      patch.photoURL = nullableString(input.photoURL, "photoURL", 2000);

    await usersRepository.patch(uid, patch);
    const doc = await usersRepository.get(uid);
    return toDTO(doc!);
  },
};
