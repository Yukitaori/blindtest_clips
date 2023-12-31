//////////////////////// PARTIE PLAYLIST ////////////////////////

// Les selectedTracks sont les tracks sélectionnées dans la liste (pas celle qui est chargée dans le player)
let selectedTracks = [];
// La loadedTrack est la track chargée dans le player
let loadedTrack;
// La playlist permet  l'enregistrement des tracks dans leur oredre de diffusion
const playlist = [];
let textFocus = false;
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
  selectedTracks.sort((a, b) => b.id - a.id);
  // la tracklist précédente est effacée
  tracklist.innerHTML = "";
  let draggedTracks = [];
  let index = 0;
  if (document.getElementById("playlistInstruction")) {
    document
      .getElementById("dropzone")
      .removeChild(document.getElementById("playlistInstruction"));
  }

  // Pour chaque track de la playlist, une entrée est générée dans la liste
  playlist.forEach((file) => {
    file.id = index;
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
    trackbutton.classList.add("text-left");
    // Si une track est survolée, et qu'elle n'est ni selected ni loaded, elle change de style
    // Le style est supprimé lorsquel la track n'est plus survolée
    track.addEventListener("mouseover", () => {
      if (
        file !== loadedTrack &&
        !selectedTracks.includes(file) &&
        draggedTracks.length === 0
      )
        track.classList.add("bg-fourth", "text-white");
    });
    track.addEventListener("mouseleave", () => {
      if (file !== loadedTrack && !selectedTracks.includes(file))
        track.classList.remove("bg-fourth", "text-white");
    });
    // Le double clic permet le chargement de la piste dans le player (loadedTrack)
    track.addEventListener("dblclick", () => {
      selectedTracks = [];
      window.player.playFile(file, index);
      loadedTrack = file;
      createTrackList();
    });
    // Le clic simple permet juste de sélectionner une piste
    track.addEventListener("click", (e) => {
      if (e.shiftKey) {
        let newSelectedTracks = [];
        for (
          let i = Math.min(selectedTracks[0]?.id, file.id);
          i <= Math.max(selectedTracks[0]?.id, file.id);
          i++
        ) {
          newSelectedTracks.push(playlist[i]);
        }
        selectedTracks = newSelectedTracks;
      } else if (e.ctrlKey) {
        selectedTracks.push(file);
      } else {
        selectedTracks = [file];
      }
      createTrackList();
    });
    // Lors de l'appui sur Suppr, les pistes sélectionnées (selectedTracks) sont supprimées
    document.addEventListener("keydown", (e) => {
      if (!textFocus) {
        if (e.key === "Delete" && selectedTracks.includes(file)) {
          playlist.splice(playlist.indexOf(file), selectedTracks.length);
          selectedTracks = [];
          createTrackList();
        }
        if (
          e.key === " " &&
          selectedTracks.length === 1 &&
          selectedTracks.includes(file)
        ) {
          selectedTracks = [];
          window.player.playFile(file);
          loadedTrack = file;
          createTrackList();
        }
      }
    });
    if (selectedTracks.includes(file)) {
      track.setAttribute("draggable", "true");
      track.addEventListener("drag", () => {
        draggedTracks = selectedTracks.slice(0);
      });
      track.addEventListener("dragend", () => {
        draggedTracks = [];
      });
    }

    // Création du témoin de localisation de l'endroit où les pistes vont être insérées lors que l'on drag les fichiers par-dessus
    track.addEventListener("dragenter", (e) => {
      e.preventDefault();
      track.classList.add(
        "pb-4",
        "bg-fifth",
        "border-b",
        "border-double",
        "border-black"
      );
    });
    // Suppression du témoin de localisation de l'endroit où les pistes vont être insérées lors que l'on drag les fichiers en-dehors
    track.addEventListener("dragleave", (e) => {
      e.preventDefault();
      track.classList.remove(
        "pb-4",
        "bg-fifth",
        "border-b",
        "border-double",
        "border-black"
      );
    });
    // Au drop sur une track existante, les fichiers déposés sont insérés dans la playlist à l'index suivant cette track
    // Les tracks déposées deviennent les selectedTracks (si besoin de les supprimer immédiatement)
    track.addEventListener("drop", (e) => {
      console.log(e.toElement);
      e.preventDefault();
      selectedTracks = [];
      if (draggedTracks.length > 0) {
        if (!draggedTracks.includes(file)) {
          draggedTracks.forEach((element) => {
            console.log(element);
            playlist.splice(playlist.indexOf(element), 1);
            playlist.splice(playlist.indexOf(file) + 1, 0, element);
            selectedTracks.push(element);
          });
        }
      } else {
        Object.entries(e.dataTransfer.files).forEach((element) => {
          console.log(element);
          playlist.splice(playlist.indexOf(file) + 1, 0, element[1]);
          selectedTracks.push(element[1]);
        });
      }
      createTrackList();
      track.classList.remove(
        "pb-4",
        "bg-fifth",
        "border-b",
        "border-double",
        "border-black"
      );
    });
    // Changement de style des tracks selon si elles sont selected ou loaded
    if (selectedTracks.includes(file) && file !== loadedTrack)
      track.classList.add("bg-fifth", "text-primary");
    if (loadedTrack === file) {
      track.innerHTML =
        '<img src="./src/assets/icons/playwhite.png" class="h-2 w-2"></img>';
      track.classList.add("bg-secondary", "text-fourth", "font-semibold");
    }
    trackbutton.innerText = `${file.trackNumber} - ${file.name}`;
    track.appendChild(trackbutton);
    tracklist.appendChild(track);
    index++;
  });

  for (const [i, value] of playlist.entries()) {
    value.trackNumber = i + 1;
  }
  window.player.getPlaylist(playlist);
};

// Gestion du drag'n'drop sur la zone d'affichage des pistes video
dropzone.addEventListener("drop", (e) => {
  dropzone.classList.remove("bg-fifth");
  e.preventDefault();
  // Au drop, la playlist est de nouveau générée intégralement et transmise au preload pour la gestion
  if (e.target === dropzone) {
    Object.entries(e.dataTransfer.files).forEach((file) => {
      if (file[1].type.includes("video")) {
        playlist.push(file[1]);
      }
    });
    createTrackList();
  }
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
  dropzone.classList.add("bg-fifth");
});
dropzone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  dropzone.classList.remove("bg-fifth");
});

// TODO mettre en place des raccourcis clavier pour chaque action
pauseButton.addEventListener("click", () => {
  window.player.pause();
});
playButton.addEventListener("click", () => {
  if (loadedTrack) window.player.play();
});
stopButton.addEventListener("click", () => {
  window.player.stop();
});
muteButton.addEventListener("click", () => {
  if (loadedTrack) window.player.mute();
});
previousButton.addEventListener("click", () => {
  window.player.previousTrack();
  if (parseInt(loadedTrack.id) - 1 >= 0) {
    selectedTracks = [];
    loadedTrack = playlist[parseInt(loadedTrack.id) - 1];
  }
  createTrackList();
});
nextButton.addEventListener("click", () => {
  window.player.nextTrack();
  if (parseInt(loadedTrack.id) + 1 <= playlist.length - 1) {
    selectedTracks = [];
    loadedTrack = playlist[parseInt(loadedTrack.id) + 1];
  }
  createTrackList();
});

// Gestion de l'input relative aux temps de la loadedTrack
timeControl.addEventListener("change", () => {
  // TODO Mettre un fond de couleur différente à gauche et à droite du curseur
  window.player.changeTime(timeControl.value);
});
timeControl.addEventListener("input", (e) => {
  window.player.stopGetCurrent();
  window.player.displaySlidingInputValue(e.currentTarget.value);
});

// Gestion de l'input relative au volume de la video
volumeControl.addEventListener("change", () => {
  // TODO Mettre un fond de couleur différente à gauche et à droite du curseur
  window.player.changeVolume(volumeControl.value);
});
volumeControl.addEventListener("input", (e) => {
  window.player.changeVolume(e.currentTarget.value);
});

//////////////////////// PARTIE TEAMLIST ////////////////////////

const teams = [];
let sortTeamsState = null;
const sortAscAlphaButton = document.getElementById("sortAscAlpha");
const sortDescAlphaButton = document.getElementById("sortDescAlpha");
const sortAscNumButton = document.getElementById("sortAscNum");
const sortDescNumButton = document.getElementById("sortDescNum");
const videoOnlyDisplayButton = document.getElementById("videoDisplay");
videoOnlyDisplayButton.classList.add(
  "bg-yellow-300",
  "font-bold",
  "rounded-teamSettingsSelected"
);
const videoAndScoresDisplayButton =
  document.getElementById("videoScoreDisplay");
const videoAndPodiumDisplayButton =
  document.getElementById("videoPodiumDisplay");

// Création de la teamlist
const createTeamList = () => {
  if (sortTeamsState) handleSort(sortTeamsState);
  const teamList = document.getElementById("teamlist");
  teamList.innerHTML =
    '<li class="w-full p-1 pl-4 flex justify-center"><button class="h-10 w-10 flex justify-center items-center font-bold border border-solid border-black shadow-buttonShadow rounded-3xl group hover:scale-110" id="addTeam"><img src="./src/assets/icons/add.png" class="h-2 w-2 group-hover:scale-110"></img></button></li>';
  const addTeamButton = document.getElementById("addTeam");
  addTeamButton.addEventListener("click", () => addTeamLine());
  for (let team of teams) {
    addTeamLine(team);
  }
};

// Logique de modification du score lors du clic sur les boutons
const handleScore = (action, team) => {
  if (action === "increment") {
    team.score++;
  }
  if (action === "decrement") {
    team.score--;
  }
  createTeamList();
};

// Logique de tri lors du clic sur les boutons
const handleSort = (sortType) => {
  sortTeamsState = sortType;
  if (sortType === "ascAlpha") {
    teams.sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
  }
  if (sortType === "descAlpha") {
    teams.sort((a, b) => {
      return a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1;
    });
  }
  if (sortType === "ascNum") {
    teams.sort((a, b) => a.score - b.score);
  }
  if (sortType === "descNum") {
    teams.sort((a, b) => b.score - a.score);
  }
};

// Fonction qui gère le clic sur un mode de display pour la mise en style du bouton du display actif
const resetDisplayButtonsStyle = (clickedButton) => {
  for (let button of [
    videoOnlyDisplayButton,
    videoAndScoresDisplayButton,
    videoAndPodiumDisplayButton,
  ]) {
    if (button.classList.contains("bg-yellow-300")) {
      button.classList.remove("bg-yellow-300", "font-bold");
    }
    if (button.classList.contains("rounded-teamSettingsSelected")) {
      button.classList.remove("rounded-teamSettingsSelected");
    }
  }
  clickedButton.classList.add(
    "bg-yellow-300",
    "font-bold",
    "rounded-teamSettingsSelected"
  );
};

const resetSortButtonsStyle = (clickedButton) => {
  for (let button of [
    sortAscAlphaButton,
    sortAscNumButton,
    sortDescAlphaButton,
    sortDescNumButton,
  ]) {
    if (button.classList.contains("bg-purple-300")) {
      button.classList.remove("bg-purple-300", "font-bold");
    }
    if (button.classList.contains("rounded-teamSettingsSelected")) {
      button.classList.remove("rounded-teamSettingsSelected");
    }
  }
  clickedButton.classList.add(
    "bg-purple-300",
    "font-bold",
    "rounded-teamSettingsSelected"
  );
};

// Création d'une ligne d'équipe
const addTeamLine = (teamToAdd) => {
  // Si l'équipe n'est pas présente dans l'objet teams, elle est créée
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
    "items-center",
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
    "shadow-buttonShadow",
    "font-bold",
    "hover:scale-110"
  );
  teamScoreIncButton.classList.add(
    "h-10",
    "w-10",
    "p-1",
    "border",
    "border-black",
    "border-solid",
    "shadow-buttonShadow",
    "font-bold",
    "hover:scale-110"
  );
  teamScoreDisplay.classList.add(
    "h-10",
    "w-10",
    "p-1",
    "text-center",
    "text-2xl",
    "font-bold"
  );
  teamDeleteButton.classList.add(
    "h-10",
    "w-10",
    "border",
    "border-solid",
    "border-black",
    "shadow-buttonShadow",
    "rounded-3xl",
    "hover:scale-110"
  );
  teamName.classList.add("h-fit", "font-semibold", "text-xl");
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
  teamScore.appendChild(teamDeleteButton);
  teamList.appendChild(teamLine);
  animateButtons();

  // Lors du clic sur le nom de l'équipe, un ipnput remplace le paragraphe afin de permettre la modif (modif en temps réel au change => pas de validation requise)
  // Lorsque le focus n'est plus sur l'input, et celle-ci redevient un paragraphe
  // TODO : ajouter un système de boutons pour valider ou annuler la modification du nom
  teamName.addEventListener("click", () => {
    const teamNameInput = document.createElement("input");
    teamNameInput.setAttribute("type", "text");
    teamNameInput.setAttribute("value", teamToAdd.name);
    teamNameInput.addEventListener("change", (e) => {
      teamToAdd.name = e.target.value;
    });
    teamNameInput.addEventListener("focusout", (e) => {
      if (!e.target.value.match(/\S+/g)) {
        teamNameInput.focus();
        teamNameInput.select();
      } else {
        teamLine.replaceChild(teamName, teamNameInput);
        textFocus = false;
        createTeamList();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (textFocus) {
        if (e.key === "Enter" && e.target.value.match(/\S+/g)) {
          textFocus = false;
          createTeamList();
        }
      }
    });
    teamLine.replaceChild(teamNameInput, teamName);
    teamNameInput.focus();
    teamNameInput.select();
    textFocus = true;
  });

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
    handleSort(sortTeamsState);
    createTeamList();
  });
};
createTeamList();

sortAscAlphaButton.addEventListener("click", () => {
  if (teams.length > 0) {
    resetSortButtonsStyle(sortAscAlphaButton);
    handleSort("ascAlpha");
    createTeamList();
  }
});
sortDescAlphaButton.addEventListener("click", () => {
  if (teams.length > 0) {
    resetSortButtonsStyle(sortDescAlphaButton);
    handleSort("descAlpha");
    createTeamList();
  }
});
sortAscNumButton.addEventListener("click", () => {
  if (teams.length > 0) {
    resetSortButtonsStyle(sortAscNumButton);
    handleSort("ascNum");
    createTeamList();
  }
});
sortDescNumButton.addEventListener("click", () => {
  if (teams.length > 0) {
    resetSortButtonsStyle(sortDescNumButton);
    handleSort("descNum");
    createTeamList();
  }
});
videoOnlyDisplayButton.addEventListener("click", () => {
  resetDisplayButtonsStyle(videoOnlyDisplayButton);
  window.display.displayVideoOnly();
});
videoAndScoresDisplayButton.addEventListener("click", () => {
  if (teams.length > 0) {
    resetDisplayButtonsStyle(videoAndScoresDisplayButton);
    window.display.displayVideoAndScores(teams);
  }
});
videoAndPodiumDisplayButton.addEventListener("click", () => {
  if (teams.length > 0) {
    resetDisplayButtonsStyle(videoAndPodiumDisplayButton);
    window.display.displayVideoAndPodium(
      teams.sort((a, b) => b.score - a.score)
    );
  }
});

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
