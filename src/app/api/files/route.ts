import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { filesService } from "@/server/services/files.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/files — the user's file metadata. */
export const GET = withAuth(async (_req, auth) => {
  return json(await filesService.list(auth.uid));
});

/** POST /api/files — record a file's metadata. */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await filesService.create(auth.uid, body), 201);
});

/** PUT /api/files — snapshot replace all file metadata (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await filesService.replaceAll(auth.uid, body));
});
