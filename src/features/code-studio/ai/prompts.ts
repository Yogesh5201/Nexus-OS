/**
 * AI code-action registry. Each action turns the current code context into a
 * prompt for the chat endpoint. "insight" actions explain/review (read-only);
 * "code" actions return modified code that can be applied back to the editor.
 */
import {
  Bug,
  FileText,
  Gauge,
  GraduationCap,
  ScanSearch,
  Sparkles,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export type ActionKind = "insight" | "code";

export interface AiAction {
  id: string;
  label: string;
  icon: LucideIcon;
  kind: ActionKind;
  build: (ctx: CodeContext) => string;
}

export interface CodeContext {
  code: string;
  language: string;
  fileName: string;
  fromSelection: boolean;
}

const fence = (ctx: CodeContext) => `\`\`\`${ctx.language}\n${ctx.code}\n\`\`\``;
const scope = (ctx: CodeContext) => (ctx.fromSelection ? "selected" : `\`${ctx.fileName}\``);

const CODE_RULE =
  "Return ONLY the complete updated code in a single fenced code block, with no prose before or after.";

export const AI_ACTIONS: AiAction[] = [
  {
    id: "explain",
    label: "Explain",
    icon: GraduationCap,
    kind: "insight",
    build: (c) =>
      `Explain what the ${scope(c)} ${c.language} code does, step by step and concisely:\n\n${fence(c)}`,
  },
  {
    id: "review",
    label: "Review",
    icon: ScanSearch,
    kind: "insight",
    build: (c) =>
      `Review the ${scope(c)} ${c.language} code. List concrete issues grouped as Bugs, Security, Performance, and Style, then a short summary:\n\n${fence(c)}`,
  },
  {
    id: "fix",
    label: "Fix bugs",
    icon: Bug,
    kind: "code",
    build: (c) =>
      `Find and fix bugs in the following ${c.language} code. Preserve intended behaviour. ${CODE_RULE}\n\n${fence(c)}`,
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: Wand2,
    kind: "code",
    build: (c) =>
      `Refactor the following ${c.language} code for readability and maintainability without changing behaviour. ${CODE_RULE}\n\n${fence(c)}`,
  },
  {
    id: "optimize",
    label: "Optimize",
    icon: Gauge,
    kind: "code",
    build: (c) =>
      `Optimize the following ${c.language} code for performance, keeping behaviour identical. Briefly note the key change as a trailing comment. ${CODE_RULE}\n\n${fence(c)}`,
  },
  {
    id: "docs",
    label: "Add docs",
    icon: FileText,
    kind: "code",
    build: (c) =>
      `Add clear documentation comments (and inline comments where helpful) to the following ${c.language} code. Do not change the logic. ${CODE_RULE}\n\n${fence(c)}`,
  },
  {
    id: "tests",
    label: "Gen tests",
    icon: Sparkles,
    kind: "code",
    build: (c) =>
      `Write thorough unit tests for the following ${c.language} code using an idiomatic testing framework for that language. ${CODE_RULE}\n\n${fence(c)}`,
  },
];

export function getAction(id: string): AiAction | undefined {
  return AI_ACTIONS.find((a) => a.id === id);
}
