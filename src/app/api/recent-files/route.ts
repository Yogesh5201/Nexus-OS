import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { recentFilesService } from "@/server/services/recentFiles.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/recent-files — the user's recently accessed files. */
export const GET = withAuth(async (_req, auth) => {
  return json(await recentFilesService.list(auth.uid));
});

/** POST /api/recent-files — record a file access (upsert + trim). */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await recentFilesService.record(auth.uid, body), 201);
});

/** PUT /api/recent-files — snapshot replace (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await recentFilesService.replaceAll(auth.uid, body));
});
