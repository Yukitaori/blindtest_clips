let selectedTrack;
let loadedTrack;
const playlist = [];
const tracklist = document.getElementById("tracklist");

const createTrackList = () => {
  tracklist.innerHTML = "";
  let index = 0;

  playlist.forEach((file) => {
    file.trackNumber = index + 1;
    let track = document.createElement("li");
    let trackbutton = document.createElement("button");
    trackbutton.classList.add("text-left");
    trackbutton.innerText = `${file.trackNumber} - ${file.name}`;
    track.appendChild(trackbutton);
    track.addEventListener("dblclick", () => {
      player.playFile(file, index);
      loadedTrack = file;
    });
    track.addEventListener("click", () => {
      selectedTrack = file;
      createTrackList();
    });
    if (selectedTrack === file) track.classList.add("bg-gray-300");
    tracklist.appendChild(track);
    index++;
  });
};

const dropzone = document.getElementById("dropzone");
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  Object.entries(event.dataTransfer.files).forEach((file) => {
    file[1].id = file[0];
    playlist.push(file[1]);
  });
  createTrackList();
  player.getPlaylist(playlist);
});
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  // TODO mettre en place une animation au dragover
});

// Boutons des contrôles
const timeControl = document.getElementById("timecontrol");
const playButton = document.getElementById("playerplay");
const pauseButton = document.getElementById("playerpause");
const stopButton = document.getElementById("playerstop");
const muteButton = document.getElementById("playermute");
const previousButton = document.getElementById("playerprev");
const nextButton = document.getElementById("playernext");
const volumeControl = document.getElementById("volumecontrol");

// TODO mettre en place des raccourcis clavier pour chaque action
// TODO mettre en place un seul bouton pour Play / Pause ?
pauseButton.addEventListener("click", () => {
  player.pause();
});
playButton.addEventListener("click", () => {
  player.play(selectedTrack);
  loadedTrack = selectedTrack;
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
  // TODO Mettre en place un message qui stoppe le getCurrent pendant la modification de l'input
  player.changeVolume(volumeControl.value);
});
