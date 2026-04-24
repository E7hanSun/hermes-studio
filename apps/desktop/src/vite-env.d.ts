/// <reference types="vite/client" />

import type { HermesStudioApi } from "@hermes-studio/bridge";

declare global {
  interface Window {
    hermesStudio: HermesStudioApi;
  }
}
