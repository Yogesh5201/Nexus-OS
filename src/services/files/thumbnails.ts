"use client";

/**
 * Client-side thumbnail generation for the File Manager. Produces a small
 * data-URL (stored on the metadata node, so it syncs and renders instantly in
 * the grid). Images are downscaled on a canvas; videos use their first frame.
 * Anything else returns undefined (the grid falls back to a type icon).
 */
const MAX_DIM = 240;
const QUALITY = 0.6;

/** Downscale an image/video frame to a JPEG data-URL. */
function renderToDataURL(
  source: CanvasImageSource,
  width: number,
  height: number
): string | undefined {
  if (!width || !height) return undefined;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.drawImage(source, 0, 0, w, h);
  try {
    return canvas.toDataURL("image/jpeg", QUALITY);
  } catch {
    return undefined; // tainted canvas / unsupported
  }
}

function imageThumb(file: Blob): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = renderToDataURL(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });
}

function videoThumb(file: Blob): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;
    const finish = (out: string | undefined) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(out);
    };
    video.muted = true;
    video.preload = "metadata";
    video.onloadeddata = () => {
      // Seek a touch past the start to avoid black first frames.
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      } catch {
        finish(undefined);
      }
    };
    video.onseeked = () =>
      finish(renderToDataURL(video, video.videoWidth, video.videoHeight));
    video.onerror = () => finish(undefined);
    // Safety timeout.
    setTimeout(() => finish(undefined), 4000);
    video.src = url;
  });
}

/** Generate a thumbnail data-URL for supported media, else undefined. */
export async function generateThumbnail(
  file: Blob,
  type: string
): Promise<string | undefined> {
  try {
    if (type.startsWith("image/") && type !== "image/svg+xml") {
      return await imageThumb(file);
    }
    if (type.startsWith("video/")) {
      return await videoThumb(file);
    }
  } catch {
    /* fall through */
  }
  return undefined;
}
