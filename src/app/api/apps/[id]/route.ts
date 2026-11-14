import { withAuth } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { appsService } from "@/server/services/apps.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/apps/:id — uninstall an app (id = appId). */
export const DELETE = withAuth(async (_req, auth, ctx) => {
  await appsService.uninstall(auth.uid, String(ctx.params.id));
  return json({ ok: true });
});
