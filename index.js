const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const createWindows = (screens) => {
  // Création de la fenêtre principale
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "mainPreload.js"),
    },
  });
  mainWindow.loadFile("main.html");
  mainWindow.setPosition(screens[0].bounds.x, screens[0].bounds.y);

  // Création de la fenêtre secondaire : si deux écrans ou plus sont branchés,
  // la fenêtre est automatiquement en fullscreen sur l'écran 2
  const secondaryWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "secondaryPreload.js"),
    },
  });
  secondaryWindow.loadFile("secondary.html");
  if (screens[1]) {
    secondaryWindow.setPosition(screens[1].bounds.x, screens[1].bounds.y);
    secondaryWindow.setFullScreen(true);
  }

  // Ecoute de l'événement "playFile" et envoi de l'adresse du fichier à ouvrir à la fenêtre secondaire
  ipcMain.on("playFile", (event, path) => {
    console.log(path);
    console.log(event);
    secondaryWindow.webContents.send("playFile", path);
  });

  ipcMain.on("play", () => {
    secondaryWindow.webContents.send("play");
  });

  ipcMain.on("pause", () => {
    secondaryWindow.webContents.send("pause");
  });

  ipcMain.on("stop", () => {
    secondaryWindow.webContents.send("stop");
  });

  ipcMain.on("mute", () => {
    secondaryWindow.webContents.send("mute");
  });

  ipcMain.on("duration", (event, duration) => {
    mainWindow.webContents.send("getDuration", duration);
  });

  ipcMain.on("current", (event, current) => {
    mainWindow.webContents.send("getCurrent", current);
  });

  ipcMain.on("changeTime", (event, time) => {
    secondaryWindow.webContents.send("changeTime", time);
  });

  ipcMain.on("videoover", () => {
    mainWindow.webContents.send("videoover");
  });

  mainWindow.webContents.openDevTools();
  secondaryWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  const displays = screen.getAllDisplays();
  createWindows(displays);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
});
