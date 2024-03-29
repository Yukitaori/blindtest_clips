//////////////////////// MENU ////////////////////////

// la modale d'info sur l'appli est affichée lors du clic sur le menuItem "Info" dans le menu de l'app
let infoModalCloseButton = document.getElementById("infoModalCloseButton");
let infoModal = document.getElementById("infoModal");
infoModalCloseButton.addEventListener("click", () => {
  infoModal.classList.remove("flex");
  infoModal.classList.add("hidden");
});

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

// Les selectedTracks sont les tracks sélectionnées dans la liste (pas celle qui est chargée dans le player)
let selectedTracks = [];
// La loadedTrack est la track chargée dans le player
let loadedTrack;
// mute permet de suivre l'état mute du videoplayer
let mute = true;
// La playlist permet  l'enregistrement des tracks dans leur oredre de diffusion
let playlist = JSON.parse(window.localStorage.getItem("playlist")) || [];
// Les draggedTracks sont les tracks qui sont dragguées lors du drag'n'drop
let draggedTracks = [];
// Le textFocus sert à vérifier si une input de type texte est focus lorsqu'on appuie sur des touches qui sont des raccourcis (Suppr, Espace...)
let textFocus = false;
// Le displayTrackNumber permet de vérifier si le bouton d'affichage du numéro de piste a été coché ou non
let displayTrackNumber = false;
// Le displayTrackNumber permet de vérifier si le bouton d'affichage du numéro du nom de fichier a été coché ou non
let eraseFileNameNumberPart = false;
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

// Le roundSelect permet de changer la manche de chaque piste sélectionnée (affichage du numéro de manche en début de piste)
roundSelect.addEventListener("change", () => {
  if (selectedTracks.length > 0 && roundSelect.value !== "") {
    for (let track of selectedTracks) {
      track.round = roundSelect.value;
    }
    selectedTracks = [];
    createTrackList();
  }
  roundSelect.value = "";
});

// Le categorySelect permet de changer la catégorie de chaque piste sélectionnée (la piste apparaît en gras)
categorySelect.addEventListener("change", () => {
  if (selectedTracks.length > 0 && categorySelect.value !== "") {
    for (let track of selectedTracks) {
      track.category = categorySelect.value;
      if (categorySelect.value === "true") {
        changeTrackBehavior(
          document.getElementById(`${track.id}`),
          null,
          "category"
        );
      } else {
        changeTrackBehavior(
          document.getElementById(`${track.id}`),
          null,
          "nonCategory"
        );
      }
    }
    selectedTracks.forEach((selectedTrack) => {
      let trackListLine = document.getElementById(`${selectedTrack.id}`);
      changeTrackBehavior(trackListLine, selectedTrack, "unselected");
    });
    selectedTracks = [];
  }
  categorySelect.value = "";
});

// Cette fonction permet d'effacer ou non le numéro en amont de chaque nom de fichier dans le nom de la track en fonction de l'état de eraseFileNameNumberPart
const cleanFileName = (name) => {
  let filenamePartToErase = new RegExp(/^[0-9]{0,}\s{0,}-{0,1}_{0,1}/g);
  return eraseFileNameNumberPart ? name.replace(filenamePartToErase, "") : name;
};

// Cette fonction boucle à travers les tracks de la tracklist pour modifier le nom de la track
const changeTrackTitles = () => {
  for (let i = 0; i < tracklist.children.length; i++) {
    let trackToModify = tracklist.children.item(i);
    trackToModify.querySelector("button").innerText = displayTrackNumber
      ? `${playlist[trackToModify.id].round
          ?.toString()
          .padStart(2, "0")} - ${playlist[trackToModify.id].trackNumber
          .toString()
          .padStart(2, "0")} - ${cleanFileName(
          playlist[trackToModify.id].name
        )}`
      : `${playlist[trackToModify.id].round
          ?.toString()
          .padStart(2, "0")} - ${cleanFileName(
          playlist[trackToModify.id].name
        )}`;
  }
};

// Cette fonction gère le changement de track et réinitialise le display par la même occasion
const handleChangeTrack = (action) => {
  if (action === "next") {
    window.player.nextTrack();
    if (!mute) mute = true;
    if (parseInt(loadedTrack.id) + 1 <= playlist.length - 1) {
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
      });
      selectedTracks = [];
      changeTrackBehavior(
        document.getElementById(`${loadedTrack.id}`),
        playlist[loadedTrack.id],
        "unloaded"
      );
      loadedTrack = playlist[parseInt(loadedTrack.id) + 1];
      changeTrackBehavior(
        document.getElementById(`${loadedTrack.id}`),
        loadedTrack,
        "loaded"
      );
      scrollParentToChild(
        tracklist,
        document.getElementById(`${loadedTrack.id}`)
      );
      tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`;
    }
  } else if (action === "previous") {
    window.player.previousTrack();
    if (!mute) mute = true;
    if (parseInt(loadedTrack.id) - 1 >= 0) {
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
      });
      selectedTracks = [];
      changeTrackBehavior(
        document.getElementById(`${loadedTrack.id}`),
        playlist[loadedTrack.id],
        "unloaded"
      );
      loadedTrack = playlist[parseInt(loadedTrack.id) - 1];
      changeTrackBehavior(
        document.getElementById(`${loadedTrack.id}`),
        loadedTrack,
        "loaded"
      );
      scrollParentToChild(
        tracklist,
        document.getElementById(`${loadedTrack.id}`)
      );
      tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`;
    }
  }
  resetDisplay();
};

// Le eraseFileNamePartButton permet d'effacer ou non le numéro en amont de chaque nom de fichier dans le nom de la track
eraseFileNamePartButton.addEventListener("click", () => {
  eraseFileNameNumberPart = !eraseFileNameNumberPart;
  if (eraseFileNameNumberPart) {
    eraseFileNamePartButton.classList.add("bg-fifth", "text-third");
  } else {
    eraseFileNamePartButton.classList.remove("bg-fifth", "text-third");
  }
  changeTrackTitles();
});

// Le showTrackNumberButton permet d'afficher ou non le numéro de piste de chaque track
showTrackNumberButton.addEventListener("click", () => {
  displayTrackNumber = !displayTrackNumber;
  if (displayTrackNumber) {
    showTrackNumberButton.classList.add("bg-fifth", "text-third");
  } else {
    showTrackNumberButton.classList.remove("bg-fifth", "text-third");
  }
  changeTrackTitles();
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
    modalCloseButton.classList.remove("translate-x-[3px]", "translate-y-[3px]");
  });
  modalCloseButton.addEventListener("mouseleave", () => {
    modalCloseButton.classList.add("shadow-buttonShadow");
    modalCloseButton.classList.remove("translate-x-[3px]", "translate-y-[3px]");
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
          .padStart(2, "0")} - ${track.name}`
      : `${track.round?.toString().padStart(2, "0")} - ${track.name}`;
    completePlaylist.appendChild(trackToDisplay);
  }
  modal.appendChild(completePlaylist);
});

function scrollParentToChild(parent, child) {
  var parentRect = parent.getBoundingClientRect();
  var parentViewableArea = {
    height: parent.clientHeight,
    width: parent.clientWidth,
  };

  var childRect = child.getBoundingClientRect();
  var isViewable =
    childRect.top >= parentRect.top &&
    childRect.bottom <= parentRect.top + parentViewableArea.height;

  if (!isViewable) {
    const scrollTop = childRect.top - parentRect.top;
    const scrollBot = childRect.bottom - parentRect.bottom;
    if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
      parent.scrollTop += scrollTop;
    } else {
      parent.scrollTop += scrollBot;
    }
  }
}

clearTrackListButton.addEventListener("click", () => {
  playlist.splice(0);
  selectedTracks.splice(0);
  window.localStorage.setItem("playlist", JSON.stringify(playlist));
  createTrackList();
  loadedTrack = null;
  window.player.getLoadedTrack(null);
});

// Cette fonction récupère les positions et hauteur des éléments de la playlist pour la localisation du drop
const getPosition = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    height: rect.height,
  };
};

// Cette fonction gère le changement de style des pistes en fonction de si elles sont sélectionnées ou chargées ou non
const changeTrackBehavior = (track, file, type) => {
  if (type === "selected") {
    track.classList.remove("bg-fourth", "text-white");
    track.setAttribute("draggable", "true");
    track.addEventListener("drag", () => {
      selectedTracks.sort((a, b) => b.id - a.id);
      draggedTracks = selectedTracks.slice(0);
    });
    track.addEventListener("dragend", () => {
      draggedTracks = [];
    });
    if (file !== loadedTrack) {
      track.classList.add("bg-fifth", "text-primary");
    }
    track.classList.add("selected");
  } else if (type === "unselected") {
    track.classList.remove("selected", "bg-fifth", "text-primary");
  } else if (type === "loaded") {
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
  } else if (type === "unloaded") {
    track.removeChild(track.firstChild);
    track.classList.remove(
      "loaded",
      "bg-secondary",
      "text-fourth",
      "font-semibold",
      "loaded"
    );
  } else if (type === "category") {
    track.classList.add("font-bold");
  } else if (type === "nonCategory") {
    track.classList.remove("font-bold");
  }
};

// Cette fonction ajoute des listeners d'event sur les ghostTracks créées lors des drag dans la playlist
const addListenersToGhostTrack = (ghostTrack, file, type) => {
  if (type === "ghostTrackBefore") {
    ghostTrack.addEventListener("drop", (e) => {
      e.preventDefault();
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
      });
      selectedTracks = [];
      if (draggedTracks.length > 0) {
        let index = 0;
        if (!draggedTracks.includes(file)) {
          draggedTracks.forEach((element) => {
            playlist.splice(playlist.indexOf(element), 1);
            playlist.splice(playlist.indexOf(file) - index, 0, element);
            selectedTracks.push(element);
            index++;
          });
        }
      } else {
        let index = 0;
        Object.entries(e.dataTransfer.files).forEach((element) => {
          let elementCopy = {};
          elementCopy.path = element[1].path.slice(0);
          elementCopy.name = element[1].name.slice(0);
          elementCopy.round = 1;
          elementCopy.category = false;
          elementCopy.id = file.id + index;
          playlist.splice(playlist.indexOf(file), 0, elementCopy);
          selectedTracks.push(elementCopy);
          index++;
        });
      }
      tracklist.removeChild(ghostTrack);
      createTrackList();
      scrollParentToChild(
        tracklist,
        document.getElementById(`${playlist.indexOf(file)}`)
      );
    });
  }

  if (type === "ghostTrackAfter") {
    ghostTrack.addEventListener("drop", (e) => {
      e.preventDefault();
      let targetId;
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
      });
      selectedTracks = [];
      if (draggedTracks.length > 0) {
        if (!draggedTracks.includes(file)) {
          draggedTracks.forEach((element) => {
            playlist.splice(playlist.indexOf(element), 1);
            playlist.splice(playlist.indexOf(file) + 1, 0, element);
            selectedTracks.push(element);
          });
        }
        targetId = playlist.indexOf(file) + draggedTracks.length;
      } else {
        let index = 0;
        Object.entries(e.dataTransfer.files).forEach((element) => {
          let elementCopy = {};
          elementCopy.path = element[1].path.slice(0);
          elementCopy.name = element[1].name.slice(0);
          elementCopy.round = 1;
          elementCopy.category = false;
          elementCopy.id = file.id + 1 + index;
          playlist.splice(playlist.indexOf(file) + 1 + index, 0, elementCopy);
          selectedTracks.push(elementCopy);
          index++;
        });
        targetId = playlist.indexOf(file) + index;
      }
      tracklist.removeChild(ghostTrack);
      createTrackList();
      scrollParentToChild(tracklist, document.getElementById(`${targetId}`));
    });
  }
};

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
    file.id = index;
    file.trackNumber = index + 1;
    let track = document.createElement("li");
    track.setAttribute("id", `${index}`);
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
    trackbutton.classList.add("track", "text-left");
    if (file.category === "true") {
      trackbutton.classList.add("font-bold");
    }
    // Si une track est survolée, et qu'elle n'est ni selected ni loaded, elle change de style
    // Le style est supprimé lorsque la track n'est plus survolée
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
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
        selectedTracks.splice(selectedTracks[selectedTracks.indexOf(file)], 1);
      });
      window.player.playFile(file);
      if (!mute) mute = true;
      if (loadedTrack) {
        changeTrackBehavior(
          document.getElementById(`${loadedTrack.id}`),
          playlist[loadedTrack.id],
          "unloaded"
        );
      }
      loadedTrack = file;
      loadedTrack
        ? (tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`)
        : (tracklistLength.innerText = `0 / ${playlist.length}`);
      changeTrackBehavior(track, file, "loaded");
      loadedTrack.paused = false;
      resetDisplay();
    });

    // Le clic simple permet juste de sélectionner une piste
    track.addEventListener("click", (e) => {
      if (e.shiftKey) {
        let newSelectedTracks = [...selectedTracks];
        for (
          let i = Math.min(
            selectedTracks[selectedTracks.length - 1]?.id,
            file.id
          );
          i <= Math.max(selectedTracks[selectedTracks.length - 1]?.id, file.id);
          i++
        ) {
          if (!newSelectedTracks.includes(playlist[i])) {
            newSelectedTracks.push(playlist[i]);
            changeTrackBehavior(
              document.getElementById(`${i}`),
              playlist[i],
              "selected"
            );
          }
        }
        selectedTracks = newSelectedTracks;
      } else if (e.ctrlKey) {
        // Si control + clic : ajout de la track cliquée aux selectedTracks
        if (!selectedTracks.includes(file)) {
          selectedTracks.push(file);
          changeTrackBehavior(track, file, "selected");
        } else {
          selectedTracks.splice(selectedTracks.indexOf(file), 1);
          changeTrackBehavior(track, file, "unselected");
        }
      } else {
        // CLic simple = sélection unique
        if (selectedTracks.length > 0) {
          selectedTracks.forEach((selectedTrack) => {
            let trackListLine = document.getElementById(`${selectedTrack.id}`);
            changeTrackBehavior(trackListLine, selectedTrack, "unselected");
          });
        }
        selectedTracks = [file];
        changeTrackBehavior(track, file, "selected");
      }
    });

    // Gestion des appuis sur les touches les raccourcis
    document.addEventListener("keydown", (e) => {
      if (!textFocus) {
        // Lors de l'appui sur Suppr, les pistes sélectionnées (selectedTracks) sont supprimées
        if (e.key === "Delete" && selectedTracks.length > 0) {
          e.preventDefault();
          selectedTracks.forEach((element) => {
            if (element !== loadedTrack) {
              playlist.splice(playlist.indexOf(element), 1);
              selectedTracks.splice(selectedTracks.indexOf(element), 1);
            }
          });
          createTrackList();
        }
        // Lors de l'appui sur la Entrée, si une seule track est sélectionnée, elle est chargée et lancée
        if (
          e.key == "Enter" &&
          selectedTracks.length === 1 &&
          selectedTracks.includes(file)
        ) {
          e.preventDefault();
          selectedTracks.forEach((selectedTrack) => {
            let trackListLine = document.getElementById(`${selectedTrack.id}`);
            changeTrackBehavior(trackListLine, selectedTrack, "unselected");
          });
          selectedTracks = [];
          window.player.playFile(file);
          if (!mute) mute = true;
          loadedTrack = file;
          loadedTrack
            ? (tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`)
            : (tracklistLength.innerText = `0 / ${playlist.length}`);
          changeTrackBehavior(
            document.getElementById(`${loadedTrack.id}`),
            playlist[loadedTrack.id],
            "unloaded"
          );
          changeTrackBehavior(track, file, "loaded");
          createTrackList();
        }
        // Lors de l'appui sur la barre espace, la pause est activée si la video est en cours de lecture, ou celle-ci reprend si elle est en pause
        if (
          e.key === " " &&
          loadedTrack &&
          (keyDownState[e.key] === false || !keyDownState[e.key])
        ) {
          e.preventDefault();
          if (loadedTrack.paused) {
            window.player.play();
            loadedTrack.paused = false;
          } else {
            window.player.pause();
            loadedTrack.paused = true;
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

    // Création du témoin (ghostTrack) de localisation de l'endroit où les pistes vont être insérées lors que l'on drag les fichiers par-dessus
    track.addEventListener("dragover", (e) => {
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
        e.clientY >= getPosition(track).y &&
        e.clientY < getPosition(track).y + getPosition(track).height / 2
      ) {
        if (!document.getElementById("ghostTrackBefore")) {
          if (document.getElementById("ghostTrackAfter")) {
            tracklist.removeChild(document.getElementById("ghostTrackAfter"));
          }
          ghostTrack.setAttribute("id", "ghostTrackBefore");
          addListenersToGhostTrack(ghostTrack, file, "ghostTrackBefore");
          tracklist.insertBefore(ghostTrack, track);
        }
      } else {
        // Si le drag est effectuée sur la moitié du bas de la track visée, la ghostTrack est générée après la piste
        if (!document.getElementById("ghostTrackAfter")) {
          if (document.getElementById("ghostTrackBefore")) {
            tracklist.removeChild(document.getElementById("ghostTrackBefore"));
          }
          ghostTrack.setAttribute("id", "ghostTrackAfter");
          addListenersToGhostTrack(ghostTrack, file, "ghostTrackAfter");
          track.insertAdjacentElement("afterend", ghostTrack);
        }
      }
    });
    // Suppression du témoin de localisation de l'endroit où les pistes vont être insérées lors que l'on arrête le drag
    track.addEventListener("dragend", (e) => {
      e.preventDefault();
      let ghostTrack =
        document.getElementById("ghostTrackAfter") ||
        document.getElementById("ghostTrackBefore");
      if (ghostTrack) tracklist.removeChild(ghostTrack);
    });

    // Au drop sur une track existante, les fichiers déposés sont insérés dans la playlist à l'index ou l'index suivant cette track selon la position de la ghostTrack
    // Les tracks déposées deviennent les selectedTracks (si besoin de les supprimer immédiatement)
    track.addEventListener("drop", (e) => {
      let targetId;
      e.preventDefault();
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
      });
      selectedTracks = [];
      if (draggedTracks.length > 0) {
        if (
          e.clientY >= getPosition(track).y &&
          e.clientY < getPosition(track).y + getPosition(track).height / 2
        ) {
          if (!draggedTracks.includes(file)) {
            let index = 0;
            draggedTracks.forEach((element) => {
              playlist.splice(playlist.indexOf(element), 1);
              playlist.splice(playlist.indexOf(file) - index, 0, element);
              selectedTracks.push(element);
              index++;
            });
          }
          targetId = playlist.indexOf(file);
        } else {
          if (!draggedTracks.includes(file)) {
            draggedTracks.forEach((element) => {
              playlist.splice(playlist.indexOf(element), 1);
              playlist.splice(playlist.indexOf(file) + 1, 0, element);
              selectedTracks.push(element);
            });
          }
          targetId = playlist.indexOf(file) + draggedTracks.length;
        }
      } else {
        if (
          e.clientY >= getPosition(track).y &&
          e.clientY < getPosition(track).y + getPosition(track).height / 2
        ) {
          let index = 0;
          Object.entries(e.dataTransfer.files).forEach((element) => {
            let elementCopy = {};
            elementCopy.path = element[1].path.slice(0);
            elementCopy.name = element[1].name.slice(0);
            elementCopy.round = 1;
            elementCopy.category = false;
            elementCopy.id = file.id + index;
            playlist.splice(playlist.indexOf(file), 0, elementCopy);
            selectedTracks.push(elementCopy);
            index++;
          });
          targetId = playlist.indexOf(file);
        } else {
          let index = 0;
          Object.entries(e.dataTransfer.files).forEach((element) => {
            let elementCopy = {};
            elementCopy.path = element[1].path.slice(0);
            elementCopy.name = element[1].name.slice(0);
            elementCopy.round = 1;
            elementCopy.category = false;
            elementCopy.id = file.id + index;
            playlist.splice(playlist.indexOf(file) + 1 + index, 0, elementCopy);
            selectedTracks.push(elementCopy);
            index++;
          });
          targetId = playlist.indexOf(file) + index;
        }
      }
      createTrackList();
      scrollParentToChild(tracklist, document.getElementById(`${targetId}`));
    });

    // Changement de style des tracks selon si elles sont selected ou loaded
    if (selectedTracks.includes(file) && file !== loadedTrack) {
      changeTrackBehavior(track, file, "selected");
    }
    if (loadedTrack === file) {
      changeTrackBehavior(track, file, "loaded");
      window.player.getLoadedTrack(file);
    }
    trackbutton.innerText = displayTrackNumber
      ? `${file.round?.toString().padStart(2, "0")} - ${file.trackNumber
          .toString()
          .padStart(2, "0")} - ${cleanFileName(file.name)}`
      : `${file.round?.toString().padStart(2, "0")} - ${cleanFileName(
          file.name
        )}`;
    track.appendChild(trackbutton);
    tracklist.appendChild(track);
    dropzone.appendChild(tracklist);
    index++;
  });
  window.player.getPlaylist(playlist);
  window.player.getPlaylist(playlist);
  window.localStorage.setItem("playlist", JSON.stringify(playlist));
  loadedTrack
    ? (tracklistLength.innerText = `${loadedTrack.trackNumber} / ${playlist.length}`)
    : (tracklistLength.innerText = `0 / ${playlist.length}`);
};
createTrackList();

// Gestion du drag'n'drop sur la zone d'affichage des pistes video
dropzone.addEventListener("drop", (e) => {
  dropzone.classList.remove("bg-fifth");
  e.preventDefault();
  // Au drop, la playlist est de nouveau générée intégralement et transmise au preload pour la gestion
  if (e.target === dropzone) {
    if (selectedTracks.length > 0) {
      selectedTracks.forEach((selectedTrack) => {
        let trackListLine = document.getElementById(`${selectedTrack.id}`);
        changeTrackBehavior(trackListLine, selectedTrack, "unselected");
        selectedTracks.splice(
          selectedTracks[selectedTracks.indexOf(selectedTrack)],
          1
        );
      });
    }
    Object.entries(e.dataTransfer.files).forEach((element) => {
      if (element[1].type.includes("video")) {
        let elementCopy = {};
        elementCopy.path = element[1].path.slice(0);
        elementCopy.name = element[1].name.slice(0);
        elementCopy.round = 1;
        elementCopy.category = false;
        elementCopy.id = playlist.length;
        playlist.push(elementCopy);
        selectedTracks.push(elementCopy);
      }
    });
    createTrackList();
    if (tracklist.lastChild)
      scrollParentToChild(tracklist, tracklist.lastChild);
  }
});

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
  window.player.displaySlidingBackgroundColor(timeControl, "primary", "third");
});
timeControl.addEventListener("input", (e) => {
  window.player.stopGetCurrent();
  window.player.displaySlidingInputValue(e.currentTarget.value);
  window.player.displaySlidingBackgroundColor(timeControl, "primary", "third");
});

// Gestion de l'input relative au volume de la video
volumeControl.addEventListener("change", () => {
  window.player.changeVolume(volumeControl.value);
  window.player.displaySlidingBackgroundColor(volumeControl, "fifth", "third");
});
volumeControl.addEventListener("input", (e) => {
  window.player.changeVolume(e.currentTarget.value);
  window.player.displaySlidingBackgroundColor(volumeControl, "fifth", "third");
});
window.player.displaySlidingBackgroundColor(volumeControl, "fifth", "third");

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
