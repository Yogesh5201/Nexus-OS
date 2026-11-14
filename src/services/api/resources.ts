"use client";

/**
 * Typed API resource methods, grouped by domain. Thin wrappers over `apiFetch`
 * that the sync engine (and any feature) can call without repeating paths.
 */
import { apiFetch } from "./client";
import type {
  ChatDTO,
  EventDTO,
  FileDTO,
  InstalledAppDTO,
  LayoutDTO,
  NotesPayload,
  NoteDTO,
  NotificationDTO,
  RecentFileDTO,
  SettingsDTO,
  UserProfileDTO,
} from "@/types/api";

export const meApi = {
  get: () => apiFetch<UserProfileDTO>("/me"),
  update: (body: Partial<Pick<UserProfileDTO, "displayName" | "photoURL">>) =>
    apiFetch<UserProfileDTO>("/me", { method: "PUT", body }),
};

export const settingsApi = {
  get: () => apiFetch<SettingsDTO>("/settings"),
  replace: (body: SettingsDTO) => apiFetch<SettingsDTO>("/settings", { method: "PUT", body }),
};

export const layoutApi = {
  get: () => apiFetch<LayoutDTO>("/layout"),
  replace: (body: LayoutDTO) => apiFetch<LayoutDTO>("/layout", { method: "PUT", body }),
};

export const notesApi = {
  list: () => apiFetch<NotesPayload>("/notes"),
  create: (body: Partial<NoteDTO>) => apiFetch<NoteDTO>("/notes", { method: "POST", body }),
  update: (id: string, body: Partial<NoteDTO>) =>
    apiFetch<NoteDTO>(`/notes/${id}`, { method: "PUT", body }),
  remove: (id: string) => apiFetch(`/notes/${id}`, { method: "DELETE" }),
  replaceAll: (notes: NoteDTO[]) => apiFetch<NotesPayload>("/notes", { method: "PUT", body: notes }),
};

export const eventsApi = {
  list: () => apiFetch<EventDTO[]>("/events"),
  replaceAll: (events: EventDTO[]) => apiFetch<EventDTO[]>("/events", { method: "PUT", body: events }),
};

export const appsApi = {
  list: () => apiFetch<InstalledAppDTO[]>("/apps"),
  replaceAll: (apps: InstalledAppDTO[]) =>
    apiFetch<InstalledAppDTO[]>("/apps", { method: "PUT", body: apps }),
};

export const notificationsApi = {
  list: () => apiFetch<NotificationDTO[]>("/notifications"),
  markAllRead: () => apiFetch("/notifications", { method: "PATCH" }),
  replaceAll: (items: NotificationDTO[]) =>
    apiFetch<NotificationDTO[]>("/notifications", { method: "PUT", body: items }),
};

export const chatsApi = {
  list: () => apiFetch<ChatDTO[]>("/chats"),
  replaceAll: (chats: ChatDTO[]) => apiFetch<ChatDTO[]>("/chats", { method: "PUT", body: chats }),
};

export const filesApi = {
  list: () => apiFetch<FileDTO[]>("/files"),
  replaceAll: (files: FileDTO[]) => apiFetch<FileDTO[]>("/files", { method: "PUT", body: files }),
  /** Permanently delete a file's metadata + its B2 object (frees cloud bytes). */
  remove: (id: string) => apiFetch(`/files/${id}`, { method: "DELETE" }),
};

export const recentFilesApi = {
  list: () => apiFetch<RecentFileDTO[]>("/recent-files"),
  record: (entry: RecentFileDTO) =>
    apiFetch<RecentFileDTO[]>("/recent-files", { method: "POST", body: entry }),
  replaceAll: (items: RecentFileDTO[]) =>
    apiFetch<RecentFileDTO[]>("/recent-files", { method: "PUT", body: items }),
};
