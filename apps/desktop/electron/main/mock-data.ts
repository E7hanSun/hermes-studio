import type { MemoryDocument, Profile, Settings, Space } from "@hermes-studio/bridge";

export const profiles: Profile[] = [
  {
    id: "coder",
    name: "coder",
    model: "GPT-5.4 Mini",
    description: "Focused software development profile",
    homePath: "~/.hermes/profiles/coder",
    command: "coder",
    skillsCount: 18,
    cronJobsCount: 2,
    gatewayEnabled: false
  },
  {
    id: "researcher",
    name: "researcher",
    model: "GPT-5.4",
    description: "Research and synthesis profile",
    homePath: "~/.hermes/profiles/researcher",
    command: "researcher",
    skillsCount: 11,
    cronJobsCount: 1,
    gatewayEnabled: true
  },
  {
    id: "assistant",
    name: "assistant",
    model: "GPT-5.4 Mini",
    description: "General-purpose personal assistant",
    homePath: "~/.hermes/profiles/assistant",
    command: "assistant",
    skillsCount: 7,
    cronJobsCount: 4,
    gatewayEnabled: true
  }
];

export const spaces: Space[] = [
  {
    id: "home",
    name: "Home",
    path: "/Users/ember/workspace"
  },
  {
    id: "hermes-studio",
    name: "hermes-studio",
    path: "/Users/ember/code/hermes-studio"
  }
];

export const memoryDocuments: MemoryDocument[] = [
  {
    key: "notes",
    title: "My Notes",
    description: "Agent notes for environment facts, project conventions, and lessons learned.",
    fileName: "MEMORY.md",
    path: "~/.hermes/memories/MEMORY.md",
    content:
      "Hermes Studio is an Electron desktop client for Hermes Agent.\n§\nProject uses pnpm workspaces with apps/desktop and packages/bridge.\n§\nUser prefers explicit approval before commits and pushes.",
    updatedAt: "2026-04-24T08:00:00.000Z"
  },
  {
    key: "profile",
    title: "User Profile",
    description: "User preferences, communication style, expectations, and workflow habits.",
    fileName: "USER.md",
    path: "~/.hermes/memories/USER.md",
    content:
      "User works in Chinese for Hermes Studio planning and implementation.\n§\nUser wants practical next steps and prefers the app to follow the current restrained desktop style.",
    updatedAt: "2026-04-24T08:00:00.000Z"
  }
];

export const settings: Settings = {
  theme: "light",
  defaultModel: "GPT-5.4 Mini",
  enableVoice: false
};
