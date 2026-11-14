/**
 * API data-transfer shapes shared between the server services and the client
 * API layer. These are client-safe (no server-only imports) and mirror the
 * existing store/feature shapes so hydration is a direct assignment.
 */
import type { Settings } from "./settings";
import type { NoteFolder } from "./notes";
import type { WindowInstance } from "./window";
import type { ChatMessage } from "./ai";
import type { NotificationKind } from "@/store/useNotificationStore";

/** Authenticated user's profile (mirrors AuthUser, with uid). */
export interface UserProfileDTO {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providers: string[];
}

/** Settings payload — exactly the client `Settings` shape. */
export type SettingsDTO = Settings;

export interface NoteDTO {
  id: string;
  folderId: string;
  folderName: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/** GET /api/notes returns notes plus their derived folder list. */
export interface NotesPayload {
  notes: NoteDTO[];
  folders: NoteFolder[];
}

export interface EventDTO {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string; // HH:mm
  color: string;
}

export interface LayoutDTO {
  windows: WindowInstance[];
  topZ: number;
}

export interface InstalledAppDTO {
  appId: string;
  inDock: boolean;
  position: number;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: number;
}

export interface ChatDTO {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface FileDTO {
  id: string;
  name: string;
  /** "file" or "folder" — folders have size 0 and type "folder". */
  kind: "file" | "folder";
  /** Parent folder id, or null when at the root. */
  parentId: string | null;
  size: number;
  type: string;
  starred: boolean;
  favorite: boolean;
  shared: boolean;
  trashed: boolean;
  trashedAt: number | null;
  /** Backblaze B2 object refs (present once bytes are uploaded). */
  b2FileId: string | null;
  b2FileName: string | null;
  storageKey: string | null;
  /** Small data-URL thumbnail (images only). */
  thumbnail: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface RecentFileDTO {
  fileId: string;
  name: string;
  type: string;
  accessedAt: number;
}
