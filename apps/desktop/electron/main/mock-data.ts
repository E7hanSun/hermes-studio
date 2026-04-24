import type { Profile, Settings, Space } from "@hermes-studio/bridge";

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

export const settings: Settings = {
  theme: "light",
  defaultModel: "GPT-5.4 Mini",
  enableVoice: false
};
