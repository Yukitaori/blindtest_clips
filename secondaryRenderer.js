const information = document.getElementById("info");
information.innerText = `Cette app utilise Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;
