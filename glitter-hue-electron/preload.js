// Electron Preload-Skript - sichere Bridge zwischen Renderer und Main-Prozess
const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für den Renderer-Prozess
contextBridge.exposeInMainWorld('electronAPI', {
  // Beispiel für eine API-Methode, die mit dem Main-Prozess kommuniziert
  checkMicrophonePermission: () => ipcRenderer.invoke('check-microphone-permission'),
  
  // Version der App abfragen
  getAppVersion: () => {
    // App-Version aus der package.json lesen
    return process.env.npm_package_version || '1.0.0';
  },

  // Plattforminformationen
  getPlatform: () => process.platform
});

// Logger für die Entwicklung
console.log('Preload-Skript geladen');
