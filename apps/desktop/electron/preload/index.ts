import { contextBridge, ipcRenderer } from "electron";
import {
  channels,
  type AddSpaceInput,
  type ConversationEvent,
  type HermesStudioApi,
  type MemoryUpdateInput,
  type MessageInput,
  type SkillSearchInput,
  type Settings
} from "@hermes-studio/bridge";

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
  memory: {
    list: () => ipcRenderer.invoke(channels.memoryList),
    update: (input: MemoryUpdateInput) => ipcRenderer.invoke(channels.memoryUpdate, input)
  },
  skills: {
    listInstalled: () => ipcRenderer.invoke(channels.skillsListInstalled),
    searchHub: (input: SkillSearchInput) => ipcRenderer.invoke(channels.skillsSearchHub, input),
    installFromHub: (skillId: string) => ipcRenderer.invoke(channels.skillsInstallFromHub, skillId),
    setEnabled: (skillId: string, enabled: boolean) => ipcRenderer.invoke(channels.skillsSetEnabled, skillId, enabled)
  },
  spaces: {
    list: () => ipcRenderer.invoke(channels.spacesList),
    getCurrent: () => ipcRenderer.invoke(channels.spacesGetCurrent),
    setCurrent: (spaceId: string) => ipcRenderer.invoke(channels.spacesSetCurrent, spaceId),
    add: (input: AddSpaceInput) => ipcRenderer.invoke(channels.spacesAdd, input),
    remove: (spaceId: string) => ipcRenderer.invoke(channels.spacesRemove, spaceId)
  },
  settings: {
    get: () => ipcRenderer.invoke(channels.settingsGet),
    update: (patch: Partial<Settings>) => ipcRenderer.invoke(channels.settingsUpdate, patch)
  }
};

contextBridge.exposeInMainWorld("hermesStudio", api);
