import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { filesService } from "@/server/services/files.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUT /api/files/:id — rename/update a file by client id. */
export const PUT = withAuth(async (req, auth, ctx) => {
  const body = await readJson(req);
  return json(await filesService.update(auth.uid, String(ctx.params.id), body));
});

/** DELETE /api/files/:id — delete a file by client id. */
export const DELETE = withAuth(async (_req, auth, ctx) => {
  await filesService.remove(auth.uid, String(ctx.params.id));
  return json({ ok: true });
});
