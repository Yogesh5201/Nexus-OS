import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { chatsService } from "@/server/services/chats.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/chats — the user's AI conversations. */
export const GET = withAuth(async (_req, auth) => {
  return json(await chatsService.list(auth.uid));
});

/** POST /api/chats — create a conversation. */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await chatsService.create(auth.uid, body), 201);
});

/** PUT /api/chats — snapshot replace all conversations (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await chatsService.replaceAll(auth.uid, body));
});
