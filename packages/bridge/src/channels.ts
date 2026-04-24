export const channels = {
  appGetInfo: "app:get-info",
  runtimeGetStatus: "runtime:get-status",
  runtimeSendMessage: "runtime:send-message",
  runtimeSubscribe: "runtime:subscribe",
  profilesList: "profiles:list",
  profilesGetCurrent: "profiles:get-current",
  profilesSetCurrent: "profiles:set-current",
  spacesList: "spaces:list",
  spacesGetCurrent: "spaces:get-current",
  spacesSetCurrent: "spaces:set-current",
  spacesAdd: "spaces:add",
  spacesRemove: "spaces:remove",
  settingsGet: "settings:get",
  settingsUpdate: "settings:update"
} as const;

export type ChannelName = (typeof channels)[keyof typeof channels];
