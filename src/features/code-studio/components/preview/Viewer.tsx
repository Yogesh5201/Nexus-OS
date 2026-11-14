"use client";

import { extOf, languageOf } from "../../data/languages";
import type { VNode } from "../../types";
import MarkdownViewer from "./viewers/MarkdownViewer";
import JsonViewer from "./viewers/JsonViewer";
import CsvViewer from "./viewers/CsvViewer";
import ImageViewer from "./viewers/ImageViewer";

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "bmp", "ico"]);

export type ViewKind = "markdown" | "json" | "csv" | "image";

/** The rich-preview kind for a file, or null when it isn't viewable. */
export function viewKind(name: string): ViewKind | null {
  const lang = languageOf(name);
  const ext = extOf(name);
  if (lang === "markdown") return "markdown";
  if (lang === "json") return "json";
  if (ext === "csv") return "csv";
  if (IMAGE_EXTS.has(ext)) return "image";
  return null;
}

const LABELS: Record<ViewKind, string> = {
  markdown: "Markdown",
  json: "JSON",
  csv: "CSV",
  image: "Image",
};

/** Human label for the preview header, e.g. "Markdown". */
export function viewLabel(name: string): string {
  const kind = viewKind(name);
  return kind ? LABELS[kind] : "Preview";
}

/** Render the appropriate rich viewer for a viewable file. */
export default function Viewer({ node }: { node: VNode }) {
  const kind = viewKind(node.name);
  const content = node.content ?? "";
  switch (kind) {
    case "markdown":
      return <MarkdownViewer content={content} />;
    case "json":
      return <JsonViewer content={content} />;
    case "csv":
      return <CsvViewer content={content} />;
    case "image":
      return <ImageViewer name={node.name} content={content} />;
    default:
      return null;
  }
}
