import type {
  AppInfo,
  AddSpaceInput,
  ConversationEvent,
  HubSkill,
  InstalledSkill,
  MemoryDocument,
  MemoryUpdateInput,
  MessageInput,
  Profile,
  RuntimeStatus,
  Settings,
  SkillInstallResult,
  SkillSearchInput,
  Space,
  SpaceMutationResult
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
  profiles: {
    list: () => Promise<Profile[]>;
    getCurrent: () => Promise<Profile>;
    setCurrent: (profileId: string) => Promise<Profile>;
  };
  memory: {
    list: () => Promise<MemoryDocument[]>;
    update: (input: MemoryUpdateInput) => Promise<MemoryDocument>;
  };
  skills: {
    listInstalled: () => Promise<InstalledSkill[]>;
    searchHub: (input: SkillSearchInput) => Promise<HubSkill[]>;
    installFromHub: (skillId: string) => Promise<SkillInstallResult>;
    setEnabled: (skillId: string, enabled: boolean) => Promise<InstalledSkill[]>;
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
