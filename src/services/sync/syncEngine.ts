"use client";

/**
 * Client sync engine.
 *
 * When a user is authenticated, this pulls their data from the API (Mongo) into
 * the existing zustand stores, then subscribes to each store and debounce-pushes
 * a full snapshot back on every change. Guest/offline users never start the
 * engine, so localStorage remains the source of truth exactly as before.
 *
 * Echo-safety: pulls run BEFORE any subscription is attached, and each watcher
 * seeds its "last pushed" baseline from the freshly-hydrated state — so hydration
 * never triggers a spurious push back to the server.
 */
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotesStore } from "@/store/useNotesStore";
import { useChatStore } from "@/store/useChatStore";
import { useWindowStore } from "@/store/useWindowStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useFilesStore } from "@/store/useFilesStore";
import { useRecentFilesStore } from "@/store/useRecentFilesStore";
import { useAppsStore } from "@/store/useAppsStore";
import {
  settingsApi,
  notesApi,
  chatsApi,
  layoutApi,
  notificationsApi,
  eventsApi,
  filesApi,
  recentFilesApi,
  appsApi,
} from "@/services/api/resources";
import type { Note } from "@/types/notes";
import type { Conversation } from "@/types/ai";
import type { WindowInstance } from "@/types/window";
import type { NoteDTO } from "@/types/api";

const PUSH_DELAY = 800;

let active = false;
let hydrating = false;
const unsubs: Array<() => void> = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSig = new Map<string, unknown>();

/** Debounce a push by key so rapid edits coalesce into one request. */
function schedule(key: string, fn: () => Promise<unknown>) {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      fn().catch((err) =>
        console.warn(`[sync] push "${key}" failed:`, err?.message ?? err)
      );
    }, PUSH_DELAY)
  );
}

interface VanillaStore<T> {
  getState: () => T;
  subscribe: (listener: (state: T, prev: T) => void) => () => void;
}

/**
 * Watch a store slice and push on change. `sig` produces the value compared
 * across updates (reference identity by default; arrays change ref only on real
 * edits, so this is both cheap and correct).
 */
function watch<T, S>(
  key: string,
  store: VanillaStore<T>,
  select: (s: T) => S,
  push: (slice: S) => Promise<unknown>,
  sig: (slice: S) => unknown = (x) => x
) {
  lastSig.set(key, sig(select(store.getState())));
  const unsub = store.subscribe((state) => {
    if (hydrating) return;
    const slice = select(state);
    const signature = sig(slice);
    if (signature === lastSig.get(key)) return;
    lastSig.set(key, signature);
    schedule(key, () => push(slice));
  });
  unsubs.push(unsub);
}

// ---- DTO <-> store mappers ------------------------------------------------

const noteDtoToNote = (d: NoteDTO): Note => ({
  id: d.id,
  folderId: d.folderId,
  title: d.title,
  content: d.content,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

// ---- Pull (server -> stores) ----------------------------------------------

async function pullAll(): Promise<void> {
  const [settings, notes, chats, layout, notifications, events, files, recent, apps] =
    await Promise.all([
      settingsApi.get(),
      notesApi.list(),
      chatsApi.list(),
      layoutApi.get(),
      notificationsApi.list(),
      eventsApi.list(),
      filesApi.list(),
      recentFilesApi.list(),
      appsApi.list(),
    ]);

  hydrating = true;
  try {
    useSettingsStore.setState(settings);

    const mappedNotes = notes.notes.map(noteDtoToNote);
    useNotesStore.setState((s) => ({
      notes: mappedNotes,
      folders: notes.folders.length ? notes.folders : s.folders,
      activeNoteId:
        mappedNotes.find((n) => n.id === s.activeNoteId)?.id ?? mappedNotes[0]?.id ?? null,
    }));

    useChatStore.setState((s) => ({
      conversations: chats as Conversation[],
      activeId: chats.find((c) => c.id === s.activeId)?.id ?? chats[0]?.id ?? null,
    }));

    useWindowStore.setState({
      windows: layout.windows as WindowInstance[],
      topZ: layout.topZ,
    });

    useNotificationStore.setState({ notifications });
    useCalendarStore.setState({ events });
    useFilesStore.setState({
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        kind: f.kind ?? "file",
        parentId: f.parentId ?? null,
        size: f.size,
        type: f.type,
        starred: f.starred ?? false,
        favorite: f.favorite ?? false,
        shared: f.shared ?? false,
        trashed: f.trashed ?? false,
        trashedAt: f.trashedAt ?? null,
        b2FileId: f.b2FileId ?? null,
        b2FileName: f.b2FileName ?? null,
        storageKey: f.storageKey ?? null,
        thumbnail: f.thumbnail ?? null,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    });
    useRecentFilesStore.setState({ recent });
    useAppsStore.setState({ apps });
  } finally {
    hydrating = false;
  }
}

// ---- Subscribe (stores -> server) -----------------------------------------

function subscribeAll(): void {
  watch(
    "settings",
    useSettingsStore,
    (s) => ({
      theme: s.theme,
      accentId: s.accentId,
      performance: s.performance,
      animationsEnabled: s.animationsEnabled,
      reducedTransparency: s.reducedTransparency,
      wallpaperEnabled: s.wallpaperEnabled,
      displayName: s.displayName,
    }),
    (dto) => settingsApi.replace(dto),
    (dto) => JSON.stringify(dto)
  );

  watch(
    "notes",
    useNotesStore,
    (s) => ({ notes: s.notes, folders: s.folders }),
    ({ notes, folders }) => {
      const folderName = (fid: string) =>
        folders.find((f) => f.id === fid)?.name ?? fid;
      const dtos: NoteDTO[] = notes.map((n) => ({
        id: n.id,
        folderId: n.folderId,
        folderName: folderName(n.folderId),
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
      return notesApi.replaceAll(dtos);
    },
    ({ notes }) => notes
  );

  watch(
    "chats",
    useChatStore,
    (s) => s.conversations,
    (conversations) => chatsApi.replaceAll(conversations),
    // Push only on structural changes, not on each streamed token.
    (cs) => cs.map((c) => `${c.id}:${c.updatedAt}:${c.messages.length}`).join("|")
  );

  watch(
    "layout",
    useWindowStore,
    (s) => ({ windows: s.windows, topZ: s.topZ }),
    ({ windows, topZ }) => layoutApi.replace({ windows, topZ }),
    ({ windows, topZ }) => `${topZ}:${windows.length}:${windows.map((w) => `${w.id}${w.z}${Math.round(w.rect.x)}${Math.round(w.rect.y)}${Math.round(w.rect.width)}${Math.round(w.rect.height)}${w.state}`).join()}`
  );

  watch(
    "notifications",
    useNotificationStore,
    (s) => s.notifications,
    (notifications) =>
      notificationsApi.replaceAll(
        notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message ?? "",
          kind: n.kind,
          read: n.read,
          createdAt: n.createdAt,
        }))
      )
  );

  watch(
    "events",
    useCalendarStore,
    (s) => s.events,
    (events) => eventsApi.replaceAll(events)
  );

  watch(
    "files",
    useFilesStore,
    (s) => s.files,
    (files) =>
      filesApi.replaceAll(
        files.map((f) => ({
          id: f.id,
          name: f.name,
          kind: f.kind,
          parentId: f.parentId,
          size: f.size,
          type: f.type,
          starred: f.starred,
          favorite: f.favorite,
          shared: f.shared,
          trashed: f.trashed,
          trashedAt: f.trashedAt,
          b2FileId: f.b2FileId,
          b2FileName: f.b2FileName,
          storageKey: f.storageKey,
          thumbnail: f.thumbnail,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        }))
      )
  );

  watch(
    "recent",
    useRecentFilesStore,
    (s) => s.recent,
    (recent) => recentFilesApi.replaceAll(recent)
  );

  watch(
    "apps",
    useAppsStore,
    (s) => s.apps,
    (apps) => appsApi.replaceAll(apps)
  );
}

// ---- Lifecycle ------------------------------------------------------------

/** Begin syncing for an authenticated user (pull, then push-on-change). */
export async function startSync(): Promise<void> {
  if (active) return;
  active = true;
  try {
    await pullAll();
    subscribeAll();
  } catch (err) {
    // Backend unconfigured/unreachable → stay offline (localStorage) silently.
    active = false;
    console.warn(
      "[sync] disabled — using local data only:",
      (err as Error)?.message ?? err
    );
  }
}

/** Stop syncing (sign-out / guest). Stores keep their current local data. */
export function stopSync(): void {
  active = false;
  unsubs.forEach((u) => u());
  unsubs.length = 0;
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  lastSig.clear();
}
