"use client";

import { Markdown } from "@/components/ui/Markdown";

/** Rendered Markdown preview (reuses the shared Nexus Markdown renderer). */
export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      {content.trim() ? (
        <Markdown content={content} />
      ) : (
        <p className="text-sm text-muted/60">Empty document.</p>
      )}
    </div>
  );
}
