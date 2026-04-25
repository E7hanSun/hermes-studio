export type AppInfo = {
  version: string;
  platform: NodeJS.Platform;
  hermesVersion: {
    ref: string;
    commit: string;
  };
};

export type Profile = {
  id: string;
  name: string;
  model: string;
  description: string;
  homePath: string;
  command: string;
  skillsCount: number;
  cronJobsCount: number;
  gatewayEnabled: boolean;
};

export type Space = {
  id: string;
  name: string;
  path: string;
};

export type SpaceMutationResult =
  | { ok: true; spaces: Space[]; currentSpace: Space }
  | { ok: false; error: string; spaces: Space[]; currentSpace: Space };

export type AddSpaceInput = {
  path: string;
};

export type MemoryDocumentKey = "notes" | "profile";

export type MemoryDocument = {
  key: MemoryDocumentKey;
  title: string;
  description: string;
  fileName: "MEMORY.md" | "USER.md";
  path: string;
  content: string;
  updatedAt: string;
};

export type MemoryUpdateInput = {
  key: MemoryDocumentKey;
  content: string;
};

export type SkillSource = "built-in" | "optional" | "official" | "skills-sh" | "well-known" | "github" | "community";

export type SkillTrustLevel = "builtin" | "official" | "trusted" | "community";

export type SkillSecurityStatus = "trusted" | "passed" | "warning" | "blocked";

export type InstalledSkill = {
  id: string;
  name: string;
  description: string;
  category: string;
  source: SkillSource;
  trustLevel: SkillTrustLevel;
  enabled: boolean;
  slashCommand: string;
  path: string;
  tags: string[];
  updatedAt: string;
  contentPreview: string;
};

export type HubSkill = {
  id: string;
  name: string;
  description: string;
  category: string;
  source: SkillSource;
  trustLevel: SkillTrustLevel;
  securityStatus: SkillSecurityStatus;
  installCommand: string;
  weeklyInstalls?: number;
  tags: string[];
  installed: boolean;
  contentPreview: string;
};

export type SkillSearchInput = {
  query: string;
  source?: SkillSource | "all";
};

export type SkillInstallResult =
  | { ok: true; installedSkills: InstalledSkill[]; hubSkills: HubSkill[]; installedSkill: InstalledSkill }
  | { ok: false; error: string; installedSkills: InstalledSkill[]; hubSkills: HubSkill[] };

export type ScheduledJobStatus = "active" | "paused" | "queued" | "failed";

export type ScheduledJobRunStatus = "success" | "failed" | "queued" | "running" | "never";

export type ScheduledJob = {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  status: ScheduledJobStatus;
  delivery: string;
  skills: string[];
  repeat: "once" | "forever" | number;
  nextRunAt?: string;
  lastRunAt?: string;
  lastRunStatus: ScheduledJobRunStatus;
  outputPath: string;
  createdAt: string;
};

export type CreateScheduledJobInput = {
  name: string;
  prompt: string;
  schedule: string;
  delivery: string;
  skills: string[];
};

export type UpdateScheduledJobInput = CreateScheduledJobInput & {
  jobId: string;
};

export type ScheduledJobMutationResult =
  | { ok: true; jobs: ScheduledJob[]; selectedJob?: ScheduledJob }
  | { ok: false; error: string; jobs: ScheduledJob[]; selectedJob?: ScheduledJob };

export type ConversationSummary = {
  id: string;
  title: string;
  group: "today" | "yesterday";
  timeLabel: string;
  active?: boolean;
};

export type RuntimeStatus =
  | { state: "missing"; message: string }
  | { state: "idle"; vendorPath?: string }
  | { state: "starting" }
  | { state: "running"; pid: number }
  | { state: "error"; message: string };

export type ModelProviderStatus = "configured" | "missing-key" | "oauth-ready" | "available" | "disabled";

export type ModelCredential = {
  id: string;
  provider: string;
  label: string;
  authType: "api-key" | "oauth" | "config" | "env" | "aws";
  source: string;
  status: "ok" | "missing" | "expired" | "cooldown";
  selected: boolean;
  requestCount: number;
};

export type ModelProvider = {
  id: string;
  name: string;
  description: string;
  category: "oauth" | "api-key" | "local" | "cloud" | "custom";
  status: ModelProviderStatus;
  modelCount: number;
  supportsOAuth: boolean;
  supportsApiKey: boolean;
  supportsCustomEndpoint: boolean;
};

export type CustomModelEndpoint = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  credentialSource: string;
};

export type AuxiliaryModelSlot = {
  id: "vision" | "web_extract" | "compression" | "mcp" | "flush_memories";
  label: string;
  provider: string;
  model: string;
  timeout: number;
};

export type ModelConfig = {
  primary: {
    provider: string;
    model: string;
    baseUrl?: string;
    sourcePath: string;
  };
  fallback: {
    provider: string;
    model: string;
    enabled: boolean;
  };
  credentialPoolStrategies: Record<string, "fill_first" | "round_robin" | "least_used" | "random">;
  providers: ModelProvider[];
  credentials: ModelCredential[];
  customEndpoints: CustomModelEndpoint[];
  auxiliary: AuxiliaryModelSlot[];
};

export type MessageInput = {
  conversationId?: string;
  text: string;
  profileId: string;
  spaceId: string;
  model: string;
};

export type ToolCall = {
  id: string;
  kind: "terminal" | "tool";
  title: string;
  command?: string;
  status: "queued" | "running" | "finished" | "failed";
  output?: string[];
};

export type ConversationEvent =
  | { type: "conversation.started"; conversationId: string; title: string; input: string; createdAt: string }
  | { type: "thinking.started"; conversationId: string; title: string }
  | { type: "thinking.updated"; conversationId: string; text: string }
  | { type: "message.delta"; conversationId: string; text: string }
  | { type: "message.completed"; conversationId: string }
  | { type: "tool.started"; conversationId: string; tool: ToolCall }
  | { type: "tool.output"; conversationId: string; toolCallId: string; output: string }
  | { type: "tool.finished"; conversationId: string; toolCallId: string; exitCode: number }
  | { type: "approval.requested"; conversationId: string; approvalId: string; summary: string };

export type Settings = {
  theme: "light" | "dark" | "system";
  defaultModel: string;
  enableVoice: boolean;
};
