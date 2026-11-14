import type { AppId } from "./app";

/** Lifecycle state of a window. */
export type WindowState = "normal" | "minimized" | "maximized";

/** Edge/corner snap zones for snap-layout tiling. */
export type SnapZone =
  | "left"
  | "right"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | null;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A live window instance managed by the window manager. */
export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  rect: Rect;
  /** Geometry to restore to after un-maximizing / un-snapping. */
  prevRect: Rect | null;
  z: number;
  state: WindowState;
  snap: SnapZone;
  createdAt: number;
}
