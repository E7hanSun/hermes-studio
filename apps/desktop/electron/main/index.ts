import { app, BrowserWindow, ipcMain } from "electron";
import { channels, type MessageInput } from "@hermes-studio/bridge";
import { createAppWindow } from "./app-window";
import { readHermesLock } from "./hermes-lock";
import { profiles, settings, spaces } from "./mock-data";

let currentProfileId = "coder";
let currentSpaceId = "home";
let currentSettings = settings;

function registerIpcHandlers(): void {
  ipcMain.handle(channels.appGetInfo, () => ({
    version: app.getVersion(),
    platform: process.platform,
    hermesVersion: readHermesLock()
  }));

  ipcMain.handle(channels.runtimeGetStatus, () => ({ state: "idle" }));

  ipcMain.handle(channels.runtimeSendMessage, (_event, input: MessageInput) => ({
    conversationId: input.conversationId ?? "mock-active-conversation"
  }));

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
