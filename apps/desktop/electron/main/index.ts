import { app, BrowserWindow, ipcMain } from "electron";
import { channels, type ConversationEvent, type MessageInput } from "@hermes-studio/bridge";
import { createAppWindow } from "./app-window";
import { readHermesLock } from "./hermes-lock";
import { profiles, settings, spaces } from "./mock-data";
import { getRuntimeStatus } from "./runtime-status";

let currentProfileId = "coder";
let currentSpaceId = "home";
let currentSettings = settings;
let conversationCounter = 0;

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
  ipcMain.handle(channels.spacesGetCurrent, () => spaces.find((space) => space.id === currentSpaceId) ?? spaces[0]);
  ipcMain.handle(channels.spacesSetCurrent, (_event, spaceId: string) => {
    currentSpaceId = spaceId;
    return spaces.find((space) => space.id === currentSpaceId) ?? spaces[0];
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
