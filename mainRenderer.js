const information = document.getElementById("info");
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;

let playlistUrl = null;
const playlistButton = document.getElementById("getplaylist");
playlistButton.addEventListener("click", () => {
  if (playlistUrl) {
    fs.read(playlistUrl);
  }
});

// const chooseFile = document.getElementById("choosefile");
// chooseFile.addEventListener("change", () => {
//   const objectURL = chooseFile.files[0].webkitRelativePath;
//   playlistUrl = objectURL;
// });
