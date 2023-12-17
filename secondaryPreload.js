const { contextBridge, ipcRenderer } = require("electron");

const getCurrentTime = () => {
  let videoPlayer = document.getElementById("videoplayer");
  let currentTime = videoPlayer.currentTime;
  ipcRenderer.send("current", currentTime.toFixed());
};
let getCurrentTimeEverySecond;
const intervals = [];

// Ecoute de l'événement "playFile" et lancement de la video selon le chemin spécifié dans la mainWindow
ipcRenderer.on("playFile", (event, path) => {
  console.log("here");
  let videoPlayer = document.getElementById("videoplayer");
  console.log(path);
  videoPlayer.setAttribute("src", path);
  videoPlayer.play();
  if (videoPlayer.src) {
    clearInterval(intervals[0]);
    intervals.shift();
    intervals.push(
      (getCurrentTimeEverySecond = setInterval(getCurrentTime, 1000))
    );
  }
  videoPlayer.setAttribute("preload", "metadata");
  videoPlayer.addEventListener("loadedmetadata", () => {
    ipcRenderer.send("duration", videoPlayer.duration.toFixed());
  });
  videoPlayer.addEventListener("ended", () => {
    delete videoPlayer.src;
    clearInterval(intervals[0]);
    // TODO Mettre en place un écran noir lors de l'arrêt et supprimer la source
  });
});

// Ecoute de l'événement "play" et reprise de la video
ipcRenderer.on("play", () => {
  console.log("play");
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.play();
  if (videoPlayer.src) {
    clearInterval(intervals[0]);
    intervals.shift();
    intervals.push(
      (getCurrentTimeEverySecond = setInterval(getCurrentTime, 1000))
    );
  }
});

// Ecoute de l'événement "pause" et mise en pause de la video
ipcRenderer.on("pause", () => {
  console.log("pause");
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.pause();
  clearInterval(intervals[0]);
});

// Ecoute de l'événement "stop" et arrêt de la video
ipcRenderer.on("stop", () => {
  console.log("stop");
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.load();
  clearInterval(intervals[0]);
  // TODO Mettre en place un écran noir lors de l'arrêt et supprimer la source
});

// Ecoute de l'événement "mute" et mise en silence de la video
ipcRenderer.on("mute", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.muted = !videoPlayer.muted;
  console.log("muted ? ", videoPlayer.muted);
});
