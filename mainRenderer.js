//////////////////////// PARTIE PLAYLIST ////////////////////////

// La selectedTrack est la track sélectionnée dans la liste (pas celle qui est chargée dans le player)
let selectedTrack;
// La loadedTrack est la track chargée dans le player
let loadedTrack;
// La playlist permet  l'enregistrement des tracks dans leur oredre de diffusion
const playlist = [];
const tracklist = document.getElementById("tracklist");
const dropzone = document.getElementById("dropzone");
const timeControl = document.getElementById("timecontrol");
const playButton = document.getElementById("playerplay");
const pauseButton = document.getElementById("playerpause");
const stopButton = document.getElementById("playerstop");
const muteButton = document.getElementById("playermute");
const previousButton = document.getElementById("playerprev");
const nextButton = document.getElementById("playernext");
const volumeControl = document.getElementById("volumecontrol");

// Cette fonction permet la génération de la Tracklist au sein de la dropzone
const createTrackList = () => {
  // la tracklist précédente est effacée
  tracklist.innerHTML = "";
  let index = 0;

  if (document.getElementById("playlistInstruction")) {
    document
      .getElementById("dropzone")
      .removeChild(document.getElementById("playlistInstruction"));
  }

  // Pour chaque track de la playlist, une entrée est générée dans la liste
  playlist.forEach((file) => {
    file.trackNumber = index + 1;
    let track = document.createElement("li");

    let trackbutton = document.createElement("button");
    track.classList.add(
      "cursor-pointer",
      "text-left",
      "text-sm",
      "pl-2",
      "flex",
      "items-center",
      "gap-2"
    );

    track.addEventListener("mouseover", () => {
      track.classList.add("bg-gray-100");
    });
    track.addEventListener("mouseleave", () => {
      track.classList.remove("bg-gray-100");
    });

    // Le double clic permet le chargement de la piste dans le player (loadedTrack)
    track.addEventListener("dblclick", () => {
      player.playFile(file, index);
      loadedTrack = file;
      createTrackList();
    });
    // Le clic simple permet juste de sélectionner une piste
    track.addEventListener("click", () => {
      selectedTrack = file;
      createTrackList();
    });
    if (selectedTrack === file) track.classList.add("bg-gray-200");
    if (loadedTrack === file) {
      track.innerHTML =
        '<img src="./src/assets/icons/play.png" class="h-2 w-2"></img>';
      track.classList.add("bg-gray-300", "font-semibold");
    }
    trackbutton.innerText = `${file.trackNumber} - ${file.name}`;
    track.appendChild(trackbutton);
    tracklist.appendChild(track);
    index++;
  });
};

// Gestion du drag'n'drop sur la zone d'affichage des pistes video
dropzone.addEventListener("drop", (e) => {
  dropzone.classList.remove("bg-gray-300");
  e.preventDefault();
  // Au drop, la playlist est de nouveau générée intégralement et transmise au preload pour la gestion
  Object.entries(event.dataTransfer.files).forEach((file) => {
    file[1].id = file[0];
    playlist.push(file[1]);
  });
  createTrackList();
  player.getPlaylist(playlist);
});

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  // Le texte d'information est supprimé au drop des premières pistes
  if (document.getElementById("playlistInstruction"))
    document
      .getElementById("dropzone")
      .removeChild(document.getElementById("playlistInstruction"));
});

// Gestion des animations lors du drag au-dessus de la dropzone
dropzone.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dropzone.classList.add("bg-gray-300");
});
dropzone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dropzone.classList.remove("bg-gray-300");
});

// TODO mettre en place des raccourcis clavier pour chaque action
pauseButton.addEventListener("click", () => {
  player.pause();
});
playButton.addEventListener("click", () => {
  // TODO revoir la gestion du play/pause (en fonction de la selectedTrack)
  // Double clic uniquement pour le playFile ?
  // voir pour remettre la selectedTrack d'origine lors de la pause ???
  // Sous VLC le play est indépendant de la seletedTrack
  // player.play(selectedTrack);
  // loadedTrack = selectedTrack;
  player.play();
});
stopButton.addEventListener("click", () => {
  player.stop();
});
muteButton.addEventListener("click", () => {
  player.mute();
});
previousButton.addEventListener("click", () => {
  player.previousTrack();
  if (parseInt(loadedTrack.id) - 1 >= 0) {
    selectedTrack = playlist[parseInt(loadedTrack.id) - 1];
    loadedTrack = playlist[parseInt(loadedTrack.id) - 1];
  }
  createTrackList();
});
nextButton.addEventListener("click", () => {
  player.nextTrack();
  if (parseInt(loadedTrack.id) + 1 <= playlist.length - 1) {
    selectedTrack = playlist[parseInt(loadedTrack.id) + 1];
    loadedTrack = playlist[parseInt(loadedTrack.id) + 1];
  }
  createTrackList();
});
timeControl.addEventListener("change", () => {
  // TODO Mettre en place un message qui stoppe le getCurrent pendant la modification de l'input
  player.changeTime(timeControl.value);
});
volumeControl.addEventListener("change", () => {
  player.changeVolume(volumeControl.value);
});

//////////////////////// PARTIE TEAMLIST ////////////////////////

const teams = [];
const sortAscAlphaButton = document.getElementById("sortAscAlpha");
const sortDescAlphaButton = document.getElementById("sortDescAlpha");
const sortAscNumButton = document.getElementById("sortAscNum");
const sortDescNumButton = document.getElementById("sortDescNum");

const createTeamList = () => {
  const teamList = document.getElementById("teamlist");
  teamList.innerHTML =
    '<li class="p-1 pl-4"><button class="h-10 w-10 border border-solid border-black rounded-3xl" id="addTeam">+</button></li>';
  const addTeamButton = document.getElementById("addTeam");
  addTeamButton.addEventListener("click", () => addTeamLine());
  for (let team of teams) {
    addTeamLine(team);
  }
};

const handleScore = (action, team) => {
  if (action === "increment") {
    team.score++;
  }
  if (action === "decrement") {
    team.score--;
  }
  createTeamList();
};

const handleSort = (sortType) => {
  if (sortType === "ascAlpha") {
    teams.sort((a, b) => b.name - a.name);
    createTeamList();
  }
  if (sortType === "descAlpha") {
    teams.sort((a, b) => a.name - b.name);
    createTeamList();
  }
  if (sortType === "ascNum") {
    teams.sort((a, b) => b.score - a.score);
    createTeamList();
  }
  if (sortType === "descNum") {
    teams.sort((a, b) => a.score - b.score);
    createTeamList();
  }
};

const addTeamLine = (teamToAdd) => {
  if (!teamToAdd) {
    teamToAdd = {
      id: teams.length + 1,
      name: "Nouvelle équipe",
      score: 0,
    };
    teams.push(teamToAdd);
  }
  const teamList = document.getElementById("teamlist");
  const teamLine = document.createElement("li");
  const teamName = document.createElement("p");
  const teamDeleteButton = document.createElement("button");
  const teamScore = document.createElement("div");
  const teamScoreDecButton = document.createElement("button");
  const teamScoreDisplay = document.createElement("p");
  const teamScoreIncButton = document.createElement("button");
  teamLine.classList.add(
    "flex",
    "justify-between",
    "align-center",
    "gap-1",
    "h-10",
    "px-4"
  );
  teamScore.classList.add("flex", "gap-4", "h-10");
  teamScoreDecButton.classList.add(
    "h-10",
    "w-10",
    "p-1",
    "border",
    "border-black",
    "border-solid",
    "shadow-buttonShadow"
  );
  teamScoreIncButton.classList.add(
    "h-10",
    "w-10",
    "p-1",
    "border",
    "border-black",
    "border-solid",
    "shadow-buttonShadow"
  );
  teamScoreDisplay.classList.add(
    "h-10",
    "w-10",
    "p-1",
    "text-center",
    "border",
    "border-black",
    "border-solid"
  );
  teamDeleteButton.classList.add(
    "h-10",
    "w-10",
    "p-1",
    "border",
    "border-black",
    "border-solid",
    "shadow-buttonShadow"
  );
  teamName.innerText = teamToAdd.name;
  teamDeleteButton.innerText = "🗑️";
  teamScoreDecButton.innerText = "-1";
  teamScoreIncButton.innerText = "+1";
  teamScoreDisplay.innerText = teamToAdd.score;
  teamScore.appendChild(teamScoreDecButton);
  teamScore.appendChild(teamScoreDisplay);
  teamScore.appendChild(teamScoreIncButton);
  teamLine.appendChild(teamName);
  teamLine.appendChild(teamScore);
  teamLine.appendChild(teamDeleteButton);
  teamList.prepend(teamLine);
  animateButtons();

  teamScoreDecButton.addEventListener("click", () => {
    handleScore("decrement", teamToAdd);
  });
  teamScoreIncButton.addEventListener("click", () => {
    handleScore("increment", teamToAdd);
  });
  teamDeleteButton.addEventListener("click", () => {
    teams.splice(
      teams.indexOf(teams.find((team) => team.id === teamToAdd.id)),
      1
    );
    createTeamList();
  });
};
createTeamList();

sortAscAlphaButton.addEventListener("click", () => handleSort("ascAlpha"));
sortDescAlphaButton.addEventListener("click", () => handleSort("descAlpha"));
sortAscNumButton.addEventListener("click", () => handleSort("ascNum"));
sortDescNumButton.addEventListener("click", () => handleSort("descNum"));

//////////////////////// GENERAL ////////////////////////

// Animation des boutons
function animateButtons() {
  const buttons = document.getElementsByTagName("button");
  for (let button of buttons) {
    button.addEventListener("mousedown", () => {
      button.classList.remove("shadow-buttonShadow");
      button.classList.add("translate-x-[3px]");
      button.classList.add("translate-y-[3px]");
    });
    button.addEventListener("mouseup", () => {
      button.classList.add("shadow-buttonShadow");
      button.classList.remove("translate-x-[3px]");
      button.classList.remove("translate-y-[3px]");
    });
  }
}
animateButtons();
