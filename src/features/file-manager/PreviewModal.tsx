"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileQuestion,
  Loader2,
  X,
  GripVertical,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import type { FileNode } from "@/store/useFilesStore";
import { Markdown } from "@/components/ui/Markdown";
import { getBlob } from "@/services/files/storage";
import { previewKindFor } from "./helpers";

interface PreviewModalProps {
  node: FileNode;
  files: FileNode[];
  onSelect: (node: FileNode) => void;
  onClose: () => void;
  onDownload: (node: FileNode) => void;
}

export function PreviewModal({ node, files, onSelect, onClose, onDownload }: PreviewModalProps) {
  const previewable = files.filter((f) => f.kind === "file");
  const index = previewable.findIndex((f) => f.id === node.id);
  const prev = index > 0 ? previewable[index - 1] : null;
  const next = index >= 0 && index < previewable.length - 1 ? previewable[index + 1] : null;

  const kind = previewKindFor(node);
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Draggable and resizable state
  const dialogRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 86, height: 82 }); // in viewport percentage
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let active = true;
    let made: string | null = null;
    setLoading(true);
    setError(false);
    setUrl(null);
    setText(null);
    (async () => {
      const blob = await getBlob(node);
      if (!active) return;
      if (!blob) {
        setError(true);
        setLoading(false);
        return;
      }
      if (kind === "markdown" || kind === "text") {
        const t = await blob.text();
        if (!active) return;
        setText(t);
      } else if (kind !== "none") {
        made = URL.createObjectURL(blob);
        setUrl(made);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [node.id, kind]);

  // Arrow-key navigation between files.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) onSelect(prev);
      else if (e.key === "ArrowRight" && next) onSelect(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onSelect]);

  // Initialize centered position
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isResizing || !dialogRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Get window dimensions
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Calculate size change in viewport percentage
      const widthDelta = (deltaX / vw) * 100;
      const heightDelta = (deltaY / vh) * 100;

      setSize((prev) => ({
        width: Math.max(30, Math.min(95, prev.width + widthDelta)), // Min 30vw, max 95vw
        height: Math.max(30, Math.min(95, prev.height + heightDelta)), // Min 30vh, max 95vh
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, dragStart]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          ref={dialogRef}
          className={cn(
            "glass-strong fixed z-[9001] flex flex-col overflow-hidden rounded-2xl border border-border/10 shadow-float animate-scale-in",
            isDragging || isResizing ? "cursor-grabbing" : ""
          )}
          style={{
            left: `calc(50% + ${position.x}px)`,
            top: `calc(50% + ${position.y}px)`,
            width: `${size.width}vw`,
            height: `${size.height}vh`,
            transform: "translate(-50%, -50%)",
            maxWidth: "95vw",
            maxHeight: "95vh",
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header - Draggable */}
          <div
            className="flex shrink-0 items-center gap-3 border-b border-border/10 px-4 py-2.5 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4 text-muted/40 flex-shrink-0" />
            <Dialog.Title className="min-w-0 flex-1 truncate text-sm font-medium text-text">
              {node.name}
            </Dialog.Title>
            <span className="hidden text-xs text-muted sm:block">{formatBytes(node.size)}</span>
            <button
              onClick={() => onDownload(node)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/10 bg-glass/40 px-2.5 text-xs text-text hover:bg-glass/70"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-muted hover:bg-glass/60 hover:text-text" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="relative flex flex-1 items-center justify-center overflow-auto bg-bg/40 p-4">
            {/* Prev / Next */}
            {prev && (
              <button
                onClick={() => onSelect(prev)}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-glass/70 p-2 text-text hover:bg-glass shadow-float"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {next && (
              <button
                onClick={() => onSelect(next)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-glass/70 p-2 text-text hover:bg-glass shadow-float"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            ) : error ? (
              <Unavailable name={node.name} />
            ) : kind === "image" && url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={node.name} className="max-h-full max-w-full rounded-lg object-contain" />
            ) : kind === "pdf" && url ? (
              <iframe src={url} title={node.name} className="h-full w-full rounded-lg bg-white" />
            ) : kind === "video" && url ? (
              <video src={url} controls className="max-h-full max-w-full rounded-lg" />
            ) : kind === "audio" && url ? (
              <div className="flex w-full max-w-md flex-col items-center gap-4">
                <div className="accent-gradient flex h-24 w-24 items-center justify-center rounded-2xl text-3xl">
                  🎵
                </div>
                <audio src={url} controls className="w-full" />
              </div>
            ) : kind === "markdown" && text !== null ? (
              <div className="h-full w-full max-w-3xl overflow-auto rounded-lg bg-glass/20 p-6">
                <Markdown content={text} />
              </div>
            ) : kind === "text" && text !== null ? (
              <pre className="h-full w-full overflow-auto rounded-lg bg-[#0a0d18] p-4 font-mono text-xs leading-relaxed text-[#cfe2ff]">
                {text}
              </pre>
            ) : (
              <Unavailable name={node.name} noPreview />
            )}
          </div>

          {/* Footer position indicator */}
          {previewable.length > 1 && index >= 0 && (
            <div className="shrink-0 border-t border-border/10 px-4 py-1.5 text-center text-[11px] text-muted">
              {index + 1} of {previewable.length}
            </div>
          )}

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-accent/30 hover:bg-accent/60 cursor-se-resize rounded-tl-lg transition-colors"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Unavailable({ name, noPreview }: { name: string; noPreview?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center text-muted")}>
      <FileQuestion className="h-12 w-12 text-muted/60" />
      <div className="text-sm text-text">{name}</div>
      <div className="max-w-xs text-xs">
        {noPreview
          ? "No inline preview for this file type. Use Download to open it."
          : "Content isn't available on this device yet. Try again once it syncs, or re-upload."}
      </div>
    </div>
  );
}
