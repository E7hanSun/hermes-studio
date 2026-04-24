import { contextBridge, ipcRenderer } from "electron";
import { channels, type ConversationEvent, type HermesStudioApi, type MessageInput, type Settings } from "@hermes-studio/bridge";

const api: HermesStudioApi = {
  app: {
    getInfo: () => ipcRenderer.invoke(channels.appGetInfo)
  },
  runtime: {
    getStatus: () => ipcRenderer.invoke(channels.runtimeGetStatus),
    sendMessage: (input: MessageInput) => ipcRenderer.invoke(channels.runtimeSendMessage, input),
    onEvent: (callback: (event: ConversationEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: ConversationEvent): void => callback(payload);
      ipcRenderer.on(channels.runtimeSubscribe, listener);
      return () => ipcRenderer.removeListener(channels.runtimeSubscribe, listener);
    }
  },
  profiles: {
    list: () => ipcRenderer.invoke(channels.profilesList),
    getCurrent: () => ipcRenderer.invoke(channels.profilesGetCurrent),
    setCurrent: (profileId: string) => ipcRenderer.invoke(channels.profilesSetCurrent, profileId)
  },
  spaces: {
    list: () => ipcRenderer.invoke(channels.spacesList),
    getCurrent: () => ipcRenderer.invoke(channels.spacesGetCurrent),
    setCurrent: (spaceId: string) => ipcRenderer.invoke(channels.spacesSetCurrent, spaceId)
  },
  settings: {
    get: () => ipcRenderer.invoke(channels.settingsGet),
    update: (patch: Partial<Settings>) => ipcRenderer.invoke(channels.settingsUpdate, patch)
  }
};

contextBridge.exposeInMainWorld("hermesStudio", api);
