let selectedTrack;
const playlist = [];
const tracklist = document.getElementById("tracklist");

const createTrackList = () => {
  tracklist.innerHTML = "";
  let index = 1;

  playlist.forEach((file) => {
    file.trackNumber = index;
    let track = document.createElement("li");
    let trackbutton = document.createElement("button");
    trackbutton.classList.add("text-left");
    trackbutton.innerText = `${file.trackNumber} - ${file.name}`;
    track.appendChild(trackbutton);
    track.addEventListener("dblclick", () => player.playFile(file.path));
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
  console.log(event.dataTransfer.files);
  Object.entries(event.dataTransfer.files).forEach((file) => {
    file[1].id = file[0];
    playlist.push(file[1]);
  });
  console.log(playlist);
  createTrackList();
});
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  console.log(event.target);
});

// Boutons des contrôles
const playButton = document.getElementById("playerplay");
const pauseButton = document.getElementById("playerpause");
const stopButton = document.getElementById("playerstop");

pauseButton.addEventListener("click", () => player.pause());
playButton.addEventListener("click", () => player.play());
stopButton.addEventListener("click", () => player.stop());
