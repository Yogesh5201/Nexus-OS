import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { settingsService } from "@/server/services/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/settings — the user's settings (or defaults). */
export const GET = withAuth(async (_req, auth) => {
  return json(await settingsService.get(auth.uid));
});

/** PUT /api/settings — replace the user's settings. */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await settingsService.replace(auth.uid, body));
});
