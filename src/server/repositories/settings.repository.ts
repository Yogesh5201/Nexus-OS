import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { SettingsDoc } from "@/server/schemas/settings.schema";
import { SingletonRepository } from "./singleton.repository";

/** Repository for the `settings` collection (one doc per user). */
class SettingsRepository extends SingletonRepository<SettingsDoc> {
  constructor() {
    super(COLLECTIONS.settings);
  }
}

export const settingsRepository = new SettingsRepository();
