import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { eventsService } from "@/server/services/events.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUT /api/events/:id — update an event by client id. */
export const PUT = withAuth(async (req, auth, ctx) => {
  const body = await readJson(req);
  return json(await eventsService.update(auth.uid, String(ctx.params.id), body));
});

/** DELETE /api/events/:id — delete an event by client id. */
export const DELETE = withAuth(async (_req, auth, ctx) => {
  await eventsService.remove(auth.uid, String(ctx.params.id));
  return json({ ok: true });
});
