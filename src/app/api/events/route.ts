import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { eventsService } from "@/server/services/events.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/events — all calendar events for the user. */
export const GET = withAuth(async (_req, auth) => {
  return json(await eventsService.list(auth.uid));
});

/** POST /api/events — create an event. */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await eventsService.create(auth.uid, body), 201);
});

/** PUT /api/events — snapshot replace all events (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await eventsService.replaceAll(auth.uid, body));
});
