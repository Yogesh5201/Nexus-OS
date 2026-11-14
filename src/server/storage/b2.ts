import "server-only";

/**
 * Backblaze B2 object storage (native B2 API, via `fetch` — no SDK dependency).
 *
 * NEXUS file *metadata* lives in MongoDB; the actual file *bytes* live here in a
 * private B2 bucket. All access is proxied through authenticated Next.js API
 * routes, so the B2 application key NEVER reaches the browser (same principle as
 * the MongoDB credentials). When B2 isn't configured the File Manager degrades
 * to a local-only (IndexedDB) experience — nothing breaks.
 *
 * Object key convention: `${uid}/${fileId}` — the uid prefix means a user's
 * bytes are namespaced server-side and routes only ever build keys from the
 * verified `auth.uid`.
 */
import { createHash } from "crypto";

const KEY_ID = process.env.B2_KEY_ID;
const APP_KEY = process.env.B2_APPLICATION_KEY;
const BUCKET_ID = process.env.B2_BUCKET_ID;
const BUCKET_NAME = process.env.B2_BUCKET_NAME;

/** True when all four B2 env vars are present. */
export const isB2Configured = Boolean(KEY_ID && APP_KEY && BUCKET_ID && BUCKET_NAME);

const AUTHORIZE_URL = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account";
/** Re-authorize well before B2's 24h token lifetime to stay safe. */
const AUTH_TTL_MS = 23 * 60 * 60 * 1000;

interface B2Auth {
  apiUrl: string;
  downloadUrl: string;
  authorizationToken: string;
  fetchedAt: number;
}

interface UploadTarget {
  uploadUrl: string;
  authorizationToken: string;
}

export interface B2Object {
  b2FileId: string;
  b2FileName: string;
}

/** Cache the account auth across warm invocations / HMR. */
const globalForB2 = globalThis as unknown as { _nexusB2?: B2Auth };

function requireConfigured(): void {
  if (!isB2Configured) {
    throw new Error("Backblaze B2 is not configured.");
  }
}

/** Authorize (or reuse a cached authorization) with the B2 account. */
async function authorize(force = false): Promise<B2Auth> {
  requireConfigured();
  const cached = globalForB2._nexusB2;
  if (!force && cached && Date.now() - cached.fetchedAt < AUTH_TTL_MS) {
    return cached;
  }

  const basic = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString("base64");
  const res = await fetch(AUTHORIZE_URL, {
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`B2 authorize failed (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as {
    apiUrl: string;
    downloadUrl: string;
    authorizationToken: string;
  };
  const auth: B2Auth = {
    apiUrl: data.apiUrl,
    downloadUrl: data.downloadUrl,
    authorizationToken: data.authorizationToken,
    fetchedAt: Date.now(),
  };
  globalForB2._nexusB2 = auth;
  return auth;
}

/** Best-effort read of an error body without throwing. */
async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}

/** B2 requires the file name percent-encoded in the upload header. */
function encodeName(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

/** Upload bytes to B2 under `key`. Returns the stored object's id + name. */
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<B2Object> {
  requireConfigured();
  const sha1 = createHash("sha1").update(body).digest("hex");

  // Fetch a fresh upload URL (single use is fine and avoids stale-URL retries).
  const getTarget = async (): Promise<UploadTarget> => {
    const auth = await authorize();
    const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: "POST",
      headers: { Authorization: auth.authorizationToken },
      body: JSON.stringify({ bucketId: BUCKET_ID }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`B2 get_upload_url failed (${res.status}): ${await safeText(res)}`);
    }
    return (await res.json()) as UploadTarget;
  };

  let target = await getTarget();
  let res = await doUpload(target, key, body, contentType, sha1);

  // 401/503 → token/endpoint went stale; re-authorize once and retry.
  if (res.status === 401 || res.status === 503) {
    await authorize(true);
    target = await getTarget();
    res = await doUpload(target, key, body, contentType, sha1);
  }
  if (!res.ok) {
    throw new Error(`B2 upload failed (${res.status}): ${await safeText(res)}`);
  }
  const data = (await res.json()) as { fileId: string; fileName: string };
  return { b2FileId: data.fileId, b2FileName: data.fileName };
}

function doUpload(
  target: UploadTarget,
  key: string,
  body: Buffer,
  contentType: string,
  sha1: string
): Promise<Response> {
  return fetch(target.uploadUrl, {
    method: "POST",
    headers: {
      Authorization: target.authorizationToken,
      "X-Bz-File-Name": encodeName(key),
      "Content-Type": contentType || "b2/x-auto",
      "Content-Length": String(body.length),
      "X-Bz-Content-Sha1": sha1,
    },
    // Buffer is a Uint8Array (valid BodyInit at runtime); cast for DOM typings.
    body: body as unknown as BodyInit,
    cache: "no-store",
  });
}

/**
 * Stream an object's bytes back from B2. Returns the upstream `Response` so the
 * route can pipe the body through with the right content-type.
 */
export async function downloadObject(b2FileName: string): Promise<Response> {
  requireConfigured();
  const fetchOnce = async (): Promise<Response> => {
    const auth = await authorize();
    const url = `${auth.downloadUrl}/file/${BUCKET_NAME}/${encodeName(b2FileName)}`;
    return fetch(url, {
      headers: { Authorization: auth.authorizationToken },
      cache: "no-store",
    });
  };

  let res = await fetchOnce();
  if (res.status === 401) {
    await authorize(true);
    res = await fetchOnce();
  }
  if (!res.ok) {
    throw new Error(`B2 download failed (${res.status}): ${await safeText(res)}`);
  }
  return res;
}

/** Permanently delete an object version from B2 (best-effort). */
export async function deleteObject(b2FileName: string, b2FileId: string): Promise<void> {
  if (!isB2Configured) return;
  const auth = await authorize();
  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: "POST",
    headers: { Authorization: auth.authorizationToken },
    body: JSON.stringify({ fileName: b2FileName, fileId: b2FileId }),
    cache: "no-store",
  });
  // Ignore "already gone" (400 file_not_present) so deletes stay idempotent.
  if (!res.ok && res.status !== 400) {
    throw new Error(`B2 delete failed (${res.status}): ${await safeText(res)}`);
  }
}
