import type {
  AppInfo,
  AddSpaceInput,
  ConversationEvent,
  ConversationSummary,
  CreateScheduledJobInput,
  HubSkill,
  InstalledSkill,
  MemoryDocument,
  MemoryUpdateInput,
  MessageInput,
  ModelConfig,
  Profile,
  RuntimeStatus,
  ScheduledJob,
  ScheduledJobMutationResult,
  Settings,
  SkillInstallResult,
  SkillSearchInput,
  Space,
  SpaceMutationResult,
  UpdateScheduledJobInput
} from "./contracts";

export type Unsubscribe = () => void;

export type HermesStudioApi = {
  app: {
    getInfo: () => Promise<AppInfo>;
  };
  runtime: {
    getStatus: () => Promise<RuntimeStatus>;
    sendMessage: (input: MessageInput) => Promise<{ conversationId: string }>;
    onEvent: (callback: (event: ConversationEvent) => void) => Unsubscribe;
  };
  conversations: {
    list: () => Promise<ConversationSummary[]>;
    load: (conversationId: string) => Promise<ConversationEvent[]>;
  };
  profiles: {
    list: () => Promise<Profile[]>;
    getCurrent: () => Promise<Profile>;
    setCurrent: (profileId: string) => Promise<Profile>;
  };
  memory: {
    list: () => Promise<MemoryDocument[]>;
    update: (input: MemoryUpdateInput) => Promise<MemoryDocument>;
  };
  models: {
    getConfig: () => Promise<ModelConfig>;
  };
  skills: {
    listInstalled: () => Promise<InstalledSkill[]>;
    searchHub: (input: SkillSearchInput) => Promise<HubSkill[]>;
    installFromHub: (skillId: string) => Promise<SkillInstallResult>;
    setEnabled: (skillId: string, enabled: boolean) => Promise<InstalledSkill[]>;
  };
  scheduledJobs: {
    list: () => Promise<ScheduledJob[]>;
    create: (input: CreateScheduledJobInput) => Promise<ScheduledJobMutationResult>;
    update: (input: UpdateScheduledJobInput) => Promise<ScheduledJobMutationResult>;
    pause: (jobId: string) => Promise<ScheduledJobMutationResult>;
    resume: (jobId: string) => Promise<ScheduledJobMutationResult>;
    runNow: (jobId: string) => Promise<ScheduledJobMutationResult>;
    remove: (jobId: string) => Promise<ScheduledJobMutationResult>;
  };
  spaces: {
    list: () => Promise<Space[]>;
    getCurrent: () => Promise<Space>;
    setCurrent: (spaceId: string) => Promise<Space>;
    add: (input: AddSpaceInput) => Promise<SpaceMutationResult>;
    remove: (spaceId: string) => Promise<SpaceMutationResult>;
  };
  settings: {
    get: () => Promise<Settings>;
    update: (patch: Partial<Settings>) => Promise<Settings>;
  };
};
