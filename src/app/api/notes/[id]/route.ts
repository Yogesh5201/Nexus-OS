import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { notesService } from "@/server/services/notes.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUT /api/notes/:id — update a note by client id. */
export const PUT = withAuth(async (req, auth, ctx) => {
  const body = await readJson(req);
  return json(await notesService.update(auth.uid, String(ctx.params.id), body));
});

/** DELETE /api/notes/:id — delete a note by client id. */
export const DELETE = withAuth(async (_req, auth, ctx) => {
  await notesService.remove(auth.uid, String(ctx.params.id));
  return json({ ok: true });
});
