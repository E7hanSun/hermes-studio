import { app, BrowserWindow, ipcMain } from "electron";
import { existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, normalize, resolve } from "node:path";
import { channels, type AddSpaceInput, type ConversationEvent, type MessageInput, type SpaceMutationResult } from "@hermes-studio/bridge";
import { createAppWindow } from "./app-window";
import { readHermesLock } from "./hermes-lock";
import { profiles, settings, spaces as initialSpaces } from "./mock-data";
import { getRuntimeStatus } from "./runtime-status";

let currentProfileId = "coder";
let currentSpaceId = "home";
let currentSettings = settings;
let spaces = [...initialSpaces];
let conversationCounter = 0;

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

function sendRuntimeEvent(sender: Electron.WebContents, event: ConversationEvent, delay: number): void {
  setTimeout(() => {
    if (!sender.isDestroyed()) {
      sender.send(channels.runtimeSubscribe, event);
    }
  }, delay);
}

function scheduleMockRuntime(sender: Electron.WebContents, input: MessageInput, conversationId: string): void {
  const title = input.text.length > 46 ? `${input.text.slice(0, 43)}...` : input.text;
  const toolCallId = `${conversationId}-tool-1`;

  sendRuntimeEvent(
    sender,
    {
      type: "conversation.started",
      conversationId,
      title,
      input: input.text,
      createdAt: new Date().toISOString()
    },
    80
  );
  sendRuntimeEvent(sender, { type: "thinking.started", conversationId, title: "Thinking" }, 420);
  sendRuntimeEvent(sender, { type: "thinking.updated", conversationId, text: "I will inspect the current space and verify the project shape first." }, 760);
  sendRuntimeEvent(
    sender,
    {
      type: "tool.started",
      conversationId,
      tool: {
        id: toolCallId,
        kind: "terminal",
        title: "terminal",
        command: "rg --files | head",
        status: "running",
        output: []
      }
    },
    1100
  );
  sendRuntimeEvent(sender, { type: "tool.output", conversationId, toolCallId, output: "apps/desktop/src/app/App.tsx" }, 1460);
  sendRuntimeEvent(sender, { type: "tool.output", conversationId, toolCallId, output: "packages/bridge/src/contracts.ts" }, 1800);
  sendRuntimeEvent(sender, { type: "tool.output", conversationId, toolCallId, output: "packages/design-system/src/tokens.ts" }, 2120);
  sendRuntimeEvent(sender, { type: "tool.finished", conversationId, toolCallId, exitCode: 0 }, 2460);

  const deltas = [
    "I found the desktop shell, bridge contracts, and design tokens. ",
    "The next clean step is to make the conversation UI event-driven, ",
    "so the renderer behaves like it is connected to the real Hermes runtime."
  ];

  deltas.forEach((text, index) => {
    sendRuntimeEvent(sender, { type: "message.delta", conversationId, text }, 2860 + index * 520);
  });
  sendRuntimeEvent(sender, { type: "message.completed", conversationId }, 4560);
}

function registerIpcHandlers(): void {
  ipcMain.handle(channels.appGetInfo, () => ({
    version: app.getVersion(),
    platform: process.platform,
    hermesVersion: readHermesLock()
  }));

  ipcMain.handle(channels.runtimeGetStatus, () => getRuntimeStatus());

  ipcMain.handle(channels.runtimeSendMessage, (event, input: MessageInput) => {
    const conversationId = input.conversationId ?? `mock-conversation-${++conversationCounter}`;
    scheduleMockRuntime(event.sender, input, conversationId);
    return { conversationId };
  });

  ipcMain.handle(channels.profilesList, () => profiles);
  ipcMain.handle(channels.profilesGetCurrent, () => profiles.find((profile) => profile.id === currentProfileId) ?? profiles[0]);
  ipcMain.handle(channels.profilesSetCurrent, (_event, profileId: string) => {
    currentProfileId = profileId;
    return profiles.find((profile) => profile.id === currentProfileId) ?? profiles[0];
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
