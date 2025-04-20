// Electron-Hauptprozess
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Fensterreferenz global halten, um GC zu vermeiden
let mainWindow;

function createWindow() {
  // Hauptfenster erstellen
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 650,
    minHeight: 500,
    backgroundColor: '#2C2E3B',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build', 'logo512.png')
  });

  // In Produktionsumgebung laden wir die aus React gebaute App
  const startUrl = url.format({
    pathname: path.join(__dirname, 'build', 'index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  mainWindow.loadURL(startUrl);

  // Menüleiste in Produktion ausblenden
  if (process.env.NODE_ENV === 'production') {
    mainWindow.setMenuBarVisibility(false);
  } else {
    // DevTools in Entwicklungsumgebung öffnen
    mainWindow.webContents.openDevTools();
  }

  // Ereignisbehandlung für Fensterschließung
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App-Initialisierung
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Unter macOS Fenster neu erstellen, wenn auf Dock-Icon geklickt wird
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// App beenden, wenn alle Fenster geschlossen sind (außer auf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC-Handlers für Kommunikation mit der UI
ipcMain.handle('check-microphone-permission', async () => {
  // Unter macOS und Windows wird der Zugriff vom System abgefragt
  // Hier könnte man für Linux zusätzliche Logik implementieren
  return true;
});
