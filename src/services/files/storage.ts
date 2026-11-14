"use client";

/**
 * High-level file byte storage for the File Manager.
 *
 * Bridges the local IndexedDB cache (`blobStore`) and the cloud byte store
 * (Backblaze B2, reached through authenticated `/api/files/:id/content` routes).
 *
 * - Signed in  → bytes upload to B2 (cross-device) and are cached locally.
 * - Guest/offline/B2 unconfigured → bytes stay in IndexedDB only (local-first).
 *
 * Every function degrades gracefully: a missing token or 503 from the server
 * simply means "local only", never a thrown error that breaks the upload.
 */
import { getFirebase } from "@/services/firebase";
import { blobStore } from "./blobStore";

export interface StorageRefs {
  b2FileId: string | null;
  b2FileName: string | null;
  storageKey: string | null;
}

/** Minimal shape needed to locate a node's bytes. */
export interface ByteRef {
  id: string;
  name: string;
  type: string;
  b2FileName?: string | null;
}

/** Get a fresh Firebase ID token, or null when signed out. */
async function getIdToken(): Promise<string | null> {
  try {
    const user = getFirebase()?.auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

const NO_REFS: StorageRefs = { b2FileId: null, b2FileName: null, storageKey: null };

/**
 * Store a file's bytes. Always writes to the local cache; when signed in, also
 * uploads to B2 via XHR (so we get real upload progress) and returns the object
 * refs to persist on the metadata node.
 */
export async function uploadBytes(
  fileId: string,
  file: Blob,
  opts: { onProgress?: (loaded: number, total: number) => void; name?: string } = {}
): Promise<StorageRefs> {
  // 1) Local cache first — guarantees instant preview + offline/guest support.
  try {
    await blobStore.put(fileId, file);
  } catch {
    /* IndexedDB may be unavailable (private mode) — cloud upload still works */
  }

  const token = await getIdToken();
  if (!token) return NO_REFS; // guest → local only

  // 2) Cloud upload via XHR for progress events.
  return new Promise<StorageRefs>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/files/${encodeURIComponent(fileId)}/content`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );
    const nm = opts.name ?? (file instanceof File ? file.name : undefined);
    if (nm) xhr.setRequestHeader("X-File-Name", encodeURIComponent(nm));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded, e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const dto = JSON.parse(xhr.responseText);
          resolve({
            b2FileId: dto.b2FileId ?? null,
            b2FileName: dto.b2FileName ?? null,
            storageKey: dto.storageKey ?? null,
          });
        } catch {
          resolve(NO_REFS);
        }
      } else if (xhr.status === 503 || xhr.status === 0) {
        // Storage not configured / offline → keep working locally.
        resolve(NO_REFS);
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => resolve(NO_REFS); // network error → local only
    xhr.send(file);
  });
}

/** Read a file's bytes — from the local cache, falling back to B2. */
export async function getBlob(node: ByteRef): Promise<Blob | null> {
  const cached = await blobStore.get(node.id);
  if (cached) return cached;

  if (!node.b2FileName) return null; // never uploaded to cloud
  const token = await getIdToken();
  if (!token) return null;

  try {
    const res = await fetch(`/api/files/${encodeURIComponent(node.id)}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    // Re-cache for next time.
    blobStore.put(node.id, blob).catch(() => {});
    return blob;
  } catch {
    return null;
  }
}

/** Build an object URL for a node's bytes (caller must revoke it). */
export async function getObjectURL(node: ByteRef): Promise<string | null> {
  const blob = await getBlob(node);
  return blob ? URL.createObjectURL(blob) : null;
}

/** Trigger a browser download of a node's bytes. */
export async function downloadFile(node: ByteRef): Promise<boolean> {
  const blob = await getBlob(node);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = node.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Remove a node's local bytes (cloud bytes are freed via the DELETE route). */
export async function deleteLocalBytes(id: string): Promise<void> {
  await blobStore.del(id);
}

/** Total bytes cached locally (for the storage meter). */
export async function totalLocalSize(): Promise<number> {
  return blobStore.totalSize();
}
