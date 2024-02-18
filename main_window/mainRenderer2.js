//////////////////////// GENERAL ////////////////////////

// le keyDownState enregistre l'état appuyé ou non des différentes touches, afin d'éviter le repeat lors du keydown
const keyDownState = {};

// Animation des boutons sauf les tracks de la tracklist
function animateButtons() {
  const buttons = document.getElementsByTagName("button");
  for (let button of buttons) {
    if (!button.classList.contains("track")) {
      button.addEventListener("mousedown", () => {
        button.classList.remove("shadow-buttonShadow");
        button.classList.add("translate-x-[3px]", "translate-y-[3px]");
      });
      button.addEventListener("mouseup", () => {
        button.classList.add("shadow-buttonShadow");
        button.classList.remove("translate-x-[3px]", "translate-y-[3px]");
      });
      button.addEventListener("mouseleave", () => {
        button.classList.add("shadow-buttonShadow");
        button.classList.remove("translate-x-[3px]", "translate-y-[3px]");
      });
    }
  }
}

animateButtons();

//////////////////////// PARTIE PLAYLIST ////////////////////////

// La playlist permet  l'enregistrement des tracks dans leur oredre de diffusion
let playlist = JSON.parse(window.localStorage.getItem("playlist")) || [];
// Les selectedTracks sont les tracks sélectionnées dans la liste (pas celle qui est chargée dans le player)
let selectedTracks = [];
// La loadedTrack est la track chargée dans le player
let loadedTrack = null;
// mute permet de suivre l'état mute du videoplayer
let mute = true;
// Les draggedTracks sont les tracks qui sont dragguées lors du drag'n'drop
let draggedTracks = [];
// Le textFocus sert à vérifier si une input de type texte est focus lorsqu'on appuie sur des touches qui sont des raccourcis (Suppr, Espace...)
let textFocus = false;
// Le displayTrackNumber permet de vérifier si le bouton d'affichage du numéro de piste a été coché ou non
let displayTrackNumber = false;
// Le displayTrackNumber permet de vérifier si le bouton d'affichage du numéro du nom de fichier a été coché ou non
let eraseFileTitleNumberPart = false;
// La songsLibrary contient les liens et infos de chaque musique jouable dans l'audioplayer
let songsLibrary = [
  {
    id: "song1",
    title: "Love Boat",
    src: "../src/assets/music/Love Boat.mp3",
    start: 0,
  },
  {
    id: "song2",
    title: "Rocky - Win",
    src: "../src/assets/music/Rocky.mp3",
    start: 90,
  },
  {
    id: "song3",
    title: "Anniversaire",
    src: "../src/assets/music/Joyeux Anniversaire.mp3",
    start: 9.8,
  },
];

// const roundSelect = document.getElementById("roundSelect");
// const showTrackNumberButton = document.getElementById("showTrackNumberButton");
// const eraseFileNamePartButton = document.getElementById(
//   "eraseFileNamePartButton"
// );
// const showCompletePlaylistButton = document.getElementById(
//   "showCompletePlaylistButton"
// );
// const clearTrackListButton = document.getElementById("clearTrackListButton");
// const categorySelect = document.getElementById("categorySelect");
const tracklist = document.getElementById("tracklist");
const tracklistLength = document.getElementById("tracklistLength");
const dropzone = document.getElementById("dropzone");
// const timeControl = document.getElementById("timecontrol");
// const playButton = document.getElementById("playerplay");
// const pauseButton = document.getElementById("playerpause");
// const stopButton = document.getElementById("playerstop");
// const muteButton = document.getElementById("playermute");
// const previousButton = document.getElementById("playerprev");
// const nextButton = document.getElementById("playernext");
const volumeControl = document.getElementById("volumecontrol");

class Track {
  constructor(path, title, round, category) {
    this.id = null;
    this.trackNumber = null;
    this.path = path;
    this.title = title;
    this.round = round;
    this.category = category;
    this.isSelected = false;
    this.isLoaded = false;
    this.isPaused = false;
    this.tracklistLine = null;
  }

  addEventListenersToTracklistLine(track) {
    let tracklistLine = track;
    // Si une track est survolée, et qu'elle n'est ni selected ni loaded, elle change de style
    // Le style est supprimé lorsque la track n'est plus survolée
    tracklistLine.addEventListener("mouseover", () => {
      if (!this.isLoaded && !this.isSelected && draggedTracks.length === 0)
        tracklistLine.classList.add("bg-fourth", "text-white");
    });

    tracklistLine.addEventListener("mouseleave", () => {
      if (!this.isLoaded && !this.isSelected)
        tracklistLine.classList.remove("bg-fourth", "text-white");
    });

    // Le double clic permet le chargement de la piste dans le player (loadedTrack)
    tracklistLine.addEventListener("dblclick", () => {
      if (loadedTrack) {
        loadedTrack.unloadTrack();
      }
      this.loadTrack();
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      window.player.playFile(this);

      if (!mute) mute = true;

      loadedTrack
        ? (tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`)
        : (tracklistLength.innerText = `0 / ${playlist.length}`);
      loadedTrack.paused = false;
    });

    // Le clic simple permet juste de sélectionner une piste
    tracklistLine.addEventListener("click", (e) => {
      if (e.shiftKey) {
        console.log("yes");
        for (
          let i = Math.min(
            selectedTracks[selectedTracks.length - 1]?.id,
            this.id
          );
          i <= Math.max(selectedTracks[selectedTracks.length - 1]?.id, this.id);
          i++
        ) {
          console.log(playlist[i]);
          if (!selectedTracks.includes(playlist[i])) {
            playlist[i].selectTrack();
          }
        }
      } else if (e.ctrlKey) {
        // Si control + clic : ajout de la track cliquée aux selectedTracks
        if (!selectedTracks.includes(this)) {
          this.selectTrack();
        } else {
          this.unselectTrack();
        }
      } else {
        // Clic simple = sélection unique
        if (selectedTracks.length > 0) {
          selectedTracks.forEach((selectedTrack) => {
            selectedTrack.unselectTrack();
          });
        }
        this.selectTrack();
      }
      this.updateTracklistLine();
    });
  }

  addTrackToPlaylist() {
    playlist.push(this);
    this.id = playlist.indexOf(this);
    this.trackNumber = playlist.indexOf(this) + 1;
  }

  cleanFileTitle = () => {
    let fileTitlePartToErase = new RegExp(/^[0-9]{0,}\s{0,}-{0,1}_{0,1}/g);
    return eraseFileTitleNumberPart
      ? this.title.replace(fileTitlePartToErase, "")
      : this.title;
  };

  createTracklistLine() {
    let track = document.createElement("li");
    track.setAttribute("id", `${this.id}`);
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

    if (this.category) {
      track.classList.add("font-bold");
    }

    if (this.isSelected) {
      track.classList.remove("bg-fourth", "text-white");
      track.setAttribute("draggable", "true");
      track.addEventListener("drag", () => {
        selectedTracks.sort((a, b) => b.id - a.id);
        draggedTracks = selectedTracks.slice(0);
      });
      track.addEventListener("dragend", () => {
        draggedTracks = [];
      });
      if (!this.isLoaded) {
        track.classList.add("bg-fifth", "text-primary");
      }
      track.classList.add("selected");
    }

    if (this.isLoaded) {
      track.classList.remove("bg-fourth", "text-white");
      let playIcon = document.createElement("img");
      playIcon.setAttribute("src", "../src/assets/icons/playwhite.png");
      playIcon.classList.add("h-2", "w-2");
      track.insertBefore(playIcon, track.firstChild);
      track.classList.add(
        "bg-secondary",
        "text-fourth",
        "font-semibold",
        "loaded"
      );
    }

    trackbutton.classList.add("track", "text-left");
    trackbutton.innerText = displayTrackNumber
      ? `${this.round?.toString().padStart(2, "0")} - ${this.trackNumber
          .toString()
          .padStart(2, "0")} - ${this.cleanFileTitle()}`
      : `${this.round?.toString().padStart(2, "0")} - ${this.cleanFileTitle()}`;
    track.appendChild(trackbutton);
    this.addEventListenersToTracklistLine(track);
    return track;
  }

  loadTrack() {
    this.isLoaded = true;
    loadedTrack = this;
    this.updateTracklistLine();
  }

  selectTrack() {
    this.isSelected = true;
    selectedTracks = playlist.filter((track) => track.isSelected);
    this.updateTracklistLine();
  }

  unloadTrack() {
    this.isLoaded = false;
    loadedTrack = null;
    this.updateTracklistLine();
  }

  unselectTrack() {
    this.isSelected = false;
    selectedTracks = playlist.filter((track) => track.isSelected);
    this.updateTracklistLine();
  }

  updateTracklistLine() {
    let newTracklistLine = this.createTracklistLine();
    tracklist.replaceChild(
      newTracklistLine,
      document.getElementById(`${this.id}`)
    );
  }
}

const addEventListenersToDropzone = () => {
  // Si on drag des pistes au-dessus de la dropzone, le texte d'information est supprimé au drop des premières pistes
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (document.getElementById("playlistInstruction")) {
      document
        .getElementById("dropzone")
        .removeChild(document.getElementById("playlistInstruction"));
    }
  });

  // Gestion des animations lors du drag au-dessus de la dropzone
  dropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if (draggedTracks.length === 0) dropzone.classList.add("bg-fifth");
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropzone.classList.remove("bg-fifth");
  });

  // Gestion du drag'n'drop sur la zone d'affichage des pistes video
  dropzone.addEventListener("drop", (e) => {
    dropzone.classList.remove("bg-fifth");
    e.preventDefault();
    // Au drop, la playlist est de nouveau générée intégralement et transmise au preload pour la gestion
    if (e.target === dropzone) {
      if (selectedTracks.length > 0) {
        selectedTracks.forEach((selectedTrack) => {
          selectedTrack.unselectTrack();
        });
      }
      Object.entries(e.dataTransfer.files).forEach((element) => {
        if (element[1].type.includes("video")) {
          let newTrack = new Track(
            element[1].path.slice(0),
            element[1].name.slice(0),
            1,
            false
          );
          selectedTracks.push(newTrack);
          newTrack.addTrackToPlaylist();
          let newTracklistLine = newTrack.createTracklistLine();
          tracklist.appendChild(newTracklistLine);
          newTrack.tracklistLine = newTracklistLine;
          console.log(playlist);
        }
      });
    }
  });
};

addEventListenersToDropzone();

//////////////////////// PARTIE TEAMLIST ////////////////////////

// Teams stocke les informations relative à chaque équipe (nom, score)
const teams = JSON.parse(window.localStorage.getItem("teams")) || [];
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
    '<li class="w-full p-1 pl-4 flex justify-center gap-4"><button class="h-10 w-10 flex justify-center items-center font-bold border border-solid border-black shadow-buttonShadow rounded-3xl group" id="addTeam"><img src="../src/assets/icons/add.png" class="h-4 w-4 group-hover:scale-125"></img></button><button class="h-10 w-10 flex justify-center items-center font-bold border border-solid border-black shadow-buttonShadow rounded-3xl group" id="resetScores"><img src="../src/assets/icons/reset.png" class="h-4 w-4 group-hover:scale-125"></img></button></li>';
  const addTeamButton = document.getElementById("addTeam");
  const resetScoresButton = document.getElementById("resetScores");
  addTeamButton.addEventListener("click", () => addTeamLine());
  resetScoresButton.addEventListener("click", () => {
    if (
      teams.length > 0 &&
      confirm("Souhaites-tu réellement remettre les scores à zéro ?")
    ) {
      for (let team of teams) {
        team.score = 0;
        createTeamList();
      }
    }
  });
  for (let team of teams) {
    addTeamLine(team);
  }
  window.localStorage.setItem("teams", JSON.stringify(teams));
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

// Cette fonction permet la réinitialisation du style de toues les boutons de tri sauf celui qui a été cliqué
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

// Cette fonction gère la réinitialisation du display complet de la secondaryWindow
const resetDisplay = () => {
  resetDisplayButtonsStyle(videoOnlyDisplayButton);
  window.display.displayVideoOnly();
  imageList.value = "video";
  window.display.displayImage(null);
  displayImageBlock.classList.remove("bg-primary");
  gifList.value = "";
  window.display.displayGif(gifList.value);
  gifBlock.classList.remove("bg-primary");
  if (displayInfo) {
    displayInfo = !displayInfo;
    window.display.displayInfo(displayInfo, displayRoundsState);
    displayInfoBlock.classList.remove("bg-primary");
  }
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
    "items-start",
    "gap-1",
    "h-fit",
    "px-4"
  );
  teamScore.classList.add("flex", "gap-2", "h-8", "w-[180px]");
  teamScoreDecButton.classList.add(
    "h-8",
    "w-8",
    "p-1",
    "border",
    "border-black",
    "border-solid",
    "shadow-buttonShadow",
    "font-bold",
    "hover:scale-110"
  );
  teamScoreIncButton.classList.add(
    "h-8",
    "w-8",
    "p-1",
    "border",
    "border-black",
    "border-solid",
    "shadow-buttonShadow",
    "font-bold",
    "hover:scale-110"
  );
  teamScoreDisplay.classList.add(
    "h-8",
    "w-8",
    "text-center",
    "text-2xl",
    "font-bold",
    "flex",
    "items-center",
    "justify-center"
  );
  teamDeleteButton.classList.add(
    "h-8",
    "w-8",
    "border",
    "border-solid",
    "border-black",
    "shadow-buttonShadow",
    "rounded-3xl",
    "group"
  );
  teamName.classList.add(
    "h-fit",
    "font-semibold",
    "text-xl",
    "w-[320px]",
    "2xl:w-[500px]",
    "line-clamp-1",
    "hover:line-clamp-none",
    "hover:overflow-auto"
  );
  teamName.innerText = teamToAdd.name;
  const teamDeletButtonImage = document.createElement("p");
  teamDeletButtonImage.innerText = "🗑️";
  teamDeletButtonImage.classList.add("group-hover:scale-125");
  teamDeleteButton.appendChild(teamDeletButtonImage);
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
  window.localStorage.setItem("teams", JSON.stringify(teams));
};

// Au chargement de la fenêtre, la teamList est initialisée
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

document.addEventListener("keydown", (e) => {
  // Lors de l'appui sur F1, le mode display passe sur video seule et réinitialise tous les éléments en display
  if (
    e.key === "F1" &&
    (keyDownState[e.key] === false || !keyDownState[e.key])
  ) {
    e.preventDefault();
    resetDisplay();
    keyDownState[e.key] = true;
  }
  // Lors de l'appui sur F2, le mode display passe sur video + scores
  if (
    e.key === "F2" &&
    (keyDownState[e.key] === false || !keyDownState[e.key])
  ) {
    e.preventDefault();
    if (teams.length > 0) {
      resetDisplayButtonsStyle(videoAndScoresDisplayButton);
      window.display.displayVideoAndScores(teams);
    }
    keyDownState[e.key] = true;
  }
  // Lors de l'appui sur F3, le mode display passe sur video + podium
  if (
    e.key === "F3" &&
    (keyDownState[e.key] === false || !keyDownState[e.key])
  ) {
    e.preventDefault();
    if (teams.length > 0) {
      resetDisplayButtonsStyle(videoAndPodiumDisplayButton);
      window.display.displayVideoAndPodium(
        teams.sort((a, b) => b.score - a.score)
      );
    }
    keyDownState[e.key] = true;
  }
});

//////////////////////// PARTIE IMAGES ////////////////////////

// Le displayInfo permet de savoir si le carton d'info est actuellement affiché ou non sur la secondaryWindow
let displayInfo = false;
// Le displayRoundsState permet la gestion de l'affichage ou non des différents horaires des manches
let displayRoundsState = { first: null, second: null, isDisplay: false };

const addImageForm = document.getElementById("addImageForm");
const addImageInput = document.getElementById("addImageInput");
const displayImageBlock = document.getElementById("displayImageBlock");
const displayInfoBlock = document.getElementById("displayInfoBlock");
const imageList = document.getElementById("imageList");
const clearImageList = document.getElementById("clearImageList");
const displayInfoButton = document.getElementById("displayInfoButton");
const firstRoundInput = document.getElementById("firstRoundInput");
const secondRoundInput = document.getElementById("secondRoundInput");
const displayRoundsInput = document.getElementById("displayRoundsInput");

// addImageForm permet de sélectionner les images dont on veut récupérer le chemin d'accès
addImageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  Object.values(addImageInput.files).forEach((image) => {
    if (image.type.includes("image")) {
      let imageOption = document.createElement("option");
      let existingOption = document.getElementById(image.name);
      imageOption.setAttribute("id", image.name);
      imageOption.innerText = image.name;
      imageOption.value = image.path;
      if (!existingOption) {
        imageList.appendChild(imageOption);
      }
    }
  });
  addImageInput.value = null;
  addImageForm.classList.remove("bg-primary");
});

addImageInput.addEventListener("change", () => {
  addImageForm.classList.add("bg-primary");
});

// L'imageList est chargée lorsque l'utilisateur a soumis le formulaire addImageForm
imageList.addEventListener("change", () => {
  if (imageList.value === "video") {
    window.display.displayImage(null);
    displayImageBlock.classList.remove("bg-primary");
  } else {
    window.display.displayImage(imageList.value);
    displayImageBlock.classList.add("bg-primary");
  }
});

// Le clearImageList permet de vider la liste des images chargées
clearImageList.addEventListener("click", () => {
  if (
    imageList.children.length > 1 &&
    confirm("Souhaites-tu réellement effacer la liste ?")
  ) {
    while (imageList.children.length > 1) {
      imageList.removeChild(imageList.lastChild);
    }
    window.display.displayImage(null);
    displayImageBlock.classList.remove("bg-primary");
  }
});

// le displayInfoButton permet d'afficher le carton des informations (par défaut, sans les informations de manches)
displayInfoButton.addEventListener("click", () => {
  displayInfo = !displayInfo;
  window.display.displayInfo(displayInfo, displayRoundsState);
  if (displayInfo) {
    displayInfoBlock.classList.add("bg-primary");
  } else {
    displayInfoBlock.classList.remove("bg-primary");
  }
});

// Les inputs ci-dessous permettent d'indiquer une heure de début pour chaque manche
firstRoundInput.addEventListener("change", () => {
  displayRoundsState.first = firstRoundInput.value;
});
secondRoundInput.addEventListener("change", () => {
  displayRoundsState.second = secondRoundInput.value;
});

// Lorsque la displayRoundsInput est cochée, les informations de manches s'affichent sur le carton d'informations
displayRoundsInput.addEventListener("change", () => {
  if (displayRoundsInput.checked) {
    displayRoundsState.isDisplay = true;
  } else {
    displayRoundsState.isDisplay = false;
  }
});

//////////////////////// PARTIE MEDIA ////////////////////////

// fadeRunning permet d'éviter les clics multiples sur le bouton fade lorsque le fade est en cours
let fadeRunning = false;

const musicPart = document.getElementById("musicPart");
const audioplayer = document.getElementById("audioplayer");
const songTitleDisplay = document.getElementById("songTitleDisplay");
const fadeButton = document.getElementById("fadeButton");
const gifBlock = document.getElementById("gifBlock");
const gifList = document.getElementById("gifList");

// Lorsqu'une option est sélectionnée, le gif est affiché sur la secondaryWindow
gifList.addEventListener("change", () => {
  window.display.displayGif(gifList.value);
  if (gifList.value !== "") {
    gifBlock.classList.add("bg-primary");
  } else {
    gifBlock.classList.remove("bg-primary");
  }
});

// Cette boucle permet d'initialiser les boutons de la songList en fonction des informations de la songLibrary
for (let song of songsLibrary) {
  let trackbutton = document.getElementById(song.id);
  trackbutton.addEventListener("click", () => {
    audioplayer.src = song.src;
    audioplayer.currentTime = song.start;
    songTitleDisplay.innerText = song.title;
    audioplayer.play();
  });
}

// Lorsque la chanson est jouée, le mute est fait automatiquement sur le clip
audioplayer.addEventListener("play", () => {
  audioplayer.volume = 1;
  if (!mute) {
    window.player.mute();
    mute = !mute;
  }
  musicPart.classList.add("bg-primary");
});

audioplayer.addEventListener("pause", () => {
  musicPart.classList.remove("bg-primary");
});

// Lorsque le bouton fade est cliqué alors qu'une musique est jouée dans l'audioplayer, un fondu automatique est effectué pour reprendre le volume initial de la video
fadeButton.addEventListener("click", () => {
  let initialVolume = volumeControl.value;
  if (!audioplayer.paused && !fadeRunning) {
    fadeRunning = true;
    if (mute) {
      window.player.mute();
      mute = !mute;
    }
    volumeControl.value = 0;
    window.player.changeVolume(volumeControl.value);
    window.player.displaySlidingBackgroundColor(
      volumeControl,
      "fifth",
      "third"
    );
    let fadeInterval = setInterval(() => {
      if (Number(audioplayer.volume) > 0 && Number(audioplayer.volume) <= 1) {
        audioplayer.volume = Math.floor((audioplayer.volume - 0.1) * 100) / 100;
        if (volumeControl.value < initialVolume) {
          volumeControl.value = Number(volumeControl.value) + 0.1;
        }
        window.player.changeVolume(volumeControl.value);
        window.player.displaySlidingBackgroundColor(
          volumeControl,
          "fifth",
          "third"
        );
      } else {
        clearInterval(fadeInterval);
        audioplayer.pause();
        audioplayer.volume = 1;
        audioplayer.src = null;
        musicPart.classList.remove("bg-primary");
        songTitleDisplay.innerText = "Sélectionne la musique";
        fadeRunning = false;
      }
    }, 500);
  }
});
