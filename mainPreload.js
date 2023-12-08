const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("fs", {
  read: (dir) => ipcRenderer.send("readdir", dir),
});

// Ecoute de l'événement createTrackList
ipcRenderer.on("createTrackList", (event, array) => {
  const tracklist = document.getElementById("tracklist");
  console.log(array);
  for (file of array) {
    let listItem = document.createElement("li");
    let button = document.createElement("button");
    let p = document.createElement("p");
    p.innerText = file;
    button.appendChild(p);
    listItem.appendChild(button);
    tracklist.appendChild(listItem);
  }
});
