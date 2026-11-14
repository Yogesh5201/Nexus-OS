import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { appsService } from "@/server/services/apps.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/apps — the user's installed apps. */
export const GET = withAuth(async (_req, auth) => {
  return json(await appsService.list(auth.uid));
});

/** POST /api/apps — install an app. */
export const POST = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await appsService.install(auth.uid, body), 201);
});

/** PUT /api/apps — snapshot replace installed apps (sync push). */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await appsService.replaceAll(auth.uid, body));
});
