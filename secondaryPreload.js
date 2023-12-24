const { contextBridge, ipcRenderer } = require("electron");
let getCurrentTimeEverySecond;
const intervals = [];

const getCurrentTime = () => {
  let videoPlayer = document.getElementById("videoplayer");
  let currentTime = videoPlayer.currentTime;
  ipcRenderer.send("current", currentTime.toFixed());
};

// Ecoute de l'événement "playFile" et lancement de la video selon le chemin spécifié dans la mainWindow
ipcRenderer.on("playFile", (event, path) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.setAttribute("src", path);
  videoPlayer.play();
  videoPlayer.muted = true;
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
    ipcRenderer.send("videoover");
    // TODO Mettre en place un écran noir lors de l'arrêt et supprimer la source
  });
});

// Ecoute de l'événement "play" et reprise de la video
ipcRenderer.on("play", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.play();
  if (videoPlayer.src) {
    clearInterval(intervals[0]);
    intervals.shift();
    intervals.push(
      (getCurrentTimeEverySecond = setInterval(getCurrentTime, 1000))
    );
  }
  ipcRenderer.send("duration", videoPlayer.duration.toFixed());
});

// Ecoute de l'événement "pause" et mise en pause de la video
ipcRenderer.on("pause", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.pause();
  clearInterval(intervals[0]);
});

// Ecoute de l'événement "stop" et arrêt de la video
ipcRenderer.on("stop", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.load();
  clearInterval(intervals[0]);
  // TODO Mettre en place un écran noir lors de l'arrêt et supprimer la source
});

// Ecoute de l'événement "mute" et mise en silence de la video
ipcRenderer.on("mute", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.muted = !videoPlayer.muted;
});

// Ecoute de l'événement "changeTime" et changement dynamique du currentTime sélectionné via l'input range dans la primaryWindow
// On nettoie les intervalles pour éviter que plusieurs soient actifs en même temps
ipcRenderer.on("changeTime", (event, time) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.currentTime = time;
  clearInterval(intervals[0]);
  intervals.shift();
  intervals.push(
    (getCurrentTimeEverySecond = setInterval(getCurrentTime, 1000))
  );
});

// Ecoute de l'événement "changeVolume" et changement du volume sélectionné via l'input range dans la primaryWindow
ipcRenderer.on("changeVolume", (event, volume) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.volume = volume;
});

ipcRenderer.on("displayVideoOnly", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.innerHTML = "";
});

ipcRenderer.on("displayVideoAndScores", (event, teams) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.innerHTML = "";
  let displayScores = document.createElement("div");
});

ipcRenderer.on("displayVideoAndPodium", (event, teams) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.innerHTML = "";
  let displayPodium = document.createElement("div");
});
