import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { notesService } from "@/server/services/notes.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/notes — { notes, folders } for the user. */
export const GET = withAuth(async (_req, auth) => {
  return json(await notesService.list(auth.uid));
});

/** POST /api/notes — create a note. */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await notesService.create(auth.uid, body), 201);
});

/** PUT /api/notes — snapshot replace all notes (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await notesService.replaceAll(auth.uid, body));
});
