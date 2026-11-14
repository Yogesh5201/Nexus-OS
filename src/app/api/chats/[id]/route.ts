import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { chatsService } from "@/server/services/chats.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUT /api/chats/:id — update a conversation by client id. */
export const PUT = withAuth(async (req, auth, ctx) => {
  const body = await readJson(req);
  return json(await chatsService.update(auth.uid, String(ctx.params.id), body));
});

/** DELETE /api/chats/:id — delete a conversation by client id. */
export const DELETE = withAuth(async (_req, auth, ctx) => {
  await chatsService.remove(auth.uid, String(ctx.params.id));
  return json({ ok: true });
});
