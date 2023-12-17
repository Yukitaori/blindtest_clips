const { contextBridge, ipcRenderer } = require("electron");

let fileDuration;
const getTimeControlPosition = (current) => {
  console.log(current);
  console.log(fileDuration);
  console.log((parseInt(current) / parseInt(fileDuration)) * 1000);
  return (parseInt(current) / parseInt(fileDuration)) * 1000;
};

const getReadableTime = (rawTime) => {
  // console.log(rawTime);
  let readableTime;
  let minutes = Math.floor(rawTime / 60);
  let seconds = rawTime % 60;
  readableTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  // console.log(minutes, seconds, readableTime);
  return readableTime;
};

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
  fileDuration = duration;
  let durationTime = document.getElementById("duration");
  durationTime.innerText = getReadableTime(duration).toString();
});

ipcRenderer.on("getCurrent", (event, current) => {
  let currentTime = document.getElementById("current");
  let timeControl = document.getElementById("timecontrol");
  currentTime.innerText = getReadableTime(current).toString();
  timeControl.value = getTimeControlPosition(current);
});
