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
};

export type Space = {
  id: string;
  name: string;
  path: string;
  gitBranch?: string;
};

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
