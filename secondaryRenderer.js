const information = document.getElementById("info");
information.innerText = `Cette app utilise Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;

const videoPlayer = document.getElementById("videoplayer");
videoPlayer.setAttribute(
  "src",
  "E:/Blindtests/Catégories/Acteurs/02 Gorillaz - Stylo (Bruce Willis).mp4"
);
