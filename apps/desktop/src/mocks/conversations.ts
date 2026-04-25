import type { ConversationSummary } from "@hermes-studio/bridge";

export const mockConversations: ConversationSummary[] = [
  {
    id: "design-hermes-studio",
    title: "Design Hermes Studio desktop",
    group: "today",
    profile: "Main Agent",
    timeLabel: "10m",
    active: true
  },
  {
    id: "desktop-client-plan",
    title: "Desktop client plan",
    group: "today",
    profile: "Main Agent",
    timeLabel: "2h"
  },
  {
    id: "hermes-multi-agent",
    title: "Hermes multi-agent discussion",
    group: "week",
    profile: "coder",
    timeLabel: "1d"
  },
  {
    id: "tools-page-design",
    title: "Tools page design",
    group: "fortnight",
    profile: "coder",
    timeLabel: "2d"
  },
  {
    id: "subagent-context",
    title: "[Subagent Context] You are helping inspect provider docs",
    group: "fortnight",
    profile: "coder",
    timeLabel: "6d"
  },
  {
    id: "agent-main-session",
    title: "agent:main:session summary and model setup notes",
    group: "older",
    profile: "Main Agent",
    timeLabel: "1mo"
  }
];
