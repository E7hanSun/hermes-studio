import { BrowserWindow } from "electron";
import { join } from "node:path";

export function createAppWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 720,
    title: "Hermes Studio",
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 12, y: 17 },
    backgroundColor: "#f8f7f4",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return window;
}
