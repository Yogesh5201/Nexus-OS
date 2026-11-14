import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { LayoutDoc } from "@/server/schemas/layout.schema";
import { SingletonRepository } from "./singleton.repository";

/** Repository for the `desktop_layout` collection (one doc per user). */
class LayoutRepository extends SingletonRepository<LayoutDoc> {
  constructor() {
    super(COLLECTIONS.layout);
  }
}

export const layoutRepository = new LayoutRepository();
