const { ipcRenderer } = require("electron");
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

// Ecoute de l'événement "play" et reprise de la video
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
  intervals.push(setInterval(getCurrentTime, 1000));
});

// Ecoute de l'événement "changeVolume" et changement du volume sélectionné via l'input range dans la primaryWindow
ipcRenderer.on("changeVolume", (event, volume) => {
  let videoPlayer = document.getElementById("videoplayer");
  videoPlayer.volume = volume;
});

ipcRenderer.on("displayVideoOnly", () => {
  let displayScreen = document.getElementById("displayscreen");
  let displayScores = document.createElement("div");
  let nodeToRemove = document.getElementById("displayscores");
  if (nodeToRemove) displayScreen.removeChild(nodeToRemove);
  displayScores.setAttribute("id", "displayscores");
});

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
    teamBlock.classList.add("flex", "justify-between", "gap-4", "flex-wrap");
    displayScores.appendChild(teamBlock);
  }
  displayScores.classList.add(
    "bg-transparentDisplay",
    "border-b-4",
    "border-solid",
    "border-black",
    "text-white",
    "z-10",
    "absolute",
    "right-0",
    "top-0",
    "flex",
    "flex-col",
    "gap-2",
    "animate-right-come"
  );
  displayScreen.insertBefore(displayScores, videoPlayer);
});

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
      "w-[50%]",
      "opacity-0",
      `animate-fadein${i.toString()}`
    );
    teamScore.classList.add(
      "font-bold",
      "text-4xl",
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
      "flex-wrap"
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
    "z-10",
    "absolute",
    "top-0",
    "flex",
    "justify-between",
    "gap-2",
    "animate-top-come"
  );
  displayScreen.insertBefore(displayScores, videoPlayer);
});
