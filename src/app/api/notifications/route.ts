import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { notificationsService } from "@/server/services/notifications.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/notifications — the user's notification feed. */
export const GET = withAuth(async (_req, auth) => {
  return json(await notificationsService.list(auth.uid));
});

/** POST /api/notifications — push a notification. */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await notificationsService.create(auth.uid, body), 201);
});

/** PATCH /api/notifications — mark all notifications read. */
export const PATCH = withAuth(async (_req, auth) => {
  await notificationsService.markAllRead(auth.uid);
  return json({ ok: true });
});

/** PUT /api/notifications — snapshot replace (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await notificationsService.replaceAll(auth.uid, body));
});
