import { app, BrowserWindow, ipcMain } from "electron";
import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, normalize, resolve } from "node:path";
import {
  channels,
  type AddSpaceInput,
  type CreateScheduledJobInput,
  type HubSkill,
  type InstalledSkill,
  type MemoryDocument,
  type MemoryUpdateInput,
  type MessageInput,
  type ScheduledJob,
  type SkillInstallResult,
  type SkillSearchInput,
  type SpaceMutationResult,
  type UpdateScheduledJobInput
} from "@hermes-studio/bridge";
import { createAppWindow } from "./app-window";
import { readHermesLock } from "./hermes-lock";
import { HermesRuntimeManager } from "./hermes-runtime-manager";
import {
  hubSkills as initialHubSkills,
  installedSkills as initialInstalledSkills,
  memoryDocuments,
  modelConfig,
  profiles,
  scheduledJobs as initialScheduledJobs,
  settings,
  spaces as initialSpaces
} from "./mock-data";

let currentProfileId = "coder";
let currentSpaceId = "home";
let currentSettings = settings;
let memory = [...memoryDocuments];
let installedSkills = [...initialInstalledSkills];
let scheduledJobs = [...initialScheduledJobs];
let hubSkills = initialHubSkills.map((skill) => ({
  ...skill,
  installed: initialInstalledSkills.some((installedSkill) => installedSkill.id === skill.id)
}));
let spaces = [...initialSpaces];
const runtimeManager = new HermesRuntimeManager();

function updateMemoryDocument(input: MemoryUpdateInput): MemoryDocument {
  const target = memory.find((document) => document.key === input.key);

  if (!target) {
    throw new Error("Memory document not found.");
  }

  const updatedDocument = {
    ...target,
    content: input.content,
    updatedAt: new Date().toISOString()
  };

  memory = memory.map((document) => (document.key === input.key ? updatedDocument : document));

  return updatedDocument;
}

function getCurrentSpace() {
  return spaces.find((space) => space.id === currentSpaceId) ?? spaces[0];
}

function toSpaceResult(error?: string): SpaceMutationResult {
  const currentSpace = getCurrentSpace();

  if (!currentSpace) {
    return {
      ok: false,
      error: "No workspace is available.",
      spaces,
      currentSpace: { id: "missing", name: "Missing", path: "" }
    };
  }

  return error ? { ok: false, error, spaces, currentSpace } : { ok: true, spaces, currentSpace };
}

function normalizeWorkspacePath(inputPath: string): string {
  const trimmed = inputPath.trim();
  const expanded = trimmed === "~" ? homedir() : trimmed.startsWith("~/") ? resolve(homedir(), trimmed.slice(2)) : trimmed;

  return normalize(resolve(expanded));
}

function createSpaceId(workspacePath: string): string {
  return workspacePath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-48);
}

function createJobId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return `job-${slug || "scheduled"}-${Date.now().toString(36)}`;
}

function computeMockNextRun(schedule: string): string {
  const now = Date.now();
  const normalized = schedule.trim().toLowerCase();

  if (/^\d+m$/.test(normalized)) {
    return new Date(now + Number.parseInt(normalized, 10) * 60_000).toISOString();
  }

  if (/^\d+h$/.test(normalized)) {
    return new Date(now + Number.parseInt(normalized, 10) * 3_600_000).toISOString();
  }

  if (/^every\s+\d+h$/.test(normalized)) {
    return new Date(now + Number.parseInt(normalized.replace("every", "").trim(), 10) * 3_600_000).toISOString();
  }

  if (/^every\s+\d+m$/.test(normalized)) {
    return new Date(now + Number.parseInt(normalized.replace("every", "").trim(), 10) * 60_000).toISOString();
  }

  return new Date(now + 24 * 3_600_000).toISOString();
}

function selectedJob(jobId?: string): ScheduledJob | undefined {
  return jobId ? scheduledJobs.find((job) => job.id === jobId) : scheduledJobs[0];
}

function createScheduledJob(input: CreateScheduledJobInput) {
  if (!input.name.trim()) {
    return { ok: false as const, error: "Enter a job name.", jobs: scheduledJobs, selectedJob: selectedJob() };
  }

  if (!input.schedule.trim()) {
    return { ok: false as const, error: "Enter a schedule such as 30m, every 2h, or 0 9 * * *.", jobs: scheduledJobs, selectedJob: selectedJob() };
  }

  if (!input.prompt.trim()) {
    return { ok: false as const, error: "Enter a self-contained prompt for the fresh cron session.", jobs: scheduledJobs, selectedJob: selectedJob() };
  }

  const id = createJobId(input.name);
  const job: ScheduledJob = {
    id,
    name: input.name.trim(),
    prompt: input.prompt.trim(),
    schedule: input.schedule.trim(),
    status: "active",
    delivery: input.delivery.trim() || "local",
    skills: input.skills,
    repeat: input.schedule.trim().startsWith("every") || input.schedule.trim().split(" ").length >= 5 ? "forever" : "once",
    nextRunAt: computeMockNextRun(input.schedule),
    lastRunStatus: "never",
    outputPath: `~/.hermes/cron/output/${id}/`,
    createdAt: new Date().toISOString()
  };

  scheduledJobs = [job, ...scheduledJobs];

  return { ok: true as const, jobs: scheduledJobs, selectedJob: job };
}

function validateScheduledJobInput(input: CreateScheduledJobInput): string | null {
  if (!input.name.trim()) {
    return "Enter a job name.";
  }

  if (!input.schedule.trim()) {
    return "Enter a schedule such as 30m, every 2h, or 0 9 * * *.";
  }

  if (!input.prompt.trim()) {
    return "Enter a self-contained prompt for the fresh cron session.";
  }

  return null;
}

function editScheduledJob(input: UpdateScheduledJobInput) {
  const error = validateScheduledJobInput(input);

  if (error) {
    return { ok: false as const, error, jobs: scheduledJobs, selectedJob: selectedJob(input.jobId) };
  }

  return updateScheduledJob(input.jobId, (job) => ({
    ...job,
    name: input.name.trim(),
    prompt: input.prompt.trim(),
    schedule: input.schedule.trim(),
    delivery: input.delivery.trim() || "local",
    skills: input.skills,
    repeat: input.schedule.trim().startsWith("every") || input.schedule.trim().split(" ").length >= 5 ? "forever" : "once",
    nextRunAt: job.status === "paused" ? undefined : computeMockNextRun(input.schedule)
  }));
}

function updateScheduledJob(jobId: string, updater: (job: ScheduledJob) => ScheduledJob) {
  const target = scheduledJobs.find((job) => job.id === jobId);

  if (!target) {
    return { ok: false as const, error: "Scheduled job not found.", jobs: scheduledJobs, selectedJob: selectedJob() };
  }

  const nextJob = updater(target);
  scheduledJobs = scheduledJobs.map((job) => (job.id === jobId ? nextJob : job));

  return { ok: true as const, jobs: scheduledJobs, selectedJob: nextJob };
}

function searchHubSkills(input: SkillSearchInput): HubSkill[] {
  const query = input.query.trim().toLowerCase();

  return hubSkills.filter((skill) => {
    const matchesSource = !input.source || input.source === "all" || skill.source === input.source;
    const matchesQuery =
      !query ||
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      skill.category.toLowerCase().includes(query) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(query));

    return matchesSource && matchesQuery;
  });
}

function installHubSkill(skillId: string): SkillInstallResult {
  const target = hubSkills.find((skill) => skill.id === skillId);

  if (!target) {
    return { ok: false, error: "Skill not found in the hub.", installedSkills, hubSkills };
  }

  if (target.securityStatus === "blocked") {
    return { ok: false, error: "This skill is blocked by the security scanner.", installedSkills, hubSkills };
  }

  const existingSkill = installedSkills.find((skill) => skill.id === target.id);

  if (existingSkill) {
    return { ok: true, installedSkills, hubSkills, installedSkill: existingSkill };
  }

  const installedSkill: InstalledSkill = {
    id: target.id,
    name: target.name,
    description: target.description,
    category: target.category,
    source: target.source,
    trustLevel: target.trustLevel,
    enabled: true,
    slashCommand: `/${target.name}`,
    path: `~/.hermes/skills/${target.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${target.name}/SKILL.md`,
    tags: target.tags,
    updatedAt: new Date().toISOString(),
    contentPreview: target.contentPreview
  };

  installedSkills = [...installedSkills, installedSkill];
  hubSkills = hubSkills.map((skill) => (skill.id === target.id ? { ...skill, installed: true } : skill));

  return { ok: true, installedSkills, hubSkills, installedSkill };
}

function registerIpcHandlers(): void {
  ipcMain.handle(channels.appGetInfo, () => ({
    version: app.getVersion(),
    platform: process.platform,
    hermesVersion: readHermesLock()
  }));

  ipcMain.handle(channels.runtimeGetStatus, () => runtimeManager.getStatus());

  ipcMain.handle(channels.runtimeSendMessage, (event, input: MessageInput) => {
    const profile = profiles.find((item) => item.id === input.profileId) ?? profiles.find((item) => item.id === currentProfileId);
    const space = spaces.find((item) => item.id === input.spaceId) ?? getCurrentSpace();
    return runtimeManager.sendMessage(event.sender, input, { profile, space });
  });
  ipcMain.handle(channels.conversationsList, () => {
    const profile = profiles.find((item) => item.id === currentProfileId);
    return runtimeManager.listConversations({ profile, space: getCurrentSpace() });
  });
  ipcMain.handle(channels.conversationsLoad, (_event, conversationId: string) => {
    const profile = profiles.find((item) => item.id === currentProfileId);
    return runtimeManager.loadConversationEvents(conversationId, { profile, space: getCurrentSpace() });
  });

  ipcMain.handle(channels.profilesList, () => profiles);
  ipcMain.handle(channels.profilesGetCurrent, () => profiles.find((profile) => profile.id === currentProfileId) ?? profiles[0]);
  ipcMain.handle(channels.profilesSetCurrent, (_event, profileId: string) => {
    currentProfileId = profileId;
    return profiles.find((profile) => profile.id === currentProfileId) ?? profiles[0];
  });

  ipcMain.handle(channels.memoryList, () => memory);
  ipcMain.handle(channels.memoryUpdate, (_event, input: MemoryUpdateInput) => updateMemoryDocument(input));

  ipcMain.handle(channels.modelsGetConfig, () => modelConfig);

  ipcMain.handle(channels.skillsListInstalled, () => installedSkills);
  ipcMain.handle(channels.skillsSearchHub, (_event, input: SkillSearchInput) => searchHubSkills(input));
  ipcMain.handle(channels.skillsInstallFromHub, (_event, skillId: string) => installHubSkill(skillId));
  ipcMain.handle(channels.skillsSetEnabled, (_event, skillId: string, enabled: boolean) => {
    installedSkills = installedSkills.map((skill) => (skill.id === skillId ? { ...skill, enabled } : skill));
    return installedSkills;
  });

  ipcMain.handle(channels.scheduledJobsList, () => scheduledJobs);
  ipcMain.handle(channels.scheduledJobsCreate, (_event, input: CreateScheduledJobInput) => createScheduledJob(input));
  ipcMain.handle(channels.scheduledJobsUpdate, (_event, input: UpdateScheduledJobInput) => editScheduledJob(input));
  ipcMain.handle(channels.scheduledJobsPause, (_event, jobId: string) =>
    updateScheduledJob(jobId, (job) => ({
      ...job,
      status: "paused",
      nextRunAt: undefined
    }))
  );
  ipcMain.handle(channels.scheduledJobsResume, (_event, jobId: string) =>
    updateScheduledJob(jobId, (job) => ({
      ...job,
      status: "active",
      nextRunAt: computeMockNextRun(job.schedule)
    }))
  );
  ipcMain.handle(channels.scheduledJobsRunNow, (_event, jobId: string) =>
    updateScheduledJob(jobId, (job) => ({
      ...job,
      status: "queued",
      lastRunStatus: "queued",
      nextRunAt: new Date(Date.now() + 60_000).toISOString()
    }))
  );
  ipcMain.handle(channels.scheduledJobsRemove, (_event, jobId: string) => {
    const target = scheduledJobs.find((job) => job.id === jobId);

    if (!target) {
      return { ok: false, error: "Scheduled job not found.", jobs: scheduledJobs, selectedJob: selectedJob() };
    }

    scheduledJobs = scheduledJobs.filter((job) => job.id !== jobId);

    return { ok: true, jobs: scheduledJobs, selectedJob: selectedJob() };
  });

  ipcMain.handle(channels.spacesList, () => spaces);
  ipcMain.handle(channels.spacesGetCurrent, () => getCurrentSpace());
  ipcMain.handle(channels.spacesSetCurrent, (_event, spaceId: string) => {
    const target = spaces.find((space) => space.id === spaceId);

    if (target) {
      currentSpaceId = target.id;
    }

    return getCurrentSpace();
  });
  ipcMain.handle(channels.spacesAdd, (_event, input: AddSpaceInput) => {
    const workspacePath = normalizeWorkspacePath(input.path);

    if (!input.path.trim()) {
      return toSpaceResult("Enter a workspace path before saving.");
    }

    if (!existsSync(workspacePath) || !statSync(workspacePath).isDirectory()) {
      return toSpaceResult("That path does not exist or is not a directory.");
    }

    if (spaces.some((space) => normalizeWorkspacePath(space.path) === workspacePath)) {
      return toSpaceResult("That workspace is already saved.");
    }

    const name = basename(workspacePath) || workspacePath;
    const nextSpace = {
      id: createSpaceId(workspacePath),
      name,
      path: workspacePath
    };

    spaces = [...spaces, nextSpace];
    currentSpaceId = nextSpace.id;

    return toSpaceResult();
  });
  ipcMain.handle(channels.spacesRemove, (_event, spaceId: string) => {
    if (spaces.length <= 1) {
      return toSpaceResult("Keep at least one workspace.");
    }

    const nextSpaces = spaces.filter((space) => space.id !== spaceId);

    if (nextSpaces.length === spaces.length) {
      return toSpaceResult("Workspace not found.");
    }

    spaces = nextSpaces;

    if (currentSpaceId === spaceId) {
      currentSpaceId = spaces[0]?.id ?? "";
    }

    return toSpaceResult();
  });

  ipcMain.handle(channels.settingsGet, () => currentSettings);
  ipcMain.handle(channels.settingsUpdate, (_event, patch: Partial<typeof settings>) => {
    currentSettings = { ...currentSettings, ...patch };
    return currentSettings;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createAppWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createAppWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
