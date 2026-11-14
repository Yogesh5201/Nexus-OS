import "server-only";

/**
 * Desktop layout service — persists/loads the window manager snapshot (window
 * geometry + z-order) for a user.
 */
import { layoutRepository } from "@/server/repositories/layout.repository";
import type { LayoutDoc } from "@/server/schemas/layout.schema";
import { asObject, asArray, requireNumber } from "@/server/validation";
import type { LayoutDTO } from "@/types/api";
import type { WindowInstance } from "@/types/window";

const EMPTY: LayoutDTO = { windows: [], topZ: 10 };

export const layoutService = {
  async get(uid: string): Promise<LayoutDTO> {
    const doc = await layoutRepository.get(uid);
    if (!doc) return { ...EMPTY };
    return { windows: doc.windows as unknown as WindowInstance[], topZ: doc.topZ };
  },

  /** Replace the user's layout snapshot. */
  async replace(uid: string, body: unknown): Promise<LayoutDTO> {
    const input = asObject(body);
    const windows = asArray(input.windows, "windows") as Record<string, unknown>[];
    const topZ = requireNumber(input.topZ ?? 10, "topZ", { min: 0 });
    const payload: Omit<LayoutDoc, "_id"> = {
      windows,
      topZ,
      updatedAt: Date.now(),
    };
    await layoutRepository.upsert(uid, payload);
    return { windows: windows as unknown as WindowInstance[], topZ };
  },
};
