const { contextBridge, ipcRenderer } = require("electron");

// le state du player : les informations sont mises à jour à chaque action
let playerState = {
  playlist: null,
  mute: true,
  videoPlaying: false,
  selectedTrack: null,
  selectedTrackIndex: null,
  loadedTrack: null,
  fileDuration: null,
};

// Cette fonction permet de transformer le currentTime du media en position du curseur sur l'input range
const getTimeControlPosition = (current) => {
  return (parseInt(current) / parseInt(playerState.fileDuration)) * 1000;
};

// Cette fonction permet de transformer chaque donnée temps en chaîne mm:ss lisible par l'utilisateur
const getReadableTime = (rawTime) => {
  let readableTime;
  let minutes = Math.floor(rawTime / 60);
  let seconds = (rawTime % 60).toFixed();
  readableTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  return readableTime;
};

// Cette fonction permet d'envoyer la track sélectionnée pour la lecture à la secondaryWindow
// et gère la mise à jour du state et tous les effets liés aux styles des boutons
const playTrack = (track) => {
  ipcRenderer.send("playFile", track.path);
  playerState.selectedTrack = track;
  playerState.loadedTrack = track;
  playerState.videoPlaying = true;
  playerState.mute = true;
  const playButton = document.getElementById("playerplay");
  const pauseButton = document.getElementById("playerpause");
  const muteButton = document.getElementById("playermute");
  playerState.mute
    ? muteButton.classList.add("bg-gray-300")
    : muteButton.classList.remove("bg-gray-300");
  playerState.videoPlaying
    ? playButton.classList.add("bg-green-800")
    : playButton.classList.remove("bg-green-800");
  playerState.videoPlaying
    ? pauseButton.classList.remove("bg-orange-800")
    : pauseButton.classList.add("bg-orange-800");
};

// Ce contextBridge contient toutes les méthodes du player
contextBridge.exposeInMainWorld("player", {
  getPlaylist: (list) => {
    playerState.playlist = list;
  },
  playFile: (track) => playTrack(track),
  play: (track) => {
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    const muteButton = document.getElementById("playermute");
    if (playerState.loadedTrack.path !== track.path) {
      ipcRenderer.send("playFile", track.path);
      playerState.selectedTrack = track;
      playerState.loadedTrack = track;
      playerState.videoPlaying = true;
      playerState.mute = true;
      playerState.mute
        ? muteButton.classList.add("bg-gray-300")
        : muteButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? playButton.classList.add("bg-green-800")
        : playButton.classList.remove("bg-green-800");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-orange-800")
        : pauseButton.classList.add("bg-orange-800");
    } else {
      ipcRenderer.send("play");
      playerState.videoPlaying = true;
      playerState.mute
        ? muteButton.classList.add("bg-gray-300")
        : muteButton.classList.remove("bg-gray-300");
      playerState.videoPlaying
        ? playButton.classList.add("bg-green-800")
        : playButton.classList.remove("bg-green-800");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-orange-800")
        : pauseButton.classList.add("bg-orange-800");
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
        ? playButton.classList.add("bg-green-800")
        : playButton.classList.remove("bg-green-800");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-orange-800")
        : pauseButton.classList.add("bg-orange-800");
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
    playButton.classList.remove("bg-green-800");
    pauseButton.classList.remove("bg-orange-800");
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
  changeVolume: (volume) => ipcRenderer.send("changeVolume", volume),
  previousTrack: () => {
    if (playerState.playlist.indexOf(playerState.loadedTrack) - 1 >= 0) {
      let trackToPlay =
        playerState.playlist[
          playerState.playlist.indexOf(playerState.loadedTrack) - 1
        ];
      let currentTime = document.getElementById("current");
      currentTime.innerText = getReadableTime(0).toString();
      let timeControl = document.getElementById("timecontrol");
      timeControl.value = getTimeControlPosition(0);
      playTrack(trackToPlay);
    }
  },
  nextTrack: () => {
    if (
      playerState.playlist.indexOf(playerState.loadedTrack) + 1 <
      playerState.playlist.length
    ) {
      let trackToPlay =
        playerState.playlist[
          playerState.playlist.indexOf(playerState.loadedTrack) + 1
        ];
      let currentTime = document.getElementById("current");
      currentTime.innerText = getReadableTime(0).toString();
      let timeControl = document.getElementById("timecontrol");
      timeControl.value = getTimeControlPosition(0);
      playTrack(trackToPlay);
    }
  },
});

// Ecoute du message getDuration, qui permet de récupérer de la secondaryWindow la durée maximale de la loadedTrack et de l'afficher sur l'input range
ipcRenderer.on("getDuration", (event, duration) => {
  playerState.fileDuration = duration;
  let durationTime = document.getElementById("duration");
  durationTime.innerText = getReadableTime(duration).toString();
});

// Ecoute du message getCurrent, qui permet de récupérer de la secondaryWindow le currentTime de la loadedTrack et de l'afficher sur l'input range
ipcRenderer.on("getCurrent", (event, current) => {
  let currentTime = document.getElementById("current");
  currentTime.innerText = getReadableTime(current).toString();
  let timeControl = document.getElementById("timecontrol");
  timeControl.value = getTimeControlPosition(current);
});

// Ecoute du message videoover, qui permet de remettre à zéro tous les affichages en fin de video
ipcRenderer.on("videoover", () => {
  let timeControl = document.getElementById("timecontrol");
  timeControl.value = 0;
  let currentTime = document.getElementById("current");
  currentTime.innerText = getReadableTime(0);
  let durationTime = document.getElementById("duration");
  durationTime.innerText = getReadableTime(0);
  const playButton = document.getElementById("playerplay");
  const pauseButton = document.getElementById("playerpause");
  playButton.classList.remove("bg-green-800");
  pauseButton.classList.remove("bg-orange-800");
});
