import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { EventDoc } from "@/server/schemas/events.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `calendar_events` collection. */
class EventsRepository extends UserScopedRepository<EventDoc> {
  constructor() {
    super(COLLECTIONS.events);
  }
}

export const eventsRepository = new EventsRepository();
