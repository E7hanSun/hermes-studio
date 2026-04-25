import type { HubSkill, InstalledSkill, MemoryDocument, Profile, ScheduledJob, Settings, Space } from "@hermes-studio/bridge";

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

export const installedSkills: InstalledSkill[] = [
  {
    id: "hermes-agent",
    name: "hermes-agent",
    description: "Complete guide to using and extending Hermes Agent.",
    category: "AI Agents",
    source: "built-in",
    trustLevel: "builtin",
    enabled: true,
    slashCommand: "/hermes-agent",
    path: "~/.hermes/skills/ai-agents/hermes-agent/SKILL.md",
    tags: ["hermes", "setup", "configuration"],
    updatedAt: "2026-04-23T12:00:00.000Z",
    contentPreview:
      "---\nname: hermes-agent\ndescription: Complete guide to using and extending Hermes Agent.\n---\n\n# Hermes Agent\n\nUse when configuring Hermes, troubleshooting setup, or extending the agent."
  },
  {
    id: "plan",
    name: "plan",
    description: "Plan mode for Hermes. Inspect context, write a markdown implementation plan, and do not execute the work.",
    category: "Software Dev",
    source: "built-in",
    trustLevel: "builtin",
    enabled: true,
    slashCommand: "/plan",
    path: "~/.hermes/skills/software-dev/plan/SKILL.md",
    tags: ["planning", "software-dev"],
    updatedAt: "2026-04-23T12:00:00.000Z",
    contentPreview:
      "---\nname: plan\ndescription: Plan mode for Hermes.\n---\n\n# Plan\n\nUse when the user wants a design or implementation plan before code changes."
  },
  {
    id: "code-review",
    name: "code-review",
    description: "Guidelines for performing thorough code reviews with security and quality focus.",
    category: "Software Dev",
    source: "built-in",
    trustLevel: "builtin",
    enabled: false,
    slashCommand: "/code-review",
    path: "~/.hermes/skills/software-dev/code-review/SKILL.md",
    tags: ["review", "quality", "security"],
    updatedAt: "2026-04-23T12:00:00.000Z",
    contentPreview:
      "---\nname: code-review\ndescription: Guidelines for performing thorough code reviews.\n---\n\n# Code Review\n\nPrioritize correctness, regressions, security, and missing tests."
  }
];

export const hubSkills: HubSkill[] = [
  {
    id: "official/security/1password",
    name: "1password",
    description: "Use 1Password CLI to retrieve secrets and manage secure workflows.",
    category: "Security",
    source: "official",
    trustLevel: "official",
    securityStatus: "trusted",
    installCommand: "hermes skills install official/security/1password",
    weeklyInstalls: 420,
    tags: ["security", "secrets", "cli"],
    installed: false,
    contentPreview:
      "---\nname: 1password\ndescription: Use 1Password CLI for secure credential workflows.\n---\n\n# 1Password\n\nRequires the 1Password CLI and local account authentication."
  },
  {
    id: "openai/skills/skill-creator",
    name: "skill-creator",
    description: "Create and refine agent skills using the open SKILL.md format.",
    category: "AI Agents",
    source: "github",
    trustLevel: "trusted",
    securityStatus: "passed",
    installCommand: "hermes skills install openai/skills/skill-creator",
    weeklyInstalls: 1280,
    tags: ["skills", "authoring", "agents"],
    installed: false,
    contentPreview:
      "---\nname: skill-creator\ndescription: Guide for creating effective skills.\n---\n\n# Skill Creator\n\nUse when designing reusable procedures for coding agents."
  },
  {
    id: "skills-sh/vercel-labs/json-render/json-render-react",
    name: "json-render-react",
    description: "Render JSON data into polished React interfaces and components.",
    category: "Software Dev",
    source: "skills-sh",
    trustLevel: "community",
    securityStatus: "warning",
    installCommand: "hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force",
    weeklyInstalls: 314,
    tags: ["react", "json", "ui"],
    installed: false,
    contentPreview:
      "---\nname: json-render-react\ndescription: Render JSON as React UI.\n---\n\n# JSON Render React\n\nCommunity skill. Review the security warning before using --force."
  },
  {
    id: "well-known:https://mintlify.com/docs/.well-known/skills/mintlify",
    name: "mintlify",
    description: "Work with Mintlify documentation sites and published docs indexes.",
    category: "Documentation",
    source: "well-known",
    trustLevel: "community",
    securityStatus: "passed",
    installCommand: "hermes skills install well-known:https://mintlify.com/docs/.well-known/skills/mintlify",
    weeklyInstalls: 96,
    tags: ["docs", "mintlify", "well-known"],
    installed: false,
    contentPreview:
      "---\nname: mintlify\ndescription: Work with Mintlify docs.\n---\n\n# Mintlify\n\nDiscovered through a /.well-known/skills endpoint."
  }
];

export const scheduledJobs: ScheduledJob[] = [
  {
    id: "job-morning-feeds",
    name: "Morning feeds",
    prompt: "Check configured feeds for new AI and agent infrastructure news. Summarize anything useful for Hermes Studio planning.",
    schedule: "0 9 * * *",
    status: "active",
    delivery: "local",
    skills: ["hermes-agent", "plan"],
    repeat: "forever",
    nextRunAt: "2026-04-26T01:00:00.000Z",
    lastRunAt: "2026-04-25T01:00:00.000Z",
    lastRunStatus: "success",
    outputPath: "~/.hermes/cron/output/job-morning-feeds/2026-04-25T01-00-00.md",
    createdAt: "2026-04-23T08:30:00.000Z"
  },
  {
    id: "job-build-check",
    name: "Hermes Studio build check",
    prompt: "Run pnpm typecheck and pnpm --filter @hermes-studio/desktop build. Report failures with the first actionable error.",
    schedule: "every 2h",
    status: "paused",
    delivery: "origin",
    skills: ["code-review"],
    repeat: "forever",
    nextRunAt: undefined,
    lastRunAt: "2026-04-24T14:00:00.000Z",
    lastRunStatus: "failed",
    outputPath: "~/.hermes/cron/output/job-build-check/2026-04-24T14-00-00.md",
    createdAt: "2026-04-24T08:15:00.000Z"
  },
  {
    id: "job-release-reminder",
    name: "Release reminder",
    prompt: "Remind me to review pending local changes and decide whether to tag a desktop preview build.",
    schedule: "30m",
    status: "active",
    delivery: "origin",
    skills: [],
    repeat: "once",
    nextRunAt: "2026-04-25T10:30:00.000Z",
    lastRunStatus: "never",
    outputPath: "~/.hermes/cron/output/job-release-reminder/",
    createdAt: "2026-04-25T10:00:00.000Z"
  }
];

export const settings: Settings = {
  theme: "light",
  defaultModel: "GPT-5.4 Mini",
  enableVoice: false
};
