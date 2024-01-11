const { contextBridge, ipcRenderer } = require("electron");

// le state du player : les informations sont mises à jour à chaque action
const playerState = {
  playlist: null,
  mute: true,
  videoPlaying: false,
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
  const minutes = Math.floor(rawTime / 60);
  const seconds = (rawTime % 60).toFixed();

  readableTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return readableTime;
};

// Cette fonction permet de gérer le changement de couleur de fond des inputs de type range lorsque l'on change la valeur
const displaySlidingBackgroundColor = (input, firstColor, secondColor) => {
  let value = (input.value - input.min) / (input.max - input.min);
  input.style.backgroundImage = `-webkit-gradient(linear, left top, right top, color-stop(${value}, var(--${firstColor})), color-stop(${value}, var(--${secondColor})))`;
};

// Cette fonction permet d'envoyer la track sélectionnée pour la lecture à la secondaryWindow et gère la mise à jour du state et tous les effets liés aux styles des boutons
// Suppression de l'image affichée s'il y en a une + remise à zéro du select des images
const playTrack = (track) => {
  console.log(track);
  if (track) {
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    const muteButton = document.getElementById("playermute");
    const imageList = document.getElementById("imageList");
    ipcRenderer.send("displayImage", null);
    imageList.value = "video";

    ipcRenderer.send("playFile", track.path);
    playerState.loadedTrack = track;
    playerState.videoPlaying = true;
    playerState.mute = true;

    playerState.mute
      ? muteButton.classList.add("bg-fifth")
      : muteButton.classList.remove("bg-fifth");
    playerState.videoPlaying
      ? playButton.classList.add("bg-green-800")
      : playButton.classList.remove("bg-green-800");
    playerState.videoPlaying
      ? pauseButton.classList.remove("bg-orange-800")
      : pauseButton.classList.add("bg-orange-800");
  } else {
    ipcRenderer.send("playFile", null);
  }
};

// Ce contextBridge contient toutes les méthodes du player
contextBridge.exposeInMainWorld("player", {
  getPlaylist: (list) => {
    playerState.playlist = list;
  },
  getLoadedTrack: (track) => {
    playTrack(track);
    playerState.loadedTrack = track;
  },

  playFile: (track) => playTrack(track),

  play: () => {
    const muteButton = document.getElementById("playermute");
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    ipcRenderer.send("play");
    playerState.videoPlaying = true;
    playerState.mute
      ? muteButton.classList.add("bg-fifth")
      : muteButton.classList.remove("bg-fifth");
    playerState.videoPlaying
      ? playButton.classList.add("bg-green-800")
      : playButton.classList.remove("bg-green-800");
    playerState.videoPlaying
      ? pauseButton.classList.remove("bg-orange-800")
      : pauseButton.classList.add("bg-orange-800");
  },

  pause: () => {
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    const muteButton = document.getElementById("playermute");

    if (playerState.videoPlaying) {
      ipcRenderer.send("pause");
      playerState.videoPlaying = false;
      playerState.mute
        ? muteButton.classList.add("bg-fifth")
        : muteButton.classList.remove("bg-fifth");
      playerState.videoPlaying
        ? playButton.classList.add("bg-green-800")
        : playButton.classList.remove("bg-green-800");
      playerState.videoPlaying
        ? pauseButton.classList.remove("bg-orange-800")
        : pauseButton.classList.add("bg-orange-800");
    }
  },

  stop: () => {
    const playButton = document.getElementById("playerplay");
    const pauseButton = document.getElementById("playerpause");
    const timeControl = document.getElementById("timecontrol");
    const currentTime = document.getElementById("current");
    const durationTime = document.getElementById("duration");

    ipcRenderer.send("stop");
    playerState.videoPlaying = false;
    timeControl.value = 0;
    currentTime.innerText = getReadableTime(0);
    durationTime.innerText = getReadableTime(0);
    playButton.classList.remove("bg-green-800");
    pauseButton.classList.remove("bg-orange-800");
    displaySlidingBackgroundColor(timeControl, "primary", "third");
  },

  changeTime: (time) => {
    const currentTime = document.getElementById("current");

    ipcRenderer.send("changeTime", (time / 1000) * playerState.fileDuration);
    currentTime.innerText = getReadableTime(
      (time / 1000) * playerState.fileDuration
    );
  },

  displaySlidingInputValue: (time) => {
    const currentTime = document.getElementById("current");
    currentTime.innerText = getReadableTime(
      (time / 1000) * playerState.fileDuration
    );
  },

  displaySlidingBackgroundColor: (input, firstColor, secondColor) => {
    displaySlidingBackgroundColor(input, firstColor, secondColor);
  },

  mute: () => {
    const muteButton = document.getElementById("playermute");

    ipcRenderer.send("mute");
    playerState.mute = !playerState.mute;
    playerState.mute
      ? muteButton.classList.add("bg-fifth")
      : muteButton.classList.remove("bg-fifth");
  },

  changeVolume: (volume) => ipcRenderer.send("changeVolume", volume),

  previousTrack: () => {
    if (playerState.loadedTrack.id - 1 >= 0) {
      const currentTime = document.getElementById("current");
      const timeControl = document.getElementById("timecontrol");
      const trackToPlay = playerState.playlist[playerState.loadedTrack.id - 1];

      currentTime.innerText = getReadableTime(0).toString();
      timeControl.value = getTimeControlPosition(0);
      playTrack(trackToPlay);
    }
  },

  nextTrack: () => {
    if (playerState.loadedTrack.id + 1 < playerState.playlist.length) {
      const currentTime = document.getElementById("current");
      const timeControl = document.getElementById("timecontrol");
      let trackToPlay = playerState.playlist[playerState.loadedTrack.id + 1];
      currentTime.innerText = getReadableTime(0).toString();
      timeControl.value = getTimeControlPosition(0);
      playTrack(trackToPlay);
    }
  },

  stopGetCurrent: () => {
    ipcRenderer.send("stopGetCurrent");
  },
});

contextBridge.exposeInMainWorld("display", {
  displayVideoOnly: () => {
    ipcRenderer.send("displayVideoOnly");
  },
  displayVideoAndScores: (teams) => {
    ipcRenderer.send("displayVideoAndScores", teams);
  },
  displayVideoAndPodium: (teams) => {
    ipcRenderer.send("displayVideoAndPodium", teams);
  },
  displayImage: (path) => {
    ipcRenderer.send("displayImage", path);
  },
  displayGif: (path) => {
    ipcRenderer.send("displayGif", path);
  },
  displayInfo: (isDisplay, displayRoundsState) => {
    const displayInfoButton = document.getElementById("displayInfoButton");
    ipcRenderer.send("displayInfo", isDisplay, displayRoundsState);
    displayInfoButton.classList.toggle("bg-fifth");
  },
});

// Ecoute du message getDuration, qui permet de récupérer de la secondaryWindow la durée maximale de la loadedTrack et de l'afficher sur l'input range
ipcRenderer.on("getDuration", (event, duration) => {
  const durationTime = document.getElementById("duration");

  playerState.fileDuration = duration;
  durationTime.innerText = getReadableTime(duration).toString();
});

// Ecoute du message getCurrent, qui permet de récupérer de la secondaryWindow le currentTime de la loadedTrack et de l'afficher sur l'input range
ipcRenderer.on("getCurrent", (event, current) => {
  const currentTime = document.getElementById("current");
  const timeControl = document.getElementById("timecontrol");

  currentTime.innerText = getReadableTime(current).toString();
  timeControl.value = getTimeControlPosition(current);
  displaySlidingBackgroundColor(timeControl, "primary", "third");
});

// Ecoute du message videoover, qui permet de remettre à zéro tous les affichages en fin de video
ipcRenderer.on("videoover", () => {
  const timeControl = document.getElementById("timecontrol");
  const currentTime = document.getElementById("current");
  const durationTime = document.getElementById("duration");
  const playButton = document.getElementById("playerplay");
  const pauseButton = document.getElementById("playerpause");

  timeControl.value = 0;
  currentTime.innerText = getReadableTime(0);
  durationTime.innerText = getReadableTime(0);
  playButton.classList.remove("bg-green-800");
  pauseButton.classList.remove("bg-orange-800");
  displaySlidingBackgroundColor(timeControl, "primary", "third");
});
