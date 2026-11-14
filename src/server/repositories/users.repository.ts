import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { UserDoc } from "@/server/schemas/users.schema";
import { SingletonRepository } from "./singleton.repository";

/** Repository for the `users` collection (one doc per Firebase uid). */
class UsersRepository extends SingletonRepository<UserDoc> {
  constructor() {
    super(COLLECTIONS.users);
  }
}

export const usersRepository = new UsersRepository();
