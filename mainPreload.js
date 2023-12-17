const { contextBridge, ipcRenderer } = require("electron");

let fileDuration;
const getTimeControlPosition = (current) => {
  return (parseInt(current) / parseInt(fileDuration)) * 1000;
};

const getReadableTime = (rawTime) => {
  let readableTime;
  let minutes = Math.floor(rawTime / 60);
  let seconds = (rawTime % 60).toFixed();
  readableTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  return readableTime;
};

contextBridge.exposeInMainWorld("player", {
  playFile: (path) => ipcRenderer.send("playFile", path),
  play: () => ipcRenderer.send("play"),
  pause: () => ipcRenderer.send("pause"),
  stop: () => ipcRenderer.send("stop"),
  mute: () => ipcRenderer.send("mute"),
  volumeUp: (volume) => ipcRenderer.send("volumeUp", volume),
  volumeDown: (volume) => ipcRenderer.send("volumeDown", volume),
  changeTime: (time) => {
    ipcRenderer.send("changeTime", (time / 1000) * fileDuration);
    let currentTime = document.getElementById("current");
    currentTime.innerText = getReadableTime((time / 1000) * fileDuration);
  },
});

ipcRenderer.on("getDuration", (event, duration) => {
  fileDuration = duration;
  let durationTime = document.getElementById("duration");
  durationTime.innerText = getReadableTime(duration).toString();
});

ipcRenderer.on("getCurrent", (event, current) => {
  let timeControl = document.getElementById("timecontrol");
  let currentTime = document.getElementById("current");
  currentTime.innerText = getReadableTime(current).toString();
  timeControl.value = getTimeControlPosition(current);
});

ipcRenderer.on("videoover", () => {
  let timeControl = document.getElementById("timecontrol");
  timeControl.value = 0;
  let currentTime = document.getElementById("current");
  currentTime.innerText = getReadableTime(0);
});
