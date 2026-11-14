import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { InstalledAppDoc } from "@/server/schemas/apps.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `installed_apps` collection. */
class AppsRepository extends UserScopedRepository<InstalledAppDoc> {
  constructor() {
    super(COLLECTIONS.apps);
  }
}

export const appsRepository = new AppsRepository();
