import { withAuth } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { notificationsService } from "@/server/services/notifications.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/notifications/:id — dismiss a notification by client id. */
export const DELETE = withAuth(async (_req, auth, ctx) => {
  await notificationsService.remove(auth.uid, String(ctx.params.id));
  return json({ ok: true });
});
