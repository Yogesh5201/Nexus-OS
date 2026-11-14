"use client";

import { useMemo } from "react";
import { ImageOff } from "lucide-react";
import { extOf } from "../../../data/languages";

/**
 * Image preview. Since the virtual FS stores text, this renders:
 *   - SVG files (markup → data URL, so any embedded script can't run)
 *   - data: URLs or http(s) image URLs stored as the file's content
 */
export default function ImageViewer({
  name,
  content,
}: {
  name: string;
  content: string;
}) {
  const src = useMemo(() => {
    const ext = extOf(name);
    const trimmed = content.trim();
    if (ext === "svg" && /<svg[\s>]/i.test(content))
      return `data:image/svg+xml;utf8,${encodeURIComponent(content)}`;
    if (/^data:image\//i.test(trimmed)) return trimmed;
    if (/^https?:\/\/\S+$/i.test(trimmed)) return trimmed;
    return null;
  }, [name, content]);

  if (!src) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <ImageOff className="h-5 w-5 text-muted" />
        <p className="max-w-[220px] text-xs text-muted/70">
          No inline preview for this image. Paste SVG markup, a data: URL, or an
          image URL as the file content to preview it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-[repeating-conic-gradient(#ffffff08_0_25%,transparent_0_50%)] bg-[length:20px_20px] p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="max-h-full max-w-full object-contain" />
    </div>
  );
}
