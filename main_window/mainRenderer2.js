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

const roundSelect = document.getElementById("roundSelect");
const showTrackNumberButton = document.getElementById("showTrackNumberButton");
const eraseFileNamePartButton = document.getElementById(
  "eraseFileNamePartButton"
);
const showCompletePlaylistButton = document.getElementById(
  "showCompletePlaylistButton"
);
const clearTrackListButton = document.getElementById("clearTrackListButton");
const categorySelect = document.getElementById("categorySelect");
const hidePlaylistButton = document.getElementById("hidePlaylistButton");
const tracklist = document.getElementById("tracklist");
const tracklistLength = document.getElementById("tracklistLength");
const dropzone = document.getElementById("dropzone");
const timeControl = document.getElementById("timecontrol");
const playButton = document.getElementById("playerplay");
const pauseButton = document.getElementById("playerpause");
const stopButton = document.getElementById("playerstop");
const muteButton = document.getElementById("playermute");
const previousButton = document.getElementById("playerprev");
const nextButton = document.getElementById("playernext");
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

  addEventListenersToTracklistLine(tracklistLine) {
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
      loadedTrack?.unloadTrack();
      this.loadTrack();
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      if (!mute) mute = true;
      updateTracklistLength();
    });

    // Le clic simple permet juste de sélectionner une piste
    tracklistLine.addEventListener("click", (e) => {
      if (e.shiftKey) {
        for (
          let i = Math.min(
            selectedTracks[selectedTracks.length - 1]?.id,
            this.id
          );
          i <= Math.max(selectedTracks[selectedTracks.length - 1]?.id, this.id);
          i++
        ) {
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

    // Création du témoin (ghostTrack) de localisation de l'endroit où les pistes vont être insérées lors que l'on drag les fichiers par-dessus
    tracklistLine.addEventListener("dragover", (e) => {
      e.preventDefault();
      let ghostTrack = document.createElement("li");
      ghostTrack.classList.add(
        "pb-4",
        "bg-fifth",
        "border-y",
        "border-double",
        "border-black"
      );
      if (
        // Si le drag est effectuée sur la moitié du haut de la track visée, la ghostTrack est générée avant la piste
        e.clientY >= getPosition(tracklistLine).y &&
        e.clientY <
          getPosition(tracklistLine).y + getPosition(tracklistLine).height / 2
      ) {
        if (!document.getElementById("ghostTrackBefore")) {
          if (document.getElementById("ghostTrackAfter")) {
            tracklist.removeChild(document.getElementById("ghostTrackAfter"));
          }
          ghostTrack.setAttribute("id", "ghostTrackBefore");
          addListenersToGhostTrack(ghostTrack, this, "ghostTrackBefore");
          tracklist.insertBefore(ghostTrack, tracklistLine);
        }
      } else {
        // Si le drag est effectuée sur la moitié du bas de la track visée, la ghostTrack est générée après la piste
        if (!document.getElementById("ghostTrackAfter")) {
          if (document.getElementById("ghostTrackBefore")) {
            tracklist.removeChild(document.getElementById("ghostTrackBefore"));
          }
          ghostTrack.setAttribute("id", "ghostTrackAfter");
          addListenersToGhostTrack(ghostTrack, this, "ghostTrackAfter");
          tracklistLine.insertAdjacentElement("afterend", ghostTrack);
        }
      }
    });

    // Suppression du témoin de localisation de l'endroit où les pistes vont être insérées lors que l'on arrête le drag
    tracklistLine.addEventListener("dragend", (e) => {
      e.preventDefault();
      let ghostTrack =
        document.getElementById("ghostTrackAfter") ||
        document.getElementById("ghostTrackBefore");
      if (ghostTrack) tracklist.removeChild(ghostTrack);
    });

    // Au drop sur une track existante, les fichiers déposés sont insérés dans la playlist à l'index ou l'index suivant cette track selon la position de la ghostTrack
    // Les tracks déposées deviennent les selectedTracks (si besoin de les supprimer immédiatement)
    tracklistLine.addEventListener("drop", (e) => {
      e.preventDefault();
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      if (draggedTracks.length > 0) {
        let index = 0;
        if (
          e.clientY >= getPosition(tracklistLine).y &&
          e.clientY <
            getPosition(tracklistLine).y + getPosition(tracklistLine).height / 2
        ) {
          if (!draggedTracks.includes(this)) {
            draggedTracks.forEach((draggedTrack) => {
              playlist.splice(playlist.indexOf(draggedTrack), 1);
              draggedTrack.addTrackToPlaylistToIndex(playlist.indexOf(this));
              draggedTrack.selectTrack();
              index++;
            });
          }
        } else {
          if (!draggedTracks.includes(this)) {
            draggedTracks.forEach((track) => {
              playlist.splice(playlist.indexOf(track), 1);
              playlist.splice(playlist.indexOf(this) + 1 + index, 0, track);
              track.selectTrack();
              index++;
            });
          }
        }
      } else {
        if (
          e.clientY >= getPosition(tracklistLine).y &&
          e.clientY <
            getPosition(tracklistLine).y + getPosition(tracklistLine).height / 2
        ) {
          let index = 0;
          Object.entries(e.dataTransfer.files).forEach((element) => {
            if (element[1].type.includes("video")) {
              let newTrack = new Track(
                element[1].path.slice(0),
                element[1].name.slice(0),
                1,
                false
              );
              let indexToInsertTrackTo = this.id + index;
              newTrack.addTrackToPlaylistToIndex(indexToInsertTrackTo);
              newTrack.createTracklistLine();
              tracklist.appendChild(newTrack.tracklistLine);
              newTrack.selectTrack();
              index++;
            }
          });
        } else {
          let index = 0;
          Object.entries(e.dataTransfer.files).forEach((element) => {
            if (element[1].type.includes("video")) {
              let newTrack = new Track(
                element[1].path.slice(0),
                element[1].name.slice(0),
                1,
                false
              );
              let indexToInsertTrackTo = this.id + 1 + index;
              newTrack.addTrackToPlaylistToIndex(indexToInsertTrackTo);
              newTrack.createTracklistLine();
              tracklist.appendChild(newTrack.tracklistLine);
              newTrack.selectTrack();
              index++;
            }
          });
        }
      }
      updatePlaylistData();
      updateTracklist();
      updateTracklistLength();
    });
  }

  addTrackToPlaylist() {
    playlist.push(this);
    this.id = playlist.indexOf(this);
    this.trackNumber = playlist.indexOf(this) + 1;
  }

  addTrackToPlaylistToIndex(indexToInsertTrackTo) {
    playlist.splice(indexToInsertTrackTo, 0, this);
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

    if (this.category == "true") {
      track.classList.add("font-bold");
    }

    if (this.isSelected) {
      track.classList.remove("bg-fourth", "text-white");
      track.setAttribute("draggable", "true");
      track.addEventListener("drag", () => {
        selectedTracks.sort((a, b) => a.id - b.id);
        draggedTracks = playlist.filter((track) => track.isSelected);
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
    this.tracklistLine = track;
    return track;
  }

  deleteTrack() {
    this.unselectTrack();
    this.unloadTrack();
    let tracklistLineToRemove = this.tracklistLine;
    tracklist.removeChild(tracklistLineToRemove);
    this.updateTrackNumberAndId();
    playlist.splice(playlist.indexOf(this), 1);
    delete this;
  }

  loadTrack() {
    loadedTrack?.unloadTrack();
    this.isLoaded = true;
    loadedTrack = this;
    this.updateTracklistLine();
    window.player.getLoadedTrack(this);
    resetDisplay();
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
    window.player.getLoadedTrack(null);
  }

  unselectTrack() {
    this.isSelected = false;
    selectedTracks = playlist.filter((track) => track.isSelected);
    this.updateTracklistLine();
  }

  updateTrackNumberAndId() {
    this.id = playlist.indexOf(this);
    this.trackNumber = playlist.indexOf(this) + 1;
  }

  updateTracklistLine() {
    let tracklistLineToReplace = this.tracklistLine;
    this.updateTrackNumberAndId();
    let newTracklistLine = this.createTracklistLine();
    tracklist.replaceChild(newTracklistLine, tracklistLineToReplace);
  }

  updateTracklistLineText() {
    this.tracklistLine.getElementsByTagName("button")[0].innerText =
      displayTrackNumber
        ? `${this.round?.toString().padStart(2, "0")} - ${this.trackNumber
            .toString()
            .padStart(2, "0")} - ${this.cleanFileTitle()}`
        : `${this.round
            ?.toString()
            .padStart(2, "0")} - ${this.cleanFileTitle()}`;
  }
}

const addEventListenersToDropzone = () => {
  // Si on drag des pistes au-dessus de la dropzone, le texte d'information est supprimé au drop des premières pistes
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    cleanDropzone();
  });

  // Gestion des animations lors du drag au-dessus de la dropzone
  dropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    if (draggedTracks.length === 0) dropzone.classList.add("bg-fifth");
    cleanDropzone();
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropzone.classList.remove("bg-fifth");
    cleanDropzone();
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
          newTrack.addTrackToPlaylist();
          newTrack.createTracklistLine();
          tracklist.appendChild(newTrack.tracklistLine);
          newTrack.selectTrack();
        }
      });
      cleanDropzone();
      window.localStorage.setItem("playlist", JSON.stringify(playlist));
    }
    updateTracklistLength();
  });
};

addEventListenersToDropzone();

// Cette fonction gère le changement de track et réinitialise le display par la même occasion
const handleChangeTrack = (action) => {
  if (action === "next") {
    if (!mute) mute = true;
    if (parseInt(loadedTrack.id) + 1 <= playlist.length - 1) {
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      const newTrackId = loadedTrack.id + 1;
      loadedTrack.unloadTrack();
      playlist[newTrackId].loadTrack();
      updateTracklistLength();
    }
  } else if (action === "previous") {
    if (!mute) mute = true;
    if (parseInt(loadedTrack.id) - 1 >= 0) {
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      const newTrackId = loadedTrack.id - 1;
      loadedTrack.unloadTrack();
      playlist[newTrackId].loadTrack();
      updateTracklistLength();
    }
  }
};

// Cette fonction récupère les positions et hauteur des éléments de la playlist pour la localisation du drop
const getPosition = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    height: rect.height,
  };
};

const addEventListenersToDocument = () => {
  // Gestion des appuis sur les touches les raccourcis
  document.addEventListener("keydown", (e) => {
    if (!textFocus) {
      // Lors de l'appui sur Suppr, les pistes sélectionnées (selectedTracks) sont supprimées
      if (e.key === "Delete" && selectedTracks.length > 0) {
        e.preventDefault();
        selectedTracks.forEach((selectedTrack) => {
          selectedTrack.deleteTrack();
        });
        updatePlaylistData();
        updateTracklist();
        updateTracklistLength();
      }
      // Lors de l'appui sur la Entrée, si une seule track est sélectionnée, elle est chargée et lancée
      if (e.key == "Enter" && selectedTracks.length === 1) {
        e.preventDefault();
        let trackToPlay = selectedTracks[0];
        trackToPlay.unselectTrack();
        trackToPlay.loadTrack();
        if (!mute) mute = true;
        updateTracklistLength();
      }
      // Lors de l'appui sur la barre espace, la pause est activée si la video est en cours de lecture, ou celle-ci reprend si elle est en pause
      if (
        e.key === " " &&
        loadedTrack &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        e.preventDefault();
        if (loadedTrack.isPaused) {
          window.player.play();
          loadedTrack.isPaused = false;
        } else {
          window.player.pause();
          loadedTrack.isPaused = true;
        }
        keyDownState[e.key] = true;
      }
      // L'appui sur la touche M active/désactive le mute sur la video
      if (
        (e.key === "m" || e.key === "M") &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        if (loadedTrack) {
          window.player.mute();
          mute = !mute;
        }
        keyDownState[e.key] = true;
      }
      // L'appui sur la touche V remet le volume à 100%
      if (
        (e.key === "v" || e.key === "V") &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        volumeControl.value = 1;
        window.player.changeVolume(volumeControl.value);
        window.player.displaySlidingBackgroundColor(
          volumeControl,
          "fifth",
          "third"
        );
        keyDownState[e.key] = true;
      }
      // L'appui sur la flèche du haut augmente le volume de 25%
      if (
        e.key === "ArrowUp" &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        e.preventDefault();
        volumeControl.value = Number(volumeControl.value) + 0.25;
        window.player.changeVolume(volumeControl.value);
        window.player.displaySlidingBackgroundColor(
          volumeControl,
          "fifth",
          "third"
        );
        keyDownState[e.key] = true;
      }
      // L'appui sur la flèche du bas baisse le volume de 25%
      if (
        e.key === "ArrowDown" &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        e.preventDefault();
        volumeControl.value = Number(volumeControl.value) - 0.25;
        window.player.changeVolume(volumeControl.value);
        window.player.displaySlidingBackgroundColor(
          volumeControl,
          "fifth",
          "third"
        );
        keyDownState[e.key] = true;
      }
      // L'appui sur la flèche de gauche lance la piste précédente
      if (
        e.key === "ArrowLeft" &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        e.preventDefault();
        handleChangeTrack("previous");
        keyDownState[e.key] = true;
      }
      // L'appui sur la flèche de gauche lance la piste suivante
      if (
        e.key === "ArrowRight" &&
        (keyDownState[e.key] === false || !keyDownState[e.key])
      ) {
        e.preventDefault();
        handleChangeTrack("next");
        keyDownState[e.key] = true;
      }
      if (
        (e.key === "F" || e.key === "f") &&
        (keyDownState[e.key] === false || !keyDownState[e.key]) &&
        e.ctrlKey
      ) {
        window.player.setFullScreen();
        keyDownState[e.key] = true;
      }
    }
  });

  // Lorsque la touche est lâchée, le keyDownState correspondant est remis à false
  document.addEventListener("keyup", (e) => {
    keyDownState[e.key] = false;
  });
};

addEventListenersToDocument();

const addEventListenersToPlayerButtons = () => {
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
    if (loadedTrack) {
      window.player.mute();
      mute = !mute;
    }
  });
  previousButton.addEventListener("click", () => {
    handleChangeTrack("previous");
  });
  nextButton.addEventListener("click", () => {
    handleChangeTrack("next");
  });

  // Gestion de l'input relative aux temps de la loadedTrack
  timeControl.addEventListener("change", () => {
    window.player.changeTime(timeControl.value);
    window.player.displaySlidingBackgroundColor(
      timeControl,
      "primary",
      "third"
    );
  });
  timeControl.addEventListener("input", (e) => {
    window.player.stopGetCurrent();
    window.player.displaySlidingInputValue(e.currentTarget.value);
    window.player.displaySlidingBackgroundColor(
      timeControl,
      "primary",
      "third"
    );
  });

  // Gestion de l'input relative au volume de la video
  volumeControl.addEventListener("change", () => {
    window.player.changeVolume(volumeControl.value);
    window.player.displaySlidingBackgroundColor(
      volumeControl,
      "fifth",
      "third"
    );
  });
  volumeControl.addEventListener("input", (e) => {
    window.player.changeVolume(e.currentTarget.value);
    window.player.displaySlidingBackgroundColor(
      volumeControl,
      "fifth",
      "third"
    );
  });
  window.player.displaySlidingBackgroundColor(volumeControl, "fifth", "third");
};

addEventListenersToPlayerButtons();

const addEventListenersToTracklistButtons = () => {
  // Le roundSelect permet de changer la manche de chaque piste sélectionnée (affichage du numéro de manche en début de piste)
  roundSelect.addEventListener("change", () => {
    if (selectedTracks.length > 0 && roundSelect.value !== "") {
      for (let selectedTrack of selectedTracks) {
        selectedTrack.round = roundSelect.value;
        selectedTrack.unselectTrack();
      }
    }
    roundSelect.value = "";
  });

  clearTrackListButton.addEventListener("click", () => {
    while (playlist.length > 0) {
      playlist[0].deleteTrack();
    }
    updateTracklist();
    updateTracklistLength();
    window.localStorage.setItem("playlist", JSON.stringify(playlist));
  });

  // Le showTrackNumberButton permet d'afficher ou non le numéro de piste de chaque track
  showTrackNumberButton.addEventListener("click", () => {
    displayTrackNumber = !displayTrackNumber;
    if (displayTrackNumber) {
      showTrackNumberButton.classList.add("bg-fifth", "text-third");
    } else {
      showTrackNumberButton.classList.remove("bg-fifth", "text-third");
    }
    playlist.forEach((track) => {
      track.updateTracklistLineText();
    });
  });

  // Le eraseFileNamePartButton permet d'effacer ou non le numéro en amont de chaque nom de fichier dans le nom de la track
  eraseFileNamePartButton.addEventListener("click", () => {
    eraseFileTitleNumberPart = !eraseFileTitleNumberPart;
    if (eraseFileTitleNumberPart) {
      eraseFileNamePartButton.classList.add("bg-fifth", "text-third");
    } else {
      eraseFileNamePartButton.classList.remove("bg-fifth", "text-third");
    }
    playlist.forEach((track) => {
      track.updateTracklistLineText();
    });
  });

  // Le categorySelect permet de changer la catégorie de chaque piste sélectionnée (la piste apparaît en gras)
  categorySelect.addEventListener("change", () => {
    if (selectedTracks.length > 0 && categorySelect.value !== "") {
      for (let track of selectedTracks) {
        track.category = categorySelect.value;
        track.unselectTrack();
      }
    }
    categorySelect.value = "";
  });

  // Cet événement permet d'afficher une modale pour visualiser toute la playlist
  showCompletePlaylistButton.addEventListener("click", () => {
    let modalBackground = document.createElement("div");
    modalBackground.classList.add(
      "bg-transparentDisplay",
      "absolute",
      "top-0",
      "w-[100vw]",
      "h-[100vh]",
      "flex",
      "justify-center",
      "items-center",
      "overflow-hidden"
    );
    document.body.appendChild(modalBackground);
    let modal = document.createElement("div");
    modal.classList.add(
      "m-4",
      "w-[90%]",
      "h-[90%]",
      "flex",
      "bg-third",
      "rounded-3xl",
      "relative"
    );
    modalBackground.appendChild(modal);
    let modalCloseButton = document.createElement("button");
    let modalCloseButtonCross = document.createElement("img");
    modalCloseButtonCross.classList.add(
      "h-4",
      "w-4",
      "group-hover:scale-125",
      "transition-all"
    );
    modalCloseButtonCross.setAttribute("src", "../src/assets/icons/close.png");
    modalCloseButton.appendChild(modalCloseButtonCross);
    modalCloseButton.classList.add(
      "absolute",
      "top-2",
      "right-2",
      "h-10",
      "w-10",
      "shadow-buttonShadow",
      "flex",
      "justify-center",
      "items-center",
      "border",
      "border-solid",
      "border-black",
      "rounded-3xl",
      "transition-all",
      "group"
    );
    modalCloseButton.addEventListener("click", () => {
      document.body.removeChild(modalBackground);
    });
    modalCloseButton.addEventListener("mousedown", () => {
      modalCloseButton.classList.remove("shadow-buttonShadow");
      modalCloseButton.classList.add("translate-x-[3px]", "translate-y-[3px]");
    });
    modalCloseButton.addEventListener("mouseup", () => {
      modalCloseButton.classList.add("shadow-buttonShadow");
      modalCloseButton.classList.remove(
        "translate-x-[3px]",
        "translate-y-[3px]"
      );
    });
    modalCloseButton.addEventListener("mouseleave", () => {
      modalCloseButton.classList.add("shadow-buttonShadow");
      modalCloseButton.classList.remove(
        "translate-x-[3px]",
        "translate-y-[3px]"
      );
    });
    modal.appendChild(modalCloseButton);
    let completePlaylist = document.createElement("div");
    completePlaylist.classList.add(
      "relative",
      "m-16",
      "flex",
      "flex-col",
      "flex-wrap",
      "gap-2",
      "overflow-auto"
    );
    for (let track of playlist) {
      const trackToDisplay = document.createElement("p");
      if (track.category === "true") {
        trackToDisplay.classList.add("font-bold");
      }
      trackToDisplay.innerText = displayTrackNumber
        ? `${track.round?.toString().padStart(2, "0")} - ${track.trackNumber
            .toString()
            .padStart(2, "0")} - ${track.cleanFileTitle()}`
        : `${track.round
            ?.toString()
            .padStart(2, "0")} - ${track.cleanFileTitle()}`;
      completePlaylist.appendChild(trackToDisplay);
    }
    modal.appendChild(completePlaylist);
  });

  hidePlaylistButton.addEventListener("click", () => {
    tracklist.classList.toggle("blur-sm");
    hidePlaylistButton.classList.toggle("bg-fifth");
  });
};

addEventListenersToTracklistButtons();

const cleanDropzone = () => {
  if (playlist.length > 0) {
    if (document.getElementById("playlistInstruction")) {
      document.getElementById("playlistInstruction").classList.add("hidden");
    }
  } else {
    document.getElementById("playlistInstruction").classList.remove("hidden");
  }
};

// Cette fonction ajoute des listeners d'event sur les ghostTracks créées lors des drag dans la playlist
const addListenersToGhostTrack = (ghostTrack, track, type) => {
  if (type === "ghostTrackBefore") {
    ghostTrack.addEventListener("drop", (e) => {
      e.preventDefault();
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      selectedTracks = [];
      if (draggedTracks.length > 0) {
        if (!draggedTracks.includes(track)) {
          draggedTracks.forEach((draggedTrack) => {
            playlist.splice(playlist.indexOf(draggedTrack), 1);
            draggedTrack.addTrackToPlaylistToIndex(playlist.indexOf(track));
            draggedTrack.selectTrack();
          });
        }
      } else {
        let index = 0;
        Object.entries(e.dataTransfer.files).forEach((element) => {
          if (element[1].type.includes("video")) {
            let newTrack = new Track(
              element[1].path.slice(0),
              element[1].name.slice(0),
              1,
              false
            );
            let indexToInsertTrackTo = track.id + index;
            newTrack.addTrackToPlaylistToIndex(indexToInsertTrackTo);
            newTrack.createTracklistLine();
            tracklist.appendChild(newTrack.tracklistLine);
            newTrack.selectTrack();
            index++;
          }
        });
      }
      tracklist.removeChild(ghostTrack);
      updatePlaylistData();
      updateTracklist();
      updateTracklistLength();
    });
    window.localStorage.setItem("playlist", JSON.stringify(playlist));
  }

  if (type === "ghostTrackAfter") {
    ghostTrack.addEventListener("drop", (e) => {
      e.preventDefault();
      selectedTracks.forEach((selectedTrack) => {
        selectedTrack.unselectTrack();
      });
      selectedTracks = [];
      let index = 0;
      if (draggedTracks.length > 0) {
        if (!draggedTracks.includes(track)) {
          draggedTracks.forEach((draggedTrack) => {
            playlist.splice(playlist.indexOf(draggedTrack), 1);
            playlist.splice(
              playlist.indexOf(track) + 1 + index,
              0,
              draggedTrack
            );
            draggedTrack.selectTrack();
            index++;
          });
        }
      } else {
        Object.entries(e.dataTransfer.files).forEach((element) => {
          if (element[1].type.includes("video")) {
            let newTrack = new Track(
              element[1].path.slice(0),
              element[1].name.slice(0),
              1,
              false
            );
            let indexToInsertTrackTo = track.id + 1 + index;
            newTrack.addTrackToPlaylistToIndex(indexToInsertTrackTo);
            newTrack.createTracklistLine();
            tracklist.appendChild(newTrack.tracklistLine);
            newTrack.selectTrack();
            index++;
          }
        });
      }
      tracklist.removeChild(ghostTrack);
      updatePlaylistData();
      updateTracklist();
      updateTracklistLength();
    });
    window.localStorage.setItem("playlist", JSON.stringify(playlist));
  }
};

const createTracklist = () => {
  if (playlist.length > 0) {
    let dataToTransform = [...playlist];
    playlist = [];
    for (let i = 0; i < dataToTransform.length; i++) {
      let newTrack = new Track(
        dataToTransform[i].path,
        dataToTransform[i].title,
        1,
        false
      );
      newTrack.addTrackToPlaylist();
      newTrack.createTracklistLine();
      tracklist.appendChild(newTrack.tracklistLine);
    }
  }
  cleanDropzone();
};

createTracklist();

const updateTracklist = () => {
  for (let i = 0; i < tracklist.children.length; i++) {
    let tracklistLineToUpdate = tracklist.children.item(i);
    if (playlist[i]) {
      let newTracklistLine = playlist[i].createTracklistLine();
      tracklist.replaceChild(newTracklistLine, tracklistLineToUpdate);
    } else {
      tracklist.removeChild(tracklistLineToUpdate);
    }
  }
  cleanDropzone();
};

const updatePlaylistData = () => {
  for (let track of playlist) {
    track.updateTracklistLine();
  }
  window.localStorage.setItem("playlist", JSON.stringify(playlist));
};

const updateTracklistLength = () => {
  loadedTrack
    ? (tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`)
    : (tracklistLength.innerText = `0 / ${playlist.length}`);
};

updateTracklistLength();

//////////////////////// PARTIE TEAMLIST ////////////////////////

// Teams stocke les informations relative à chaque équipe (nom, score)
const teams = JSON.parse(window.localStorage.getItem("teams")) || [];
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
  handleSort(null);
  createTeamList();
};

// Logique de tri lors du clic sur les boutons
const handleSort = (sortType) => {
  if (sortType === "ascAlpha") {
    teams.sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
  } else if (sortType === "descAlpha") {
    teams.sort((a, b) => {
      return a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1;
    });
  } else if (sortType === "ascNum") {
    teams.sort((a, b) => a.score - b.score);
  } else if (sortType === "descNum") {
    teams.sort((a, b) => b.score - a.score);
  } else {
    resetSortButtonsStyle();
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
  clickedButton?.classList.add(
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
    handleSort(null);
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
    createTeamList();
    handleSort(null);
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
    window.display.displayVideoAndScores(
      teams.sort((a, b) => b.score - a.score)
    );
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
