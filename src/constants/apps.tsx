import dynamic from "next/dynamic";
import {
  Bot,
  CalendarDays,
  Code2,
  FolderOpen,
  Globe,
  LayoutDashboard,
  Settings as SettingsIcon,
  StickyNote,
} from "lucide-react";
import type { AppDefinition, AppId } from "@/types/app";
import { AppSkeleton } from "@/components/shell/AppSkeleton";

/**
 * Lazily import each app so its bundle is only fetched when the window opens.
 * `ssr: false` because these are rich client apps (Monaco, canvases, etc.).
 */
const loader = (importer: Parameters<typeof dynamic>[0]) =>
  dynamic(importer, { ssr: false, loading: () => <AppSkeleton /> });

const AIAssistant = loader(() => import("@/features/ai-assistant"));
const CodeStudio = loader(() => import("@/features/code-studio"));
const Notes = loader(() => import("@/features/notes"));
const FileManager = loader(() => import("@/features/file-manager"));
const Browser = loader(() => import("@/features/browser"));
const Calendar = loader(() => import("@/features/calendar"));
const Dashboard = loader(() => import("@/features/dashboard"));
const Settings = loader(() => import("@/features/settings"));

/** Central registry describing every installed application. */
export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  "ai-assistant": {
    id: "ai-assistant",
    name: "Assistant",
    description: "Your AI copilot — chat, code, summarize",
    icon: Bot,
    accent: "from-sky-400 to-violet-500",
    defaultSize: { width: 720, height: 640 },
    minSize: { width: 380, height: 420 },
    inDock: true,
    component: AIAssistant,
  },
  "code-studio": {
    id: "code-studio",
    name: "Code Studio",
    description: "Editor with live HTML/CSS/JS preview",
    icon: Code2,
    accent: "from-emerald-400 to-cyan-500",
    defaultSize: { width: 1040, height: 700 },
    minSize: { width: 520, height: 400 },
    inDock: true,
    component: CodeStudio,
  },
  notes: {
    id: "notes",
    name: "Notes",
    description: "Markdown notes with autosave",
    icon: StickyNote,
    accent: "from-amber-300 to-orange-500",
    defaultSize: { width: 860, height: 620 },
    minSize: { width: 480, height: 360 },
    inDock: true,
    component: Notes,
  },
  dashboard: {
    id: "dashboard",
    name: "Dashboard",
    description: "Widgets, stats & productivity",
    icon: LayoutDashboard,
    accent: "from-fuchsia-400 to-pink-500",
    defaultSize: { width: 980, height: 660 },
    minSize: { width: 520, height: 420 },
    inDock: true,
    component: Dashboard,
  },
  "file-manager": {
    id: "file-manager",
    name: "Files",
    description: "Browse & manage your files",
    icon: FolderOpen,
    accent: "from-blue-400 to-indigo-500",
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 480, height: 360 },
    inDock: true,
    component: FileManager,
  },
  browser: {
    id: "browser",
    name: "Browser",
    description: "Tabbed web browser with bookmarks & history",
    icon: Globe,
    accent: "from-teal-400 to-sky-500",
    defaultSize: { width: 1100, height: 740 },
    minSize: { width: 560, height: 420 },
    inDock: true,
    component: Browser,
  },
  calendar: {
    id: "calendar",
    name: "Calendar",
    description: "Events, reminders & planning",
    icon: CalendarDays,
    accent: "from-rose-400 to-red-500",
    defaultSize: { width: 920, height: 640 },
    minSize: { width: 520, height: 420 },
    inDock: true,
    component: Calendar,
  },
  settings: {
    id: "settings",
    name: "Settings",
    description: "Theme, accent & performance",
    icon: SettingsIcon,
    accent: "from-slate-300 to-slate-500",
    defaultSize: { width: 820, height: 600 },
    minSize: { width: 460, height: 400 },
    inDock: true,
    component: Settings,
  },
};

/** Ordered list of apps for the dock. */
export const DOCK_APPS: AppId[] = [
  "ai-assistant",
  "code-studio",
  "notes",
  "dashboard",
  "file-manager",
  "browser",
  "calendar",
  "settings",
];

export const ALL_APPS: AppDefinition[] = Object.values(APP_REGISTRY);
