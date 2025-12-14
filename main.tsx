import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// Enable live reload for development
if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
  try {
    require('electron-reload')(__dirname, {
      electron: require('electron'),
      hardResetMethod: 'exit',
      // Watch both main process files and renderer files
      chokidar: {
        ignoreInitial: true
      }
    });
  } catch (error) {
    // electron-reload might not be available, continue without it
    console.log('Live reload not available:', error);
  }
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile('index.html');
  }
  mainWindow.webContents.openDevTools();

  // Reload renderer when renderer files change (but not main process files)
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    const chokidar = require('chokidar');
    const watcher = chokidar.watch([
      path.join(__dirname, 'renderer.js'),
      path.join(__dirname, '..', 'dist', 'renderer.js'),
      path.join(__dirname, '..', 'index.html')
    ], {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100
      }
    });

    watcher.on('change', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
