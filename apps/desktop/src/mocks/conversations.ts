import type { ConversationSummary } from "@hermes-studio/bridge";

export const mockConversations: ConversationSummary[] = [
  {
    id: "design-hermes-studio",
    title: "Design Hermes Studio desktop",
    group: "today",
    timeLabel: "10m",
    active: true
  },
  {
    id: "desktop-client-plan",
    title: "Desktop client plan",
    group: "today",
    timeLabel: "2h"
  },
  {
    id: "hermes-multi-agent",
    title: "Hermes multi-agent discussion",
    group: "yesterday",
    timeLabel: "1d"
  },
  {
    id: "tools-page-design",
    title: "Tools page design",
    group: "yesterday",
    timeLabel: "2d"
  }
];
