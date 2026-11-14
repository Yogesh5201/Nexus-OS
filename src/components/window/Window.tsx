"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useWindowStore } from "@/store/useWindowStore";
import { APP_REGISTRY } from "@/constants/apps";
import type { SnapZone, WindowInstance } from "@/types/window";
import { clamp } from "@/lib/utils";
import { WindowControls } from "./WindowControls";

const TASKBAR_H = 44;
const EDGE = 28; // px threshold for snap detection

/** Resize handle definitions: [className, cursor, axes]. */
const HANDLES = [
  { pos: "top", cls: "top-0 left-0 right-0 h-1.5 cursor-ns-resize" },
  { pos: "bottom", cls: "bottom-0 left-0 right-0 h-1.5 cursor-ns-resize" },
  { pos: "left", cls: "top-0 bottom-0 left-0 w-1.5 cursor-ew-resize" },
  { pos: "right", cls: "top-0 bottom-0 right-0 w-1.5 cursor-ew-resize" },
  { pos: "top-left", cls: "top-0 left-0 h-3 w-3 cursor-nwse-resize" },
  { pos: "top-right", cls: "top-0 right-0 h-3 w-3 cursor-nesw-resize" },
  { pos: "bottom-left", cls: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize" },
  { pos: "bottom-right", cls: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize" },
] as const;

export function Window({ win }: { win: WindowInstance }) {
  const def = APP_REGISTRY[win.appId];
  const { focus, move, resize, close, minimize, toggleMaximize, setSnapPreview, applySnap } =
    useWindowStore();

  const dragState = useRef<{ dx: number; dy: number } | null>(null);
  const pendingSnap = useRef<SnapZone>(null);
  const AppComponent = def.component;

  /** Detect a snap zone from the pointer's viewport position. */
  const detectSnap = useCallback((px: number, py: number): SnapZone => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nearTop = py <= TASKBAR_H + EDGE;
    const nearLeft = px <= EDGE;
    const nearRight = px >= w - EDGE;
    if (nearTop && nearLeft) return "top-left";
    if (nearTop && nearRight) return "top-right";
    if (nearLeft) return "left";
    if (nearRight) return "right";
    if (nearTop) return "top"; // maximize-ish (full work area)
    if (py >= h - EDGE && nearLeft) return "bottom-left";
    if (py >= h - EDGE && nearRight) return "bottom-right";
    return null;
  }, []);

  // ---- Title bar dragging --------------------------------------------------
  const onDragPointerDown = (e: React.PointerEvent) => {
    if (win.state === "maximized") return;
    e.preventDefault();
    focus(win.id);
    dragState.current = { dx: e.clientX - win.rect.x, dy: e.clientY - win.rect.y };

    const onMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const x = clamp(ev.clientX - dragState.current.dx, -win.rect.width + 80, window.innerWidth - 80);
      const y = clamp(ev.clientY - dragState.current.dy, TASKBAR_H, window.innerHeight - 60);
      move(win.id, x, y);
      const zone = detectSnap(ev.clientX, ev.clientY);
      pendingSnap.current = zone;
      setSnapPreview(zone);
    };
    const onUp = () => {
      if (pendingSnap.current) applySnap(win.id, pendingSnap.current);
      pendingSnap.current = null;
      setSnapPreview(null);
      dragState.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ---- Edge / corner resizing ----------------------------------------------
  const onResizePointerDown = (e: React.PointerEvent, pos: string) => {
    e.preventDefault();
    e.stopPropagation();
    focus(win.id);
    // px/py = pointer origin; r = the window rect at drag start.
    const px = e.clientX;
    const py = e.clientY;
    const r = { ...win.rect };
    const min = def.minSize ?? { width: 320, height: 240 };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - px;
      const dy = ev.clientY - py;
      let { x, y, width, height } = r;

      if (pos.includes("right")) width = Math.max(min.width, r.width + dx);
      if (pos.includes("bottom")) height = Math.max(min.height, r.height + dy);
      if (pos.includes("left")) {
        width = Math.max(min.width, r.width - dx);
        x = r.x + (r.width - width);
      }
      if (pos.includes("top")) {
        height = Math.max(min.height, r.height - dy);
        y = r.y + (r.height - height);
      }
      resize(win.id, { x, y, width, height });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <motion.div
      role="dialog"
      aria-label={win.title}
      initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      onPointerDown={() => focus(win.id)}
      className="glass-strong pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl shadow-float"
      style={{
        left: win.rect.x,
        top: win.rect.y,
        width: win.rect.width,
        height: win.rect.height,
        zIndex: win.z,
      }}
    >
      {/* Title bar */}
      <div
        onPointerDown={onDragPointerDown}
        onDoubleClick={() => toggleMaximize(win.id)}
        className="flex h-10 shrink-0 cursor-grab items-center gap-3 border-b border-border/10 px-3.5 active:cursor-grabbing"
      >
        <WindowControls
          onClose={() => close(win.id)}
          onMinimize={() => minimize(win.id)}
          onMaximize={() => toggleMaximize(win.id)}
        />
        <div className="flex flex-1 items-center justify-center gap-2 select-none">
          <def.icon className="h-3.5 w-3.5 text-muted" />
          <span className="text-xs font-medium text-muted">{win.title}</span>
        </div>
        {/* Spacer to balance the traffic lights for centred title */}
        <div className="w-[52px]" />
      </div>

      {/* App content */}
      <div className="relative flex-1 overflow-hidden">
        <AppComponent />
      </div>

      {/* Resize handles (hidden when maximized) */}
      {win.state !== "maximized" &&
        HANDLES.map((h) => (
          <div
            key={h.pos}
            onPointerDown={(e) => onResizePointerDown(e, h.pos)}
            className={`absolute z-10 ${h.cls}`}
          />
        ))}
    </motion.div>
  );
}
