"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";

/** Shared slide-in panel shell used by Bookmarks/History/Downloads/Settings. */
export function SidePanel({
  title,
  icon: Icon,
  onClose,
  children,
}: {
  title: string;
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      {/* Click-away scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 z-30 bg-black/30"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="glass-strong absolute right-0 top-0 z-40 flex h-full w-80 max-w-[90%] flex-col border-l border-border/10 shadow-2xl"
      >
        <header className="flex items-center gap-2 border-b border-border/10 px-4 py-3">
          <Icon className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-muted transition hover:bg-glass hover:text-text"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-2">{children}</div>
      </motion.aside>
    </>
  );
}

/** Empty-state placeholder for a panel. */
export function PanelEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-muted/50" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
