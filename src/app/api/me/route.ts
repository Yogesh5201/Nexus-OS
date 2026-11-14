import { withAuth, readJson } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { usersService } from "@/server/services/users.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/me — the caller's profile (provisioned from the verified token). */
export const GET = withAuth(async (_req, auth) => {
  return json(await usersService.getOrSync(auth.token));
});

/** PUT /api/me — update mutable profile fields. */
export const PUT = withAuth(async (req, auth) => {
  const body = await readJson(req);
  return json(await usersService.update(auth.uid, body));
});
