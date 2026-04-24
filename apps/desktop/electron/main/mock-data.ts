import type { Profile, Settings, Space } from "@hermes-studio/bridge";

export const profiles: Profile[] = [
  {
    id: "coder",
    name: "coder",
    model: "GPT-5.4 Mini",
    description: "Focused software development profile"
  },
  {
    id: "researcher",
    name: "researcher",
    model: "GPT-5.4",
    description: "Research and synthesis profile"
  },
  {
    id: "assistant",
    name: "assistant",
    model: "GPT-5.4 Mini",
    description: "General-purpose personal assistant"
  }
];

export const spaces: Space[] = [
  {
    id: "home",
    name: "Home",
    path: "~"
  },
  {
    id: "hermes-studio",
    name: "hermes-studio",
    path: "/Users/ember/code/hermes-studio",
    gitBranch: "main"
  }
];

export const settings: Settings = {
  theme: "light",
  defaultModel: "GPT-5.4 Mini",
  enableVoice: false
};
