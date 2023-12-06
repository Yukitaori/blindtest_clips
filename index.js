const { app, BrowserWindow, screen } = require("electron");
const path = require("node:path");
var fs = require("fs");

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
  if (screens[1]) {
    const secondaryWindow = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, "secondaryPreload.js"),
      },
    });
    secondaryWindow.loadFile("secondary.html");
    secondaryWindow.setPosition(screens[1].bounds.x, screens[1].bounds.y);
    secondaryWindow.setFullScreen(true);
  } else {
    const secondaryWindow = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, "secondaryPreload.js"),
      },
    });
    secondaryWindow.loadFile("secondary.html");
  }
};

app.whenReady().then(() => {
  const displays = screen.getAllDisplays();
  createWindows(displays);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
