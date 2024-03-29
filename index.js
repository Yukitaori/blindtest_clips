const {
  app,
  Menu,
  MenuItem,
  BrowserWindow,
  ipcMain,
  screen,
} = require("electron");
const path = require("node:path");

// Fonction de création du menu custom de l'appli
const createMenu = (defaultMenu, win) => {
  let newMenu = new Menu();
  const info = new MenuItem({
    label: "Info",
    id: "info",
    click: () => {
      win.webContents.send("openInfoMenu");
    },
  });
  defaultMenu.items.forEach((item) => newMenu.append(item));
  newMenu.append(info);
  return newMenu;
};

const createWindows = (screens) => {
  // Création de la fenêtre principale
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "./main_window/mainPreload.js"),
    },
  });
  mainWindow.loadFile("./main_window/main.html");
  mainWindow.setPosition(screens[0].bounds.x, screens[0].bounds.y);
  mainWindow.setFullScreen(true);
  mainWindow.openDevTools();

  // Création de la fenêtre secondaire : si deux écrans ou plus sont branchés,
  // la fenêtre est automatiquement en fullscreen sur l'écran 2
  const secondaryWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "./secondary_window/secondaryPreload.js"),
    },
  });
  secondaryWindow.loadFile("./secondary_window/secondary.html");

  if (screens[1]) {
    secondaryWindow.setPosition(screens[1].bounds.x, screens[1].bounds.y);
    secondaryWindow.setFullScreen(true);
    secondaryWindow.setMenuBarVisibility(false);
  }

  // Gestion des messages liés au player
  ipcMain.on("playFile", (event, path) => {
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

  ipcMain.on("stopGetCurrent", () => {
    secondaryWindow.webContents.send("stopGetCurrent");
  });

  ipcMain.on("changeTime", (event, time) => {
    secondaryWindow.webContents.send("changeTime", time);
  });

  ipcMain.on("changeVolume", (event, volume) => {
    secondaryWindow.webContents.send("changeVolume", volume);
  });

  ipcMain.on("videoover", () => {
    mainWindow.webContents.send("videoover");
  });

  // Gestion des messages liés au display
  ipcMain.on("displayVideoOnly", () => {
    secondaryWindow.webContents.send("displayVideoOnly");
  });

  ipcMain.on("displayVideoAndScores", (event, teams) => {
    secondaryWindow.webContents.send("displayVideoAndScores", teams);
  });

  ipcMain.on("displayVideoAndPodium", (event, teams) => {
    secondaryWindow.webContents.send("displayVideoAndPodium", teams);
  });

  ipcMain.on("displayImage", (event, path) => {
    secondaryWindow.webContents.send("displayImage", path);
  });

  ipcMain.on("displayGif", (event, path) => {
    secondaryWindow.webContents.send("displayGif", path);
  });
  ipcMain.on("displayInfo", (event, isDisplay, displayRoundsState) => {
    secondaryWindow.webContents.send(
      "displayInfo",
      isDisplay,
      displayRoundsState
    );
  });
  ipcMain.on("displayCategory", (event, category, isDisplay) => {
    secondaryWindow.webContents.send("displayCategory", category, isDisplay);
  });

  // Gestion du FullScreen de la secondaryWindow (lors du double-click sur l'écran 2 ou ctl+f sur l'écran 1)
  ipcMain.on("fullscreen", () => {
    if (secondaryWindow.fullScreen) {
      secondaryWindow.setFullScreen(false);
      secondaryWindow.setMenuBarVisibility(true);
    } else {
      secondaryWindow.setFullScreen(true);
      secondaryWindow.setMenuBarVisibility(false);
    }
  });
  return { mainWindow, secondaryWindow };
};

app.whenReady().then(() => {
  const displays = screen.getAllDisplays();
  let { mainWindow } = createWindows(displays);
  const defaultMenu = Menu.getApplicationMenu();
  mainWindow.setMenu(createMenu(defaultMenu, mainWindow));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
});
