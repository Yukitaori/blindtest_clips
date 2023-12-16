const { contextBridge, ipcRenderer } = require("electron");

// Ecoute de l'événement "playFile" et lancement de la video selon le chemin spécifié dans la mainWindow
ipcRenderer.on("playFile", (event, path) => {
  console.log("here");
  let videoPlayer = document.getElementById("videoplayer");
  console.log(path);
  videoPlayer.setAttribute("src", path);
  videoPlayer.play();
  videoPlayer.setAttribute("preload", "metadata");
  videoPlayer.addEventListener("loadedmetadata", () => {
    ipcRenderer.send("duration", videoPlayer.duration.toFixed());
  });
  videoPlayer.addEventListener("ended", () => {
    videoPlayer.load();
  });
});

// Ecoute de l'événement "play" et reprise de la video
ipcRenderer.on("play", () => {
  console.log("play");
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.play();
});

// Ecoute de l'événement "pause" et mise en pause de la video
ipcRenderer.on("pause", () => {
  console.log("pause");
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.pause();
});

// Ecoute de l'événement "pause" et mise en pause de la video
ipcRenderer.on("stop", () => {
  console.log("stop");
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.load();
});
