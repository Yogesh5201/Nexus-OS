import { withAuth } from "@/server/http/withAuth";
import { json } from "@/server/http/respond";
import { ApiError, NotFoundError } from "@/server/http/errors";
import { filesService } from "@/server/services/files.service";
import {
  isB2Configured,
  uploadObject,
  downloadObject,
} from "@/server/storage/b2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Max bytes accepted per upload (server buffers the whole file). */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/files/:id/content — upload the bytes for a file. The metadata doc
 * must already exist (created via POST /api/files or the snapshot sync). Stores
 * the bytes in Backblaze B2 and records the object refs on the doc.
 */
export const POST = withAuth(async (req, auth, ctx) => {
  if (!isB2Configured) {
    throw new ApiError(503, "storage_unconfigured", "Object storage is not configured.");
  }
  const clientId = String(ctx.params.id);

  // The doc may not be synced yet (debounced snapshot) — that's fine; setStorage
  // upserts. If it exists and is a folder, reject.
  const doc = await filesService.get(auth.uid, clientId);
  if (doc?.kind === "folder") {
    throw new ApiError(400, "bad_request", "Folders have no content.");
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) throw new ApiError(400, "bad_request", "Empty upload.");
  if (buf.length > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, "too_large", "File exceeds the 100 MB upload limit.");
  }

  const contentType =
    req.headers.get("content-type") || doc?.type || "application/octet-stream";
  const headerName = req.headers.get("x-file-name");
  const name = headerName ? decodeURIComponent(headerName) : doc?.name;
  const storageKey = `${auth.uid}/${clientId}`;
  const { b2FileId, b2FileName } = await uploadObject(storageKey, buf, contentType);

  const updated = await filesService.setStorage(auth.uid, clientId, {
    b2FileId,
    b2FileName,
    storageKey,
    size: buf.length,
    type: contentType,
    name,
  });
  return json(updated);
});

/**
 * GET /api/files/:id/content — stream a file's bytes back from B2. Powers
 * download and cross-device preview. Ownership is verified via the metadata doc.
 */
export const GET = withAuth(async (_req, auth, ctx) => {
  const clientId = String(ctx.params.id);
  const doc = await filesService.get(auth.uid, clientId);
  if (!doc) throw new NotFoundError("File not found.");
  if (!doc.b2FileName) throw new NotFoundError("File has no stored content.");
  if (!isB2Configured) {
    throw new ApiError(503, "storage_unconfigured", "Object storage is not configured.");
  }

  const upstream = await downloadObject(doc.b2FileName);
  const headers = new Headers();
  headers.set("Content-Type", doc.type || "application/octet-stream");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(doc.name)}"`
  );
  headers.set("Cache-Control", "private, max-age=300");
  return new Response(upstream.body, { status: 200, headers });
});
