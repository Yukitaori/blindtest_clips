const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("fs", {
  read: (dir) => ipcRenderer.send("readdir", dir),
});

contextBridge.exposeInMainWorld("player", {
  playFile: (path) => ipcRenderer.send("playFile", path),
  play: () => ipcRenderer.send("play"),
  pause: () => ipcRenderer.send("pause"),
  stop: () => ipcRenderer.send("stop"),
  mute: () => ipcRenderer.send("mute"),
  volumeUp: (volume) => ipcRenderer.send("volumeUp", volume),
  volumeDown: (volume) => ipcRenderer.send("volumeDown", volume),
  changeTime: (time) => ipcRenderer.send("changeTime", time),
});

ipcRenderer.on("getDuration", (event, duration) => {
  console.log(duration);
});
