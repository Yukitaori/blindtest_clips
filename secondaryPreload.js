const { ipcRenderer } = require("electron");
// Le tableau d'intervales permet de stocker les différentes intervales, puis de les supprimer lorsque l'on n'en a plus besoin
const intervals = [];

const getCurrentTime = () => {
  let videoPlayer = document.getElementById("videoplayer");
  let currentTime = videoPlayer.currentTime;
  ipcRenderer.send("current", currentTime.toFixed());
};

// Lors du slide de l'input dans la mainWindow, on stoppe l'intervalle
ipcRenderer.on("stopGetCurrent", () => {
  clearInterval(intervals[0]);
});

// Ecoute du message "playFile" et lancement de la video selon le chemin spécifié dans la mainWindow
ipcRenderer.on("playFile", (event, path) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.setAttribute("src", path);
  videoPlayer.play();
  videoPlayer.muted = true;
  if (videoPlayer.src) {
    clearInterval(intervals[0]);
    intervals.shift();
    intervals.push(setInterval(getCurrentTime, 1000));
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

// Ecoute du message "play" et reprise de la video
ipcRenderer.on("play", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.play();
  if (videoPlayer.src) {
    clearInterval(intervals[0]);
    intervals.shift();
    intervals.push(setInterval(getCurrentTime, 1000));
  }
  ipcRenderer.send("duration", videoPlayer.duration.toFixed());
});

// Ecoute du message "pause" et mise en pause de la video
ipcRenderer.on("pause", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.pause();
  clearInterval(intervals[0]);
});

// Ecoute du message "stop" et arrêt de la video
ipcRenderer.on("stop", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.load();
  clearInterval(intervals[0]);
  // TODO Mettre en place un écran noir lors de l'arrêt et supprimer la source
});

// Ecoute du message "mute" et mise en silence de la video
ipcRenderer.on("mute", () => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.muted = !videoPlayer.muted;
});

// Ecoute du message "changeTime" et changement dynamique du currentTime sélectionné via l'input range dans la primaryWindow
// On nettoie les intervalles pour éviter que plusieurs soient actifs en même temps
ipcRenderer.on("changeTime", (event, time) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.currentTime = time;
  clearInterval(intervals[0]);
  intervals.shift();
  intervals.push(setInterval(getCurrentTime, 1000));
});

// Ecoute du message "changeVolume" et changement du volume sélectionné via l'input range dans la primaryWindow
ipcRenderer.on("changeVolume", (event, volume) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.volume = volume;
});

// Ecoute du message "displayVideoOnly" et affichage de la video sans les scores dans la secondaryWindow
ipcRenderer.on("displayVideoOnly", () => {
  let displayScreen = document.getElementById("displayscreen");
  let displayScores = document.createElement("div");
  let nodeToRemove = document.getElementById("displayscores");
  if (nodeToRemove) displayScreen.removeChild(nodeToRemove);
  displayScores.setAttribute("id", "displayscores");
});

// Ecoute du message "displayVideoAndScores" et affichage de la video avec les scores dans la secondaryWindow
ipcRenderer.on("displayVideoAndScores", (event, teams) => {
  let displayScreen = document.getElementById("displayscreen");
  let videoPlayer = document.getElementById("videoplayer");
  let displayScores = document.createElement("div");
  let nodeToRemove = document.getElementById("displayscores");
  if (nodeToRemove) displayScreen.removeChild(nodeToRemove);
  displayScores.setAttribute("id", "displayscores");
  for (let team of teams) {
    let teamBlock = document.createElement("div");
    let teamName = document.createElement("p");
    let teamScore = document.createElement("p");
    teamName.innerText = team.name;
    teamScore.innerText = team.score;
    teamBlock.appendChild(teamName);
    teamBlock.appendChild(teamScore);
    teamName.classList.add("font-bold", "text-2xl");
    teamScore.classList.add(
      "font-bold",
      "text-2xl",
      "opacity-0",
      "animate-fadein"
    );
    teamBlock.classList.add(
      "flex",
      "justify-between",
      "gap-4",
      "flex-wrap",
      "font-raleway"
    );
    displayScores.appendChild(teamBlock);
  }
  displayScores.classList.add(
    "h-full",
    "bg-transparentDisplay",
    "border-b-4",
    "border-solid",
    "border-black",
    "text-white",
    "z-20",
    "absolute",
    "right-0",
    "top-0",
    "flex",
    "flex-col",
    "gap-2",
    "animate-right-come",
    "p-4"
  );
  displayScreen.insertBefore(displayScores, videoPlayer);
});

// Ecoute du message "displayVideoAndPodium" et affichage de la video avec le podium dans la secondaryWindow
ipcRenderer.on("displayVideoAndPodium", (event, teams) => {
  let displayScreen = document.getElementById("displayscreen");
  let videoPlayer = document.getElementById("videoplayer");
  let displayScores = document.createElement("div");
  let nodeToRemove = document.getElementById("displayscores");
  let trophiesUrl = [
    "./src/assets/images/gold-trophy.png",
    "./src/assets/images/silver-trophy.png",
    "./src/assets/images/bronze-trophy.png",
  ];
  if (nodeToRemove) displayScreen.removeChild(nodeToRemove);
  displayScores.setAttribute("id", "displayscores");
  for (let i = 0; i < 3 && i < teams.length; i++) {
    let teamBlock = document.createElement("div");
    let teamName = document.createElement("p");
    let teamScore = document.createElement("p");
    let teamTrophy = document.createElement("img");
    teamTrophy.src = trophiesUrl[i];
    teamName.innerText = teams[i].name;
    teamScore.innerText = teams[i].score;
    teamBlock.appendChild(teamName);
    teamBlock.appendChild(teamTrophy);
    teamBlock.appendChild(teamScore);
    teamName.classList.add("font-bold", "text-2xl");
    teamTrophy.classList.add(
      "opacity-0",
      `animate-fadein${i.toString()}`,
      "w-[50%]"
    );
    teamScore.classList.add(
      "font-bold",
      "text-4xl",
      "2xl:text-9xl",
      "opacity-0",
      i === 0
        ? "animate-fadein0"
        : i === 1
        ? "animate-fadein1"
        : "animate-fadein2"
    );
    teamBlock.classList.add(
      "flex",
      "flex-col",
      "justify-between",
      "items-center",
      "gap-4",
      "font-raleway"
    );
    displayScores.appendChild(teamBlock);
    if (displayScores.childNodes.length === 3) break;
  }
  displayScores.classList.add(
    "w-full",
    "bg-transparentDisplay",
    "border-b-4",
    "border-solid",
    "border-black",
    "text-white",
    "z-30",
    "absolute",
    "top-0",
    "flex",
    "justify-between",
    "gap-2",
    "animate-top-come"
  );
  displayScreen.insertBefore(displayScores, videoPlayer);
});

// Ecoute du message "displayImage" et affichage du carton sélectionné dans la primaryWindow
ipcRenderer.on("displayImage", (event, path) => {
  let displayScreen = document.getElementById("displayscreen");
  let blackBackground = document.getElementById("blackBackground");
  if (blackBackground) {
    displayScreen.removeChild(blackBackground);
  }
  if (path) {
    let blackBackground = document.createElement("div");
    blackBackground.classList.add(
      "bg-black",
      "absolute",
      "top-0",
      "w-full",
      "h-full",
      "flex",
      "justify-center",
      "items-center",
      "animate-right-come",
      "z-10"
    );
    blackBackground.setAttribute("id", "blackBackground");
    let imageToDisplay = document.createElement("img");
    imageToDisplay.setAttribute("src", path);
    imageToDisplay.classList.add("w-[90%]", "h-[90%]", "object-contain");
    blackBackground.appendChild(imageToDisplay);
    displayScreen.appendChild(blackBackground);
  }
});

// Ecoute du message "displayGif" et affichage du gif sélectionné dans la primaryWindow
ipcRenderer.on("displayGif", (event, path) => {
  let displayScreen = document.getElementById("displayscreen");
  let gifToRemove = document.getElementById("gifToDisplay");
  if (gifToRemove) displayScreen.removeChild(gifToRemove);
  if (path) {
    let gifToDisplay = document.createElement("img");
    gifToDisplay.setAttribute("id", "gifToDisplay");
    gifToDisplay.setAttribute("src", path);
    gifToDisplay.classList.add(
      "bg-black",
      "absolute",
      "w-fit",
      "h-fit",
      "max-w-[50%]",
      "max-h-[50%]",
      "object-contain",
      "left-0",
      "bottom-0",
      "animate-left-come",
      "z-20"
    );
    displayScreen.appendChild(gifToDisplay);
  }
});

// Ecoute du message "displayInfo" et affichage du carton d'info + les informations de manches le cas échéant
ipcRenderer.on("displayInfo", (event, isDisplay, displayRoundsState) => {
  console.log(isDisplay);
  let infoBackground = document.getElementById("infoBackground");
  let roundsDisplay = document.getElementById("roundsDisplay");
  let firstRoundDisplay = document.getElementById("firstRoundDisplay");
  let secondRoundDisplay = document.getElementById("secondRoundDisplay");
  firstRoundDisplay.innerText = ``;
  secondRoundDisplay.innerText = ``;
  if (isDisplay) {
    infoBackground.classList.remove("hidden");
    infoBackground.classList.add("flex");
  } else {
    infoBackground.classList.remove("flex");
    infoBackground.classList.add("hidden");
  }
  if (
    displayRoundsState.isDisplay &&
    (displayRoundsState.first || displayRoundsState.second)
  ) {
    console.log(displayRoundsState);
    if (displayRoundsState.first && displayRoundsState.second) {
      roundsDisplay.classList.remove("hidden");
      roundsDisplay.classList.add("flex");
      firstRoundDisplay.innerText = `Première manche : ${displayRoundsState.first}`;
      secondRoundDisplay.innerText = `Deuxième manche : ${displayRoundsState.second}`;
    } else if (displayRoundsState.first) {
      roundsDisplay.classList.remove("hidden");
      roundsDisplay.classList.add("flex");
      firstRoundDisplay.innerText = `Début de la manche : ${displayRoundsState.first}`;
    }
  } else {
    roundsDisplay.classList.remove("flex");
    roundsDisplay.classList.add("hidden");
  }
});
