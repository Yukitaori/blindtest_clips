const { contextBridge, ipcRenderer } = require("electron");

let playerState = {
  mute: true,
  videoPlaying: false,
  selectedTrack: null,
  loadedTrack: null,
  fileDuration: null,
};

const getTimeControlPosition = (current) => {
  return (parseInt(current) / parseInt(playerState.fileDuration)) * 1000;
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
  playFile: (path) => {
    ipcRenderer.send("playFile", path);
    playerState.selectedTrack = path;
    playerState.loadedTrack = path;
    playerState.videoPlaying = true;
    playerState.mute = true;
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    const muteButton = document.getElementById("playermute");
    playerState.mute
      ? muteButton.classList.add("bg-gray-300")
      : muteButton.classList.remove("bg-gray-300");
    playerState.videoPlaying
      ? playButton.classList.add("bg-gray-300")
      : playButton.classList.remove("bg-gray-300");
    playerState.videoPlaying
      ? pauseButton.classList.remove("bg-gray-300")
      : playButton.classList.add("bg-gray-300");
  },
  play: (path) => {
    console.log(path);
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    const muteButton = document.getElementById("playermute");
    if (playerState.loadedTrack !== path) {
      ipcRenderer.send("playFile", path);
      playerState.selectedTrack = path;
      playerState.loadedTrack = path;
      playerState.videoPlaying = true;
      playerState.mute = true;
      playerState.mute
        ? muteButton.classList.add("bg-gray-300")
        : muteButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? playButton.classList.add("bg-gray-300")
        : playButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-gray-300")
        : pauseButton.classList.add("bg-gray-300");
    } else {
      ipcRenderer.send("play");
      playerState.videoPlaying = true;
      playerState.mute
        ? muteButton.classList.add("bg-gray-300")
        : muteButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? playButton.classList.add("bg-gray-300")
        : playButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-gray-300")
        : pauseButton.classList.add("bg-gray-300");
    }
  },
  pause: () => {
    if (playerState.videoPlaying) {
      ipcRenderer.send("pause");
      playerState.videoPlaying = false;
      const playButton = document.getElementById("playerplay");
      const pauseButton = document.getElementById("playerpause");
      const muteButton = document.getElementById("playermute");
      playerState.mute
        ? muteButton.classList.add("bg-gray-300")
        : muteButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? playButton.classList.add("bg-gray-300")
        : playButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-gray-300")
        : pauseButton.classList.add("bg-gray-300");
    }
  },
  stop: () => {
    ipcRenderer.send("stop");
    playerState.videoPlaying = false;
    let timeControl = document.getElementById("timecontrol");
    timeControl.value = 0;
    let currentTime = document.getElementById("current");
    currentTime.innerText = getReadableTime(0);
    let durationTime = document.getElementById("duration");
    durationTime.innerText = getReadableTime(0);
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    playButton.classList.remove("bg-gray-300");
    pauseButton.classList.remove("bg-gray-300");
  },
  changeTime: (time) => {
    ipcRenderer.send("changeTime", (time / 1000) * playerState.fileDuration);
    let currentTime = document.getElementById("current");
    currentTime.innerText = getReadableTime(
      (time / 1000) * playerState.fileDuration
    );
  },
  mute: () => {
    ipcRenderer.send("mute");
    playerState.mute = !playerState.mute;
    playerState.mute;
    const muteButton = document.getElementById("playermute");
    playerState.mute
      ? muteButton.classList.add("bg-gray-300")
      : muteButton.classList.remove("bg-gray-300");
  },
  volumeUp: (volume) => ipcRenderer.send("volumeUp", volume),
  volumeDown: (volume) => ipcRenderer.send("volumeDown", volume),
});

ipcRenderer.on("getDuration", (event, duration) => {
  playerState.fileDuration = duration;
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
  let durationTime = document.getElementById("duration");
  durationTime.innerText = getReadableTime(0);
  const playButton = document.getElementById("playerplay");
  const pauseButton = document.getElementById("playerpause");
  playButton.classList.remove("bg-gray-300");
  pauseButton.classList.remove("bg-gray-300");
});
