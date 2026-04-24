import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readHermesLock(): { ref: string; commit: string } {
  const lockPath = resolve(process.cwd(), "../../hermes-version.lock");

  try {
    const content = readFileSync(lockPath, "utf8");
    const values = Object.fromEntries(
      content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );

    return {
      ref: values.ref ?? "unknown",
      commit: values.commit ?? "unknown"
    };
  } catch {
    return {
      ref: "unknown",
      commit: "unknown"
    };
  }
}
