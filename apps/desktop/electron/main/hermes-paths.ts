import { app } from "electron";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { readHermesLock } from "./hermes-lock";

export type HermesRuntimeSource = "env" | "managed";

export type HermesRuntimeCommand = {
  command: string;
  args: string[];
  source: HermesRuntimeSource;
  entryPath: string;
};

const HERMES_BIN_ENV = "HERMES_STUDIO_HERMES_BIN";

export function getHermesDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "hermes-agent");
  }

  return resolve(process.cwd(), "../../vendor/hermes-agent");
}

export function getHermesEntryPath(): string {
  const dir = getHermesDir();
  const binName = process.platform === "win32" ? "hermes.exe" : "hermes";
  const candidates = [
    join(dir, "venv", process.platform === "win32" ? "Scripts" : "bin", binName),
    join(dir, ".venv", process.platform === "win32" ? "Scripts" : "bin", binName),
    join(dir, binName)
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export function resolveHermesRuntime(): HermesRuntimeCommand | null {
  const envCommand = process.env[HERMES_BIN_ENV]?.trim();

  if (envCommand) {
    return { command: envCommand, args: [], source: "env", entryPath: envCommand };
  }

  const managedEntry = getHermesEntryPath();

  if (existsSync(managedEntry)) {
    return { command: managedEntry, args: [], source: "managed", entryPath: managedEntry };
  }

  return null;
}

export function getHermesRuntimeStatus(activePid?: number) {
  const lock = readHermesLock();
  const managedDir = getHermesDir();
  const runtime = resolveHermesRuntime();
  const external = getExternalHermesDiagnostic();

  if (activePid) {
    return {
      state: "running" as const,
      pid: activePid,
      source: runtime?.source ?? "managed",
      lockedRef: lock.ref,
      lockedCommit: lock.commit,
      version: runtime ? readRuntimeVersion(runtime) : undefined,
      entryPath: runtime?.entryPath,
      externalVersion: external.version,
      externalEntryPath: external.entryPath
    };
  }

  if (!runtime) {
    return {
      state: "missing" as const,
      source: "managed" as const,
      lockedRef: lock.ref,
      lockedCommit: lock.commit,
      entryPath: getHermesEntryPath(),
      managedDir,
      externalVersion: external.version,
      externalEntryPath: external.entryPath,
      message: external.version
        ? `Managed Hermes runtime was not found at ${managedDir}. External Hermes ${external.version} is installed, but Studio does not use it by default.`
        : `Managed Hermes runtime was not found. Expected it at ${managedDir}, or set ${HERMES_BIN_ENV}.`
    };
  }

  const version = readRuntimeVersion(runtime);
  const versionMatchesLock = versionMatchesRef(version, lock.ref);

  if (!versionMatchesLock) {
    return {
      state: "version-mismatch" as const,
      source: runtime.source,
      lockedRef: lock.ref,
      lockedCommit: lock.commit,
      version,
      entryPath: runtime.entryPath,
      managedDir,
      externalVersion: external.version,
      externalEntryPath: external.entryPath,
      message: `Hermes runtime ${version ?? "unknown"} does not match locked ${lock.ref}.`
    };
  }

  return {
    state: "idle" as const,
    source: runtime.source,
    lockedRef: lock.ref,
    lockedCommit: lock.commit,
    version,
    entryPath: runtime.entryPath,
    managedDir,
    externalVersion: external.version,
    externalEntryPath: external.entryPath
  };
}

export function appendHermesProfileArgs(runtime: HermesRuntimeCommand, profileId?: string): string[] {
  const args = [...runtime.args];

  if (profileId) {
    args.push("--profile", profileId);
  }

  return args;
}

export function readRuntimeVersion(runtime: HermesRuntimeCommand): string | undefined {
  const result = spawnSync(runtime.command, [...runtime.args, "--version"], {
    encoding: "utf8",
    timeout: 2500,
    windowsHide: true
  });

  if (result.error) {
    return undefined;
  }

  return parseHermesVersion(`${result.stdout}\n${result.stderr}`);
}

export function isCommandAvailable(command: string): boolean {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    timeout: 2500,
    windowsHide: true
  });

  return !result.error && (result.status === 0 || result.status === null);
}

function getExternalHermesDiagnostic(): { version?: string; entryPath?: string } {
  if (!isCommandAvailable("hermes")) {
    return {};
  }

  const version = readRuntimeVersion({
    command: "hermes",
    args: [],
    source: "managed",
    entryPath: "hermes"
  });

  return { version, entryPath: "hermes" };
}

function parseHermesVersion(output: string): string | undefined {
  const releaseDate = output.match(/\((\d{4}\.\d+\.\d+)\)/);

  if (releaseDate?.[1]) {
    return `v${releaseDate[1]}`;
  }

  const direct = output.match(/Hermes Agent\s+v?([0-9][^\s]*)/i);

  if (direct?.[1]) {
    return direct[1].startsWith("v") ? direct[1] : `v${direct[1]}`;
  }

  const generic = output.match(/\bv?([0-9]{4}\.[0-9]+\.[0-9]+|[0-9]+\.[0-9]+\.[0-9]+)\b/);

  if (generic?.[1]) {
    return generic[1].startsWith("v") ? generic[1] : `v${generic[1]}`;
  }

  return readPackageVersion();
}

function readPackageVersion(): string | undefined {
  const packagePath = join(getHermesDir(), "package.json");

  if (!existsSync(packagePath)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: string };
    return parsed.version ? `v${parsed.version}` : undefined;
  } catch {
    return undefined;
  }
}

function versionMatchesRef(version: string | undefined, ref: string): boolean {
  if (!version || ref === "unknown") {
    return false;
  }

  const normalizedVersion = normalizeVersion(version);
  const normalizedRef = normalizeVersion(ref);

  return normalizedVersion === normalizedRef;
}

function normalizeVersion(value: string): string {
  return value.trim().replace(/^v/i, "");
}
