"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Generic drag-to-resize handle.
 *
 * Reports an absolute value (`getValue()` at drag start + signed pointer delta)
 * back through `setValue`. Used for the sidebar width and bottom-panel height;
 * the consumer's setter is responsible for clamping.
 *
 * `sign` maps a positive pointer delta to a value change:
 *   +1 — dragging right/down grows the value (e.g. sidebar right edge)
 *   -1 — dragging up/left grows the value (e.g. panel top edge)
 */
export function useResizable(config: {
  axis: "x" | "y";
  getValue: () => number;
  setValue: (v: number) => void;
  sign?: 1 | -1;
}) {
  const { axis, getValue, setValue, sign = 1 } = config;
  const [dragging, setDragging] = useState(false);
  const startPos = useRef(0);
  const startVal = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startPos.current = axis === "x" ? e.clientX : e.clientY;
      startVal.current = getValue();
      setDragging(true);

      const prevCursor = document.body.style.cursor;
      const prevSelect = document.body.style.userSelect;
      document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: PointerEvent) => {
        const now = axis === "x" ? ev.clientX : ev.clientY;
        setValue(startVal.current + (now - startPos.current) * sign);
      };
      const onUp = () => {
        setDragging(false);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevSelect;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [axis, getValue, setValue, sign]
  );

  return { dragging, onPointerDown };
}
