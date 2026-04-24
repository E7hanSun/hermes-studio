import type {
  AppInfo,
  ConversationEvent,
  MessageInput,
  Profile,
  RuntimeStatus,
  Settings,
  Space
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
  spaces: {
    list: () => Promise<Space[]>;
    getCurrent: () => Promise<Space>;
    setCurrent: (spaceId: string) => Promise<Space>;
  };
  settings: {
    get: () => Promise<Settings>;
    update: (patch: Partial<Settings>) => Promise<Settings>;
  };
};
