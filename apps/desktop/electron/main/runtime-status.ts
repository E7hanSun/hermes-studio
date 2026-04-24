import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { RuntimeStatus } from "@hermes-studio/bridge";

export function getRuntimeStatus(): RuntimeStatus {
  const vendorPath = resolve(process.cwd(), "../../vendor/hermes-agent");

  if (!existsSync(vendorPath)) {
    return {
      state: "missing",
      message: "vendor/hermes-agent is missing. Run scripts/vendor-hermes.sh before connecting the real runtime."
    };
  }

  return {
    state: "idle",
    vendorPath
  };
}
