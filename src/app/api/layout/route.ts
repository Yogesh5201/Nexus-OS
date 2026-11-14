import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { layoutService } from "@/server/services/layout.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/layout — the user's desktop window layout. */
export const GET = withAuth(async (_req, auth) => {
  return json(await layoutService.get(auth.uid));
});

/** PUT /api/layout — replace the user's window layout snapshot. */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await layoutService.replace(auth.uid, body));
});
