import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { NotificationDoc } from "@/server/schemas/notifications.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `notifications` collection. */
class NotificationsRepository extends UserScopedRepository<NotificationDoc> {
  constructor() {
    super(COLLECTIONS.notifications);
  }

  /** Mark every one of a user's notifications as read. */
  async markAllRead(userId: string): Promise<void> {
    const col = await this.col();
    await col.updateMany(this.scoped(userId, { read: false }), {
      $set: { read: true },
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
